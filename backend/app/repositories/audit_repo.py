from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        user_id: int | None,
        action: str,
        resource: str | None = None,
        resource_id: str | None = None,
        details: dict | None = None,
        ip_address: str | None = None,
    ) -> None:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
        )
        self.db.add(entry)
        await self.db.flush()

    async def get_logs(
        self,
        start_date: date | None = None,
        end_date: date | None = None,
        user_id: int | None = None,
        action: str | None = None,
        limit: int = 100,
    ) -> list[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        if start_date:
            stmt = stmt.where(AuditLog.created_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            stmt = stmt.where(AuditLog.created_at <= datetime.combine(end_date, datetime.max.time()))
        if user_id:
            stmt = stmt.where(AuditLog.user_id == user_id)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
