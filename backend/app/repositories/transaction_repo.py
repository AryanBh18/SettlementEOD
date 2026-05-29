from datetime import date

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.transaction import Transaction


class TransactionRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_date(self, eod_date: date, status_filter: str = "SUCCESS") -> list[Transaction]:
        stmt = (
            select(Transaction)
            .options(joinedload(Transaction.source_bank), joinedload(Transaction.destination_bank))
            .where(Transaction.transaction_date == eod_date, Transaction.status == status_filter)
            .order_by(Transaction.id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())

    async def count_by_date(self, eod_date: date) -> int:
        stmt = (
            select(func.count(Transaction.id))
            .where(Transaction.transaction_date == eod_date, Transaction.status == "SUCCESS")
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()
