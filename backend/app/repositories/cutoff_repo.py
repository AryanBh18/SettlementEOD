from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cutoff_log import CutoffLog


class CutoffRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_cutoff(self, cutoff: CutoffLog) -> CutoffLog:
        self.db.add(cutoff)
        await self.db.flush()
        return cutoff

    async def get_by_date(self, settlement_date: date) -> CutoffLog | None:
        stmt = select(CutoffLog).where(
            CutoffLog.settlement_date == settlement_date,
            CutoffLog.status == "ACTIVE",
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_latest(self) -> CutoffLog | None:
        stmt = (
            select(CutoffLog)
            .where(CutoffLog.status == "ACTIVE")
            .order_by(CutoffLog.cutoff_timestamp.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def exists_for_date(self, settlement_date: date) -> bool:
        stmt = select(CutoffLog).where(
            CutoffLog.settlement_date == settlement_date,
            CutoffLog.status == "ACTIVE",
        ).limit(1)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None
