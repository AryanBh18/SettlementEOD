from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.clearing_repo import ClearingRepo
from app.repositories.log_repo import LogRepo
from app.repositories.settlement_repo import SettlementRepo
from app.repositories.transaction_repo import TransactionRepo
from app.schemas.eod import (
    BankPositionResponse,
    EODRunRequest,
    EODRunResponse,
    EODStatusResponse,
    FileInfoResponse,
    ProcessLogResponse,
    ValidationCheckResponse,
)
from app.services.eod_orchestrator import EODOrchestrator

router = APIRouter(prefix="/eod", tags=["EOD Settlement"])


@router.post("/run", response_model=EODRunResponse)
async def run_eod(request: EODRunRequest, db: AsyncSession = Depends(get_db)):
    orchestrator = EODOrchestrator(db)
    try:
        result = await orchestrator.run(request.eod_date, force_rerun=request.force_rerun)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"EOD processing failed: {str(exc)}")


@router.get("/status/{eod_date}", response_model=EODStatusResponse)
async def get_eod_status(eod_date: date, db: AsyncSession = Depends(get_db)):
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
    elif any(v.status == "FAIL" for v in validation_results):
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
                check_name=v.check_name,
                status=v.status,
                message=v.message,
            )
            for v in validation_results
        ],
        process_logs=[
            ProcessLogResponse(
                id=log.id,
                process_name=log.process_name,
                status=log.status,
                message=log.message,
                eod_date=log.eod_date,
                created_at=log.created_at,
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


@router.get("/files/{eod_date}")
async def download_eod_file(eod_date: date, db: AsyncSession = Depends(get_db)):
    settlement_repo = SettlementRepo(db)
    file_record = await settlement_repo.get_by_date(eod_date)

    if not file_record:
        raise HTTPException(status_code=404, detail=f"No settlement file found for {eod_date}")

    import os
    if not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="Settlement file not found on disk")

    return FileResponse(
        path=file_record.file_path,
        filename=file_record.file_name,
        media_type="text/plain",
    )
