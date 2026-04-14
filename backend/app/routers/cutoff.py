from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.security import get_current_user, require_role
from app.models.user import User
from app.services.cutoff_service import CutoffService

router = APIRouter(prefix="/cutoff", tags=["Cutoff"])


class CutoffRequest(BaseModel):
    settlement_date: date


class CutoffResponse(BaseModel):
    id: int
    settlement_date: date
    cutoff_timestamp: datetime
    status: str
    message: str | None = None

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
        raise HTTPException(status_code=500, detail=f"Cutoff failed: {str(exc)}")


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
