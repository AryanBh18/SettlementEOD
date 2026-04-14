from datetime import date

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.bilateral_settlement import BilateralSettlement


class BilateralRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_results(self, results: list[BilateralSettlement]) -> None:
        self.db.add_all(results)
        await self.db.flush()

    async def get_by_date(self, settlement_date: date) -> list[BilateralSettlement]:
        stmt = (
            select(BilateralSettlement)
            .options(
                joinedload(BilateralSettlement.bank_a),
                joinedload(BilateralSettlement.bank_b),
            )
            .where(BilateralSettlement.settlement_date == settlement_date)
            .order_by(BilateralSettlement.bank_a_id, BilateralSettlement.bank_b_id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())

    async def exists_for_date(self, settlement_date: date) -> bool:
        stmt = (
            select(BilateralSettlement)
            .where(BilateralSettlement.settlement_date == settlement_date)
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def delete_by_date(self, settlement_date: date) -> None:
        stmt = delete(BilateralSettlement).where(
            BilateralSettlement.settlement_date == settlement_date
        )
        await self.db.execute(stmt)
