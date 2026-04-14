from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.security import get_current_user
from app.models.user import User
from app.repositories.transaction_repo import TransactionRepo
from app.schemas.transaction import TransactionResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/{txn_date}", response_model=list[TransactionResponse])
async def get_transactions(
    txn_date: date,
    status: str | None = Query(None, description="Filter by status: SUCCESS, FAILED, REVERSED"),
    transaction_type: str | None = Query(None, description="Filter by type: ATM, POS, WIRE, TRANSFER, OTHER"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = TransactionRepo(db)

    if status:
        transactions = await repo.get_by_date(txn_date, status_filter=status)
    else:
        # Fetch all statuses by getting each separately
        success = await repo.get_by_date(txn_date, status_filter="SUCCESS")
        failed = await repo.get_by_date(txn_date, status_filter="FAILED")
        reversed_ = await repo.get_by_date(txn_date, status_filter="REVERSED")
        transactions = success + failed + reversed_

    return [
        TransactionResponse(
            id=txn.id,
            reference=txn.reference,
            source_bank_code=txn.source_bank.bank_code,
            source_bank_name=txn.source_bank.name,
            destination_bank_code=txn.destination_bank.bank_code,
            destination_bank_name=txn.destination_bank.name,
            amount=txn.amount,
            status=txn.status,
            transaction_type=txn.transaction_type,
            transaction_date=txn.transaction_date,
            created_at=txn.created_at,
        )
        for txn in transactions
    ]
