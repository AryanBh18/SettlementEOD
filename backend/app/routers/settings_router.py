from datetime import datetime

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import require_role, get_current_user
from app.database import get_db
from app.models.user import User
from app.models.settings import MappingRule
from app.repositories.mapping_repo import MappingRepo, NotificationSettingsRepo


router = APIRouter(prefix="/settings", tags=["Settings"])


# --- Mapping Rules ---

class MappingRuleResponse(BaseModel):
    id: int
    rule_name: str
    field_source: str
    field_target: str
    transform_type: str
    transform_config: dict | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MappingRuleCreate(BaseModel):
    rule_name: str
    field_source: str
    field_target: str
    transform_type: str = "DIRECT"
    transform_config: dict = {}
    is_active: bool = True


class MappingRuleUpdate(BaseModel):
    rule_name: str | None = None
    field_source: str | None = None
    field_target: str | None = None
    transform_type: str | None = None
    transform_config: dict | None = None
    is_active: bool | None = None


@router.get("/mapping-rules", response_model=list[MappingRuleResponse])
async def get_mapping_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = MappingRepo(db)
    return await repo.get_all(active_only=False)


@router.post("/mapping-rules", response_model=MappingRuleResponse)
async def create_mapping_rule(
    request: MappingRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    repo = MappingRepo(db)
    rule = MappingRule(
        rule_name=request.rule_name,
        field_source=request.field_source,
        field_target=request.field_target,
        transform_type=request.transform_type,
        transform_config=request.transform_config,
        is_active=request.is_active,
    )
    rule = await repo.create(rule)
    await db.commit()
    return rule


@router.put("/mapping-rules/{rule_id}", response_model=MappingRuleResponse)
async def update_mapping_rule(
    rule_id: int,
    request: MappingRuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    repo = MappingRepo(db)
    updates = {k: v for k, v in request.model_dump().items() if v is not None}
    rule = await repo.update(rule_id, **updates)
    if not rule:
        raise HTTPException(status_code=404, detail="Mapping rule not found")
    await db.commit()
    return rule


@router.delete("/mapping-rules/{rule_id}")
async def delete_mapping_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    repo = MappingRepo(db)
    deleted = await repo.delete(rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Mapping rule not found")
    await db.commit()
    return {"detail": "Mapping rule deleted"}


# --- Notification Settings ---

class NotificationSettingsResponse(BaseModel):
    email_recipients: list | None
    notify_on_success: bool
    notify_on_failure: bool
    smtp_configured: bool

    model_config = {"from_attributes": True}


class NotificationSettingsUpdate(BaseModel):
    email_recipients: list[str] | None = None
    notify_on_success: bool | None = None
    notify_on_failure: bool | None = None


@router.get("/notifications", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    repo = NotificationSettingsRepo(db)
    setting = await repo.get()
    if not setting:
        return NotificationSettingsResponse(
            email_recipients=[], notify_on_success=False,
            notify_on_failure=True, smtp_configured=False,
        )
    return setting


@router.put("/notifications", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    request: NotificationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    repo = NotificationSettingsRepo(db)
    updates = {k: v for k, v in request.model_dump().items() if v is not None}
    setting = await repo.update(**updates)
    await db.commit()
    return setting
