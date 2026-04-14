from datetime import date
from decimal import Decimal
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clearing_result import ClearingResult
from app.models.bilateral_settlement import BilateralSettlement
from app.models.settlement_file import SettlementFile
from app.repositories.clearing_repo import ClearingRepo
from app.repositories.bilateral_repo import BilateralRepo
from app.repositories.log_repo import LogRepo
from app.repositories.settlement_repo import SettlementRepo
from app.repositories.transaction_repo import TransactionRepo
from app.repositories.audit_repo import AuditRepo
from app.schemas.eod import (
    BankPositionResponse,
    EODRunResponse,
    FileInfoResponse,
    ValidationCheckResponse,
)
from app.services.bilateral_engine import BilateralEngine
from app.services.clearing_engine import ClearingEngine
from app.services.file_generator import FileGenerator
from app.services.notification_service import NotificationService
from app.services.settlement_engine import SettlementEngine
from app.services.transaction_service import TransactionService
from app.services.validation_engine import ValidationEngine

logger = logging.getLogger(__name__)


class EODOrchestrator:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.txn_repo = TransactionRepo(db)
        self.clearing_repo = ClearingRepo(db)
        self.bilateral_repo = BilateralRepo(db)
        self.settlement_repo = SettlementRepo(db)
        self.log_repo = LogRepo(db)
        self.audit_repo = AuditRepo(db)
        self.txn_service = TransactionService(self.txn_repo)

    async def run(
        self,
        eod_date: date,
        force_rerun: bool = False,
        max_retries: int = 0,
        user_id: int | None = None,
    ) -> EODRunResponse:
        for attempt in range(max_retries + 1):
            try:
                if attempt > 0:
                    await self.log_repo.log(
                        "EOD_RETRY", "INFO",
                        f"Retry attempt {attempt}/{max_retries} for {eod_date}",
                        eod_date,
                    )
                return await self._execute_run(eod_date, force_rerun, user_id)
            except Exception as exc:
                if attempt < max_retries:
                    logger.warning(f"EOD attempt {attempt + 1} failed: {exc}, retrying...")
                    await self._cleanup_previous_run(eod_date)
                    await self.db.commit()
                    continue
                else:
                    raise

    async def _execute_run(
        self, eod_date: date, force_rerun: bool, user_id: int | None
    ) -> EODRunResponse:
        # 1. Idempotency check
        already_exists = await self.clearing_repo.exists_for_date(eod_date)
        if already_exists and not force_rerun:
            await self.log_repo.log(
                "EOD_SKIPPED", "INFO",
                f"EOD already processed for {eod_date}. Use force_rerun=true to reprocess.",
                eod_date,
            )
            await self.db.commit()
            return await self._build_existing_response(eod_date)

        # If force re-run, clean up previous results
        if already_exists and force_rerun:
            await self._cleanup_previous_run(eod_date)

        try:
            await self.log_repo.log("EOD_START", "INFO", f"Starting EOD processing for {eod_date}", eod_date)

            # Audit log
            if user_id:
                await self.audit_repo.log(
                    user_id=user_id, action="EOD_RUN",
                    resource="eod", resource_id=str(eod_date),
                    details={"force_rerun": force_rerun},
                )

            # 2. Fetch transactions
            transactions = await self.txn_service.fetch_transactions(eod_date)
            txn_count = len(transactions)
            await self.log_repo.log(
                "FETCH_TRANSACTIONS", "SUCCESS",
                f"Fetched {txn_count} successful transactions for {eod_date}",
                eod_date,
            )

            # 3. Calculate clearing positions
            positions = ClearingEngine.calculate_positions(transactions)
            await self._store_clearing_results(positions, eod_date)
            await self.log_repo.log(
                "CLEARING", "SUCCESS",
                f"Calculated clearing positions for {len(positions)} banks",
                eod_date,
            )

            # 4. Generate settlement instructions
            instructions = SettlementEngine.generate_instructions(positions)
            total_debit, total_credit = SettlementEngine.get_totals(instructions)
            await self.log_repo.log(
                "SETTLEMENT", "SUCCESS",
                f"Generated {len(instructions)} settlement instructions. "
                f"Total debit={total_debit:.2f}, credit={total_credit:.2f}",
                eod_date,
            )

            # 5. Generate NSI file
            file_name, file_path = FileGenerator.generate_nsi_file(
                eod_date, instructions, total_debit, total_credit
            )
            file_content = FileGenerator.read_nsi_file(file_path)

            # Delete any stale settlement file record before inserting (handles partial previous runs)
            await self.settlement_repo.delete_by_date(eod_date)
            await self.db.flush()

            file_record = SettlementFile(
                file_name=file_name,
                file_path=file_path,
                total_debit=total_debit,
                total_credit=total_credit,
                eod_date=eod_date,
                status="SUCCESS",
                file_type="COMBINED",
            )
            await self.settlement_repo.save_file_record(file_record)

            # 5b. Generate per-bank NSI files
            per_bank_files = FileGenerator.generate_per_bank_files(eod_date, positions, instructions)
            for bank_code, (pf_name, pf_path, pf_debit, pf_credit) in per_bank_files.items():
                bank_file = SettlementFile(
                    file_name=pf_name,
                    file_path=pf_path,
                    total_debit=pf_debit,
                    total_credit=pf_credit,
                    eod_date=eod_date,
                    status="SUCCESS",
                    file_type="PER_BANK",
                    bank_code=bank_code,
                )
                await self.settlement_repo.save_file_record(bank_file)

            await self.log_repo.log(
                "FILE_GENERATION", "SUCCESS",
                f"Generated NSI file: {file_name} + {len(per_bank_files)} per-bank files",
                eod_date,
            )

            # 5c. Calculate bilateral settlements
            bilateral_results = BilateralEngine.calculate_bilateral_settlements(transactions)
            await self._store_bilateral_results(bilateral_results, eod_date)
            await self.log_repo.log(
                "BILATERAL_SETTLEMENT", "SUCCESS",
                f"Calculated bilateral settlements for {len(bilateral_results)} bank pairs",
                eod_date,
            )

            # 6. Run validations (including duplicate check)
            transacting_bank_ids = set()
            for txn in transactions:
                transacting_bank_ids.add(txn.source_bank_id)
                transacting_bank_ids.add(txn.destination_bank_id)

            references = [txn.reference for txn in transactions if txn.reference]

            checks = ValidationEngine.run_all_checks(
                positions, instructions, file_content,
                total_debit, total_credit, transacting_bank_ids,
                references=references,
            )

            for check in checks:
                await self.log_repo.save_validation_result(
                    check.check_name, check.status, check.message, eod_date
                )

            all_passed = ValidationEngine.all_passed(checks)
            overall_status = "SUCCESS" if all_passed else "FAILED"

            if not all_passed:
                file_record.status = "FAILED"
                failed = [c for c in checks if c.status == "FAIL"]
                await self.log_repo.log(
                    "VALIDATION", "FAILED",
                    f"{len(failed)} validation check(s) failed: "
                    + ", ".join(c.check_name for c in failed),
                    eod_date,
                )
            else:
                await self.log_repo.log(
                    "VALIDATION", "SUCCESS",
                    f"All {len(checks)} validation checks passed",
                    eod_date,
                )

            await self.log_repo.log(
                "EOD_COMPLETE", overall_status,
                f"EOD processing completed with status: {overall_status}",
                eod_date,
            )

            await self.db.commit()

            # Send notification (non-blocking)
            try:
                await NotificationService.send_eod_notification(
                    eod_date, overall_status, txn_count, total_debit, total_credit,
                )
            except Exception:
                logger.warning("Notification sending failed", exc_info=True)

            return EODRunResponse(
                eod_date=eod_date,
                status=overall_status,
                total_transactions=txn_count,
                total_debit=total_debit,
                total_credit=total_credit,
                bank_positions=[
                    BankPositionResponse(
                        bank_id=p.bank_id,
                        bank_code=p.bank_code,
                        bank_name=p.bank_name,
                        total_incoming=p.total_incoming,
                        total_outgoing=p.total_outgoing,
                        net_position=p.net_position,
                    )
                    for p in positions.values()
                ],
                validation_results=[
                    ValidationCheckResponse(
                        check_name=c.check_name,
                        status=c.status,
                        message=c.message,
                    )
                    for c in checks
                ],
                file_info=FileInfoResponse(
                    file_name=file_record.file_name,
                    total_debit=file_record.total_debit,
                    total_credit=file_record.total_credit,
                    eod_date=file_record.eod_date,
                    status=file_record.status,
                    created_at=file_record.created_at,
                ),
            )

        except Exception as exc:
            await self.log_repo.log(
                "EOD_FAILED", "ERROR", f"EOD processing failed: {str(exc)}", eod_date
            )
            await self.db.commit()
            raise

    async def _store_clearing_results(
        self, positions: dict, eod_date: date
    ) -> None:
        results = [
            ClearingResult(
                bank_id=pos.bank_id,
                total_incoming=pos.total_incoming,
                total_outgoing=pos.total_outgoing,
                net_position=pos.net_position,
                eod_date=eod_date,
            )
            for pos in positions.values()
        ]
        await self.clearing_repo.save_results(results)

    async def _store_bilateral_results(
        self, bilateral_results: list, eod_date: date
    ) -> None:
        records = [
            BilateralSettlement(
                settlement_date=eod_date,
                bank_a_id=r.bank_a_id,
                bank_b_id=r.bank_b_id,
                bank_a_owes_b=r.bank_a_owes_b,
                bank_b_owes_a=r.bank_b_owes_a,
                net_amount=r.net_amount,
                net_direction=r.net_direction,
            )
            for r in bilateral_results
        ]
        await self.bilateral_repo.save_results(records)

    async def _cleanup_previous_run(self, eod_date: date) -> None:
        await self.clearing_repo.delete_by_date(eod_date)
        await self.bilateral_repo.delete_by_date(eod_date)
        await self.settlement_repo.delete_by_date(eod_date)
        await self.log_repo.delete_logs_by_date(eod_date)
        await self.log_repo.delete_validations_by_date(eod_date)
        await self.db.flush()

    async def _build_existing_response(self, eod_date: date) -> EODRunResponse:
        clearing_results = await self.clearing_repo.get_by_date(eod_date)
        validation_results = await self.log_repo.get_validation_results(eod_date)
        file_record = await self.settlement_repo.get_by_date(eod_date)
        txn_count = await self.txn_service.count_transactions(eod_date)

        total_debit = Decimal("0.00")
        total_credit = Decimal("0.00")
        if file_record:
            total_debit = file_record.total_debit
            total_credit = file_record.total_credit

        overall_status = "SUCCESS"
        if any(v.status == "FAIL" for v in validation_results):
            overall_status = "FAILED"

        return EODRunResponse(
            eod_date=eod_date,
            status=overall_status,
            total_transactions=txn_count,
            total_debit=total_debit,
            total_credit=total_credit,
            bank_positions=[
                BankPositionResponse(
                    bank_id=cr.bank_id,
                    bank_code=cr.bank.bank_code,
                    bank_name=cr.bank.name,
                    total_incoming=cr.total_incoming,
                    total_outgoing=cr.total_outgoing,
                    net_position=cr.net_position,
                )
                for cr in clearing_results
            ],
            validation_results=[
                ValidationCheckResponse(
                    check_name=v.check_name,
                    status=v.status,
                    message=v.message,
                )
                for v in validation_results
            ],
            file_info=FileInfoResponse(
                file_name=file_record.file_name,
                total_debit=file_record.total_debit,
                total_credit=file_record.total_credit,
                eod_date=file_record.eod_date,
                status=file_record.status,
                created_at=file_record.created_at,
            ) if file_record else None,
        )
