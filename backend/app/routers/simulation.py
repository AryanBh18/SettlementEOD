from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.security import require_role
from app.models.user import User
from app.services.transaction_simulator import TransactionSimulator

router = APIRouter(prefix="/simulation", tags=["Simulation"])


class SimulationRequest(BaseModel):
    count: int = Field(ge=1, le=10000, description="Number of transactions to generate")
    target_date: date


class SimulationResponse(BaseModel):
    date: str
    inserted: int
    skipped: int
    total_requested: int


@router.post("/generate", response_model=SimulationResponse)
async def generate_transactions(
    request: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "OPERATOR")),
):
    simulator = TransactionSimulator(db)
    try:
        result = await simulator.simulate(request.count, request.target_date)
        await db.commit()
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(exc)}")
