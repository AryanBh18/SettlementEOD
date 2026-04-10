from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clearing_result import ClearingResult
from app.models.settlement_file import SettlementFile
from app.repositories.clearing_repo import ClearingRepo
from app.repositories.log_repo import LogRepo
from app.repositories.settlement_repo import SettlementRepo
from app.repositories.transaction_repo import TransactionRepo
from app.schemas.eod import (
    BankPositionResponse,
    EODRunResponse,
    FileInfoResponse,
    ValidationCheckResponse,
)
from app.services.clearing_engine import ClearingEngine
from app.services.file_generator import FileGenerator
from app.services.settlement_engine import SettlementEngine
from app.services.transaction_service import TransactionService
from app.services.validation_engine import ValidationEngine


class EODOrchestrator:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.txn_repo = TransactionRepo(db)
        self.clearing_repo = ClearingRepo(db)
        self.settlement_repo = SettlementRepo(db)
        self.log_repo = LogRepo(db)
        self.txn_service = TransactionService(self.txn_repo)

    async def run(self, eod_date: date, force_rerun: bool = False) -> EODRunResponse:
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

            file_record = SettlementFile(
                file_name=file_name,
                file_path=file_path,
                total_debit=total_debit,
                total_credit=total_credit,
                eod_date=eod_date,
                status="SUCCESS",
            )
            await self.settlement_repo.save_file_record(file_record)
            await self.log_repo.log(
                "FILE_GENERATION", "SUCCESS",
                f"Generated NSI file: {file_name}",
                eod_date,
            )

            # 6. Run validations
            transacting_bank_ids = set()
            for txn in transactions:
                transacting_bank_ids.add(txn.source_bank_id)
                transacting_bank_ids.add(txn.destination_bank_id)

            checks = ValidationEngine.run_all_checks(
                positions, instructions, file_content,
                total_debit, total_credit, transacting_bank_ids,
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
                    "All 6 validation checks passed",
                    eod_date,
                )

            await self.log_repo.log(
                "EOD_COMPLETE", overall_status,
                f"EOD processing completed with status: {overall_status}",
                eod_date,
            )

            await self.db.commit()

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

    async def _cleanup_previous_run(self, eod_date: date) -> None:
        await self.clearing_repo.delete_by_date(eod_date)
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
