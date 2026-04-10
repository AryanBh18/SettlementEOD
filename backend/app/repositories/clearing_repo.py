from datetime import date

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.clearing_result import ClearingResult


class ClearingRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_results(self, results: list[ClearingResult]) -> None:
        self.db.add_all(results)
        await self.db.flush()

    async def get_by_date(self, eod_date: date) -> list[ClearingResult]:
        stmt = (
            select(ClearingResult)
            .options(joinedload(ClearingResult.bank))
            .where(ClearingResult.eod_date == eod_date)
            .order_by(ClearingResult.bank_id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())

    async def exists_for_date(self, eod_date: date) -> bool:
        stmt = select(ClearingResult).where(ClearingResult.eod_date == eod_date).limit(1)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def delete_by_date(self, eod_date: date) -> None:
        stmt = delete(ClearingResult).where(ClearingResult.eod_date == eod_date)
        await self.db.execute(stmt)
