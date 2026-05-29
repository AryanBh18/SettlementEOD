import logging
from datetime import date, datetime
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.security import get_current_user, require_role
from app.models.user import User
from app.models.cutoff_schedule import CutoffSchedule
from app.services.cutoff_service import CutoffService
from app.utils.timezone import now_sr

router = APIRouter(prefix="/cutoff", tags=["Cutoff"])
logger = logging.getLogger(__name__)


class CutoffRequest(BaseModel):
    settlement_date: date


class CutoffResponse(BaseModel):
    id: int
    settlement_date: date
    cutoff_timestamp: datetime
    status: str
    message: str | None = None

    model_config = {"from_attributes": True}


class CutoffScheduleRequest(BaseModel):
    cutoff_time: str
    is_auto_enabled: bool

    @field_validator("cutoff_time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        if not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", v):
            raise ValueError("cutoff_time must be in HH:MM format (e.g. '16:00')")
        return v


class CutoffScheduleResponse(BaseModel):
    cutoff_time: str
    is_auto_enabled: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.post("/trigger", response_model=CutoffResponse)
async def trigger_cutoff(
    request: CutoffRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "OPERATOR")),
):
    service = CutoffService(db)
    try:
        cutoff = await service.trigger_cutoff(request.settlement_date, current_user.id)
        await db.commit()
        return cutoff
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except Exception as exc:
        await db.rollback()
        logger.error("Cutoff trigger failed for date %s", request.settlement_date, exc_info=exc)
        raise HTTPException(status_code=500, detail="Cutoff processing failed. Check server logs.")


@router.get("/schedule", response_model=CutoffScheduleResponse | None)
async def get_cutoff_schedule(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current cutoff schedule configuration."""
    stmt = select(CutoffSchedule).order_by(CutoffSchedule.id.desc()).limit(1)
    result = await db.execute(stmt)
    schedule = result.scalar_one_or_none()
    if not schedule:
        return None
    return schedule


@router.post("/schedule", response_model=CutoffScheduleResponse)
async def save_cutoff_schedule(
    request: CutoffScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "OPERATOR")),
):
    """Create or update the cutoff schedule configuration."""
    try:
        stmt = select(CutoffSchedule).order_by(CutoffSchedule.id.asc()).limit(1)
        result = await db.execute(stmt)
        schedule = result.scalar_one_or_none()

        now = now_sr()
        if schedule:
            schedule.cutoff_time = request.cutoff_time
            schedule.is_auto_enabled = request.is_auto_enabled
            schedule.updated_at = now
        else:
            schedule = CutoffSchedule(
                cutoff_time=request.cutoff_time,
                is_auto_enabled=request.is_auto_enabled,
                created_at=now,
                updated_at=now,
            )
            db.add(schedule)

        await db.commit()
        await db.refresh(schedule)
        return schedule
    except Exception as exc:
        await db.rollback()
        logger.error("Failed to save cutoff schedule", exc_info=exc)
        raise HTTPException(status_code=500, detail="Failed to save schedule. Check server logs.")


@router.get("/status/{settlement_date}", response_model=CutoffResponse | None)
async def get_cutoff_status(
    settlement_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = CutoffService(db)
    cutoff = await service.get_cutoff(settlement_date)
    if not cutoff:
        return None
    return cutoff


@router.get("/latest", response_model=CutoffResponse | None)
async def get_latest_cutoff(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = CutoffService(db)
    cutoff = await service.get_latest_cutoff()
    if not cutoff:
        return None
    return cutoff

