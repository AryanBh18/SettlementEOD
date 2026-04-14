from datetime import date

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.settlement_file import SettlementFile


class SettlementRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_file_record(self, record: SettlementFile) -> None:
        self.db.add(record)
        await self.db.flush()

    async def get_by_date(self, eod_date: date) -> SettlementFile | None:
        stmt = select(SettlementFile).where(
            (SettlementFile.eod_date == eod_date) & (SettlementFile.file_type == "COMBINED")
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_by_date(self, eod_date: date) -> list[SettlementFile]:
        stmt = select(SettlementFile).where(SettlementFile.eod_date == eod_date)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_by_date(self, eod_date: date) -> None:
        stmt = delete(SettlementFile).where(SettlementFile.eod_date == eod_date)
        await self.db.execute(stmt)
