from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import require_role
from app.database import get_db
from app.models.user import User
from app.repositories.audit_repo import AuditRepo


router = APIRouter(prefix="/audit", tags=["Audit"])


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    username: str | None = None
    action: str
    resource: str | None
    resource_id: str | None
    details: dict | None
    ip_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/logs", response_model=list[AuditLogResponse])
async def get_audit_logs(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    user_id: int | None = Query(None),
    action: str | None = Query(None),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    repo = AuditRepo(db)
    return await repo.get_logs(
        start_date=start_date,
        end_date=end_date,
        user_id=user_id,
        action=action,
        limit=limit,
    )
