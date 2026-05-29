import io
import logging
import zipfile
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.security import get_current_user, require_role
from app.models.user import User
from app.repositories.bilateral_repo import BilateralRepo
from app.repositories.clearing_repo import ClearingRepo
from app.repositories.log_repo import LogRepo
from app.repositories.settlement_repo import SettlementRepo
from app.repositories.transaction_repo import TransactionRepo
from app.schemas.bilateral import (
    BankStatementResponse,
    BankStatementsListResponse,
    BilateralSettlementListResponse,
    BilateralSettlementResponse,
    CounterpartyBreakdownResponse,
)
from app.schemas.eod import (
    BankPositionResponse,
    EODRunRequest,
    EODRunResponse,
    EODStatusResponse,
    FileInfoResponse,
    ProcessLogResponse,
    ValidationCheckResponse,
)
from app.services.bilateral_engine import BilateralEngine, BilateralResult
from app.services.clearing_engine import BankPosition
from app.services.eod_orchestrator import EODOrchestrator
from app.services.file_generator import FileGenerator
from app.services.report_generator import ReportGenerator
from app.services.settlement_engine import SettlementEngine
from app.services.validation_engine import ValidationCheck

router = APIRouter(prefix="/eod", tags=["EOD Settlement"])
logger = logging.getLogger(__name__)


@router.post("/run", response_model=EODRunResponse)
async def run_eod(
    request: EODRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "OPERATOR")),
):
    orchestrator = EODOrchestrator(db)
    try:
        result = await orchestrator.run(
            request.eod_date,
            force_rerun=request.force_rerun,
            max_retries=request.max_retries,
            user_id=current_user.id,
        )
        return result
    except Exception as exc:
        logger.error("EOD run failed for date %s by user %s", request.eod_date, current_user.id, exc_info=exc)
        raise HTTPException(
            status_code=500,
            detail="EOD processing failed. Contact your administrator with the X-Request-ID response header.",
        )


