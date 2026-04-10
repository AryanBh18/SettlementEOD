from datetime import date

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.process_log import ProcessLog
from app.models.validation_result import ValidationResult


class LogRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(self, process_name: str, status: str, message: str, eod_date: date) -> None:
        entry = ProcessLog(
            process_name=process_name,
            status=status,
            message=message,
            eod_date=eod_date,
        )
        self.db.add(entry)
        await self.db.flush()

    async def get_logs(self, eod_date: date) -> list[ProcessLog]:
        stmt = (
            select(ProcessLog)
            .where(ProcessLog.eod_date == eod_date)
            .order_by(ProcessLog.created_at)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_logs_by_date(self, eod_date: date) -> None:
        stmt = delete(ProcessLog).where(ProcessLog.eod_date == eod_date)
        await self.db.execute(stmt)

    async def save_validation_result(
        self, check_name: str, status: str, message: str, eod_date: date
    ) -> None:
        entry = ValidationResult(
            check_name=check_name,
            status=status,
            message=message,
            eod_date=eod_date,
        )
        self.db.add(entry)
        await self.db.flush()

    async def get_validation_results(self, eod_date: date) -> list[ValidationResult]:
        stmt = (
            select(ValidationResult)
            .where(ValidationResult.eod_date == eod_date)
            .order_by(ValidationResult.id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_validations_by_date(self, eod_date: date) -> None:
        stmt = delete(ValidationResult).where(ValidationResult.eod_date == eod_date)
        await self.db.execute(stmt)
