from datetime import date

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.process_log import ProcessLog
from app.models.user import User
from app.models.validation_result import ValidationResult


class LogRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        process_name: str,
        status: str,
        message: str,
        eod_date: date,
        triggered_by: int | None = None,
    ) -> None:
        entry = ProcessLog(
            process_name=process_name,
            status=status,
            message=message,
            eod_date=eod_date,
            triggered_by=triggered_by,
        )
        self.db.add(entry)
        await self.db.flush()

    async def get_logs(self, eod_date: date) -> list[dict]:
        stmt = (
            select(ProcessLog, User.username)
            .outerjoin(User, ProcessLog.triggered_by == User.id)
            .where(ProcessLog.eod_date == eod_date)
            .order_by(ProcessLog.created_at)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        logs = []
        for process_log, username in rows:
            logs.append({
                "id": process_log.id,
                "process_name": process_log.process_name,
                "status": process_log.status,
                "message": process_log.message,
                "eod_date": process_log.eod_date,
                "triggered_by": process_log.triggered_by,
                "username": username,
                "created_at": process_log.created_at,
            })
        return logs

    async def delete_logs_by_date(self, eod_date: date) -> None:
        stmt = delete(ProcessLog).where(ProcessLog.eod_date == eod_date)
        await self.db.execute(stmt)

    async def save_validation_result(
        self,
        check_name: str,
        status: str,
        message: str,
        eod_date: date,
        triggered_by: int | None = None,
    ) -> None:
        entry = ValidationResult(
            check_name=check_name,
            status=status,
            message=message,
            eod_date=eod_date,
            triggered_by=triggered_by,
        )
        self.db.add(entry)
        await self.db.flush()

    async def get_validation_results(self, eod_date: date) -> list[dict]:
        stmt = (
            select(ValidationResult, User.username)
            .outerjoin(User, ValidationResult.triggered_by == User.id)
            .where(ValidationResult.eod_date == eod_date)
            .order_by(ValidationResult.id)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        checks = []
        for validation_result, username in rows:
            checks.append({
                "check_name": validation_result.check_name,
                "status": validation_result.status,
                "message": validation_result.message,
                "eod_date": validation_result.eod_date,
                "triggered_by": validation_result.triggered_by,
                "username": username,
                "created_at": validation_result.created_at,
            })
        return checks

    async def delete_validations_by_date(self, eod_date: date) -> None:
        stmt = delete(ValidationResult).where(ValidationResult.eod_date == eod_date)
        await self.db.execute(stmt)