@router.get("/status/{eod_date}", response_model=EODStatusResponse)
async def get_eod_status(
    eod_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clearing_repo = ClearingRepo(db)
    log_repo = LogRepo(db)
    settlement_repo = SettlementRepo(db)
    txn_repo = TransactionRepo(db)

    clearing_results = await clearing_repo.get_by_date(eod_date)
    validation_results = await log_repo.get_validation_results(eod_date)
    process_logs = await log_repo.get_logs(eod_date)
    file_record = await settlement_repo.get_by_date(eod_date)
    txn_count = await txn_repo.count_by_date(eod_date)

    # Determine overall status
    if not clearing_results and not process_logs:
        status = "NOT_RUN"
    elif any(v["status"] == "FAIL" for v in validation_results):
        status = "FAILED"
    else:
        status = "SUCCESS"

    total_debit = Decimal("0.00")
    total_credit = Decimal("0.00")
    if file_record:
        total_debit = file_record.total_debit
        total_credit = file_record.total_credit

    return EODStatusResponse(
        eod_date=eod_date,
        status=status,
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
                check_name=v["check_name"],
                status=v["status"],
                message=v["message"],
                triggered_by=v["triggered_by"],
                username=v["username"],
                created_at=v["created_at"],
            )
            for v in validation_results
        ],
        process_logs=[
            ProcessLogResponse(
                id=log["id"],
                process_name=log["process_name"],
                status=log["status"],
                message=log["message"],
                eod_date=log["eod_date"],
                triggered_by=log["triggered_by"],
                username=log["username"],
                created_at=log["created_at"],
            )
            for log in process_logs
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


@router.get("/report/{eod_date}")
async def export_report(
    eod_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clearing_repo = ClearingRepo(db)
    log_repo = LogRepo(db)
    settlement_repo = SettlementRepo(db)

    clearing_results = await clearing_repo.get_by_date(eod_date)
    validation_results = await log_repo.get_validation_results(eod_date)
    file_record = await settlement_repo.get_by_date(eod_date)

    if not clearing_results:
        raise HTTPException(status_code=404, detail=f"No EOD data found for {eod_date}")

    positions = {
        cr.bank_id: BankPosition(
            bank_id=cr.bank_id, bank_code=cr.bank.bank_code,
            bank_name=cr.bank.name, total_incoming=cr.total_incoming,
            total_outgoing=cr.total_outgoing, net_position=cr.net_position,
        )
        for cr in clearing_results
    }

    instructions = SettlementEngine.generate_instructions(positions)
    total_debit, total_credit = SettlementEngine.get_totals(instructions)

    checks = [
        ValidationCheck(v["check_name"], v["status"], v["message"]) for v in validation_results
    ]

    csv_content = ReportGenerator.generate_positions_csv(
        eod_date, positions, instructions, total_debit, total_credit, checks,
    )

    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=eod_report_{eod_date}.csv"},
    )


@router.get("/bilateral/{eod_date}", response_model=BilateralSettlementListResponse)
async def get_bilateral_settlements(
    eod_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bilateral_repo = BilateralRepo(db)
    results = await bilateral_repo.get_by_date(eod_date)

    if not results:
        raise HTTPException(status_code=404, detail=f"No bilateral settlements found for {eod_date}")

    return BilateralSettlementListResponse(
        settlement_date=eod_date,
        total_pairs=len(results),
        settlements=[
            BilateralSettlementResponse(
                bank_a_id=r.bank_a_id,
                bank_a_code=r.bank_a.bank_code,
                bank_a_name=r.bank_a.name,
                bank_b_id=r.bank_b_id,
                bank_b_code=r.bank_b.bank_code,
                bank_b_name=r.bank_b.name,
                bank_a_owes_b=r.bank_a_owes_b,
                bank_b_owes_a=r.bank_b_owes_a,
                net_amount=r.net_amount,
                net_direction=r.net_direction,
            )
            for r in results
        ],
    )


@router.get("/statements/{eod_date}", response_model=BankStatementsListResponse)
async def get_bank_statements(
    eod_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bilateral_repo = BilateralRepo(db)
    results = await bilateral_repo.get_by_date(eod_date)

    if not results:
        raise HTTPException(status_code=404, detail=f"No bilateral settlements found for {eod_date}")

    bilateral_results = [
        BilateralResult(
            bank_a_id=r.bank_a_id,
            bank_a_code=r.bank_a.bank_code,
            bank_a_name=r.bank_a.name,
            bank_b_id=r.bank_b_id,
            bank_b_code=r.bank_b.bank_code,
            bank_b_name=r.bank_b.name,
            bank_a_owes_b=r.bank_a_owes_b,
            bank_b_owes_a=r.bank_b_owes_a,
        )
        for r in results
    ]

    statements = BilateralEngine.generate_all_bank_statements(bilateral_results)

    return BankStatementsListResponse(
        settlement_date=eod_date,
        total_banks=len(statements),
        statements=[
            BankStatementResponse(
                bank_id=s.bank_id,
                bank_code=s.bank_code,
                bank_name=s.bank_name,
                total_debit=s.total_debit,
                total_credit=s.total_credit,
                net_position=s.net_position,
                breakdown=[
                    CounterpartyBreakdownResponse(
                        bank_id=b.bank_id,
                        bank_code=b.bank_code,
                        bank_name=b.bank_name,
                        gross_payable=b.gross_payable,
                        gross_receivable=b.gross_receivable,
                        net_amount=b.net_amount,
                        net_direction=b.net_direction,
                    )
                    for b in s.breakdown
                ],
            )
            for s in statements
        ],
    )


@router.get("/statements/{eod_date}/summary-pdf")
async def download_clearing_summary_pdf(
    eod_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a PDF clearing summary report showing all banks' net positions and bilateral netting."""
    clearing_repo = ClearingRepo(db)
    bilateral_repo = BilateralRepo(db)
    settlement_repo = SettlementRepo(db)

    clearing_results = await clearing_repo.get_by_date(eod_date)
    if not clearing_results:
        raise HTTPException(status_code=404, detail=f"No clearing data found for {eod_date}")

    bilateral_results = await bilateral_repo.get_by_date(eod_date)
    file_record = await settlement_repo.get_by_date(eod_date)

    total_debit = file_record.total_debit if file_record else Decimal("0.00")
    total_credit = file_record.total_credit if file_record else Decimal("0.00")

    bank_positions = [
        {
            "bank_code": cr.bank.bank_code,
            "bank_name": cr.bank.name,
            "total_incoming": cr.total_incoming,
            "total_outgoing": cr.total_outgoing,
            "net_position": cr.net_position,
        }
        for cr in clearing_results
    ]
    bilateral_data = [
        {
            "bank_a_code": r.bank_a.bank_code,
            "bank_a_name": r.bank_a.name,
            "bank_b_code": r.bank_b.bank_code,
            "bank_b_name": r.bank_b.name,
            "bank_a_owes_b": r.bank_a_owes_b,
            "bank_b_owes_a": r.bank_b_owes_a,
            "net_amount": r.net_amount,
            "net_direction": r.net_direction,
        }
        for r in bilateral_results
    ]

    pdf_bytes = FileGenerator.generate_clearing_summary_pdf(
        eod_date=eod_date,
        bank_positions=bank_positions,
        bilateral_data=bilateral_data,
        total_debit=total_debit,
        total_credit=total_credit,
    )

    filename = f"clearing_summary_{eod_date}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/statements/{eod_date}/all-pdfs")
async def download_all_pdfs_zip(
    eod_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a ZIP containing the clearing summary PDF and all per-bank settlement PDFs."""
    clearing_repo = ClearingRepo(db)
    bilateral_repo = BilateralRepo(db)
    settlement_repo = SettlementRepo(db)

    clearing_results = await clearing_repo.get_by_date(eod_date)
    if not clearing_results:
        raise HTTPException(status_code=404, detail=f"No EOD data found for {eod_date}. Run EOD first.")

    bilateral_db_results = await bilateral_repo.get_by_date(eod_date)
    file_record = await settlement_repo.get_by_date(eod_date)

    total_debit = file_record.total_debit if file_record else Decimal("0.00")
    total_credit = file_record.total_credit if file_record else Decimal("0.00")

    bank_positions = [
        {
            "bank_code": cr.bank.bank_code,
            "bank_name": cr.bank.name,
            "total_incoming": cr.total_incoming,
            "total_outgoing": cr.total_outgoing,
            "net_position": cr.net_position,
        }
        for cr in clearing_results
    ]
    bilateral_data = [
        {
            "bank_a_code": r.bank_a.bank_code,
            "bank_a_name": r.bank_a.name,
            "bank_b_code": r.bank_b.bank_code,
            "bank_b_name": r.bank_b.name,
            "bank_a_owes_b": r.bank_a_owes_b,
            "bank_b_owes_a": r.bank_b_owes_a,
            "net_amount": r.net_amount,
            "net_direction": r.net_direction,
        }
        for r in bilateral_db_results
    ]

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        summary_bytes = FileGenerator.generate_clearing_summary_pdf(
            eod_date=eod_date,
            bank_positions=bank_positions,
            bilateral_data=bilateral_data,
            total_debit=total_debit,
            total_credit=total_credit,
        )
        zf.writestr(f"clearing_summary_{eod_date}.pdf", summary_bytes)

        if bilateral_db_results:
            bilateral_results = [
                BilateralResult(
                    bank_a_id=r.bank_a_id,
                    bank_a_code=r.bank_a.bank_code,
                    bank_a_name=r.bank_a.name,
                    bank_b_id=r.bank_b_id,
                    bank_b_code=r.bank_b.bank_code,
                    bank_b_name=r.bank_b.name,
                    bank_a_owes_b=r.bank_a_owes_b,
                    bank_b_owes_a=r.bank_b_owes_a,
                )
                for r in bilateral_db_results
            ]
            statements = BilateralEngine.generate_all_bank_statements(bilateral_results)
            for statement in statements:
                breakdown_dicts = [
                    {
                        "bank_code": b.bank_code,
                        "bank_name": b.bank_name,
                        "gross_payable": b.gross_payable,
                        "gross_receivable": b.gross_receivable,
                        "net_amount": b.net_amount,
                        "net_direction": b.net_direction,
                    }
                    for b in statement.breakdown
                ]
                pdf_bytes = FileGenerator.generate_bank_statement_pdf(
                    eod_date=eod_date,
                    bank_code=statement.bank_code,
                    bank_name=statement.bank_name,
                    total_debit=statement.total_debit,
                    total_credit=statement.total_credit,
                    net_position=statement.net_position,
                    breakdown=breakdown_dicts,
                )
                zf.writestr(f"settlement_statement_{statement.bank_code}_{eod_date}.pdf", pdf_bytes)

    zip_buffer.seek(0)
    filename = f"clearing_pdfs_{eod_date}.zip"
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _resolve_bank_statement(
    eod_date: date,
    bank_code: str,
    db: AsyncSession,
) -> tuple[list[BilateralResult], tuple[int, str, str]]:
    """Fetches bilateral data for the date and resolves the target bank by code.

    Returns (bilateral_results, (bank_id, bank_code, bank_name)).
    Raises 404 if no data exists for the date or the bank_code is not found.
    """
    bilateral_repo = BilateralRepo(db)
    results = await bilateral_repo.get_by_date(eod_date)

    if not results:
        raise HTTPException(status_code=404, detail=f"No bilateral settlements found for {eod_date}")

    bilateral_results = [
        BilateralResult(
            bank_a_id=r.bank_a_id,
            bank_a_code=r.bank_a.bank_code,
            bank_a_name=r.bank_a.name,
            bank_b_id=r.bank_b_id,
            bank_b_code=r.bank_b.bank_code,
            bank_b_name=r.bank_b.name,
            bank_a_owes_b=r.bank_a_owes_b,
            bank_b_owes_a=r.bank_b_owes_a,
        )
        for r in results
    ]

    target_bank: tuple[int, str, str] | None = None
    for r in results:
        if r.bank_a.bank_code == bank_code:
            target_bank = (r.bank_a_id, r.bank_a.bank_code, r.bank_a.name)
            break
        if r.bank_b.bank_code == bank_code:
            target_bank = (r.bank_b_id, r.bank_b.bank_code, r.bank_b.name)
            break

    if not target_bank:
        raise HTTPException(
            status_code=404,
            detail=f"Bank {bank_code} not found in settlements for {eod_date}",
        )

    return bilateral_results, target_bank


@router.get("/statements/{eod_date}/{bank_code}", response_model=BankStatementResponse)
async def get_bank_statement(
    eod_date: date,
    bank_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bilateral_results, target_bank = await _resolve_bank_statement(eod_date, bank_code, db)
    statement = BilateralEngine.generate_bank_statement(
        target_bank[0], target_bank[1], target_bank[2], bilateral_results
    )
    return BankStatementResponse(
        bank_id=statement.bank_id,
        bank_code=statement.bank_code,
        bank_name=statement.bank_name,
        total_debit=statement.total_debit,
        total_credit=statement.total_credit,
        net_position=statement.net_position,
        breakdown=[
            CounterpartyBreakdownResponse(
                bank_id=b.bank_id,
                bank_code=b.bank_code,
                bank_name=b.bank_name,
                gross_payable=b.gross_payable,
                gross_receivable=b.gross_receivable,
                net_amount=b.net_amount,
                net_direction=b.net_direction,
            )
            for b in statement.breakdown
        ],
    )


@router.get("/statements/{eod_date}/{bank_code}/pdf")
async def download_bank_statement_pdf(
    eod_date: date,
    bank_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a PDF settlement statement for a specific bank."""
    bilateral_results, target_bank = await _resolve_bank_statement(eod_date, bank_code, db)
    statement = BilateralEngine.generate_bank_statement(
        target_bank[0], target_bank[1], target_bank[2], bilateral_results
    )
    breakdown_dicts = [
        {
            "bank_code": b.bank_code,
            "bank_name": b.bank_name,
            "gross_payable": b.gross_payable,
            "gross_receivable": b.gross_receivable,
            "net_amount": b.net_amount,
            "net_direction": b.net_direction,
        }
        for b in statement.breakdown
    ]
    pdf_bytes = FileGenerator.generate_bank_statement_pdf(
        eod_date=eod_date,
        bank_code=statement.bank_code,
        bank_name=statement.bank_name,
        total_debit=statement.total_debit,
        total_credit=statement.total_credit,
        net_position=statement.net_position,
        breakdown=breakdown_dicts,
    )
    filename = f"settlement_statement_{bank_code}_{eod_date}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
