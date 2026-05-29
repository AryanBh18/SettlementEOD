import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse
from app.auth.security import (
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepo

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepo(db)
    user = await repo.get_by_username(request.username)

    if not user or not verify_password(request.password, user.password_hash):
        logger.warning("Login failed: invalid credentials for username=%r", request.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        logger.warning("Login failed: account disabled for username=%r", request.username)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    logger.info("Login success for username=%r role=%r", user.username, user.role)
    token = create_access_token(data={"sub": user.username, "role": user.role})
    return TokenResponse(
        access_token=token,
        role=user.role,
        username=user.username,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/register", response_model=UserResponse)
async def register_user(
    request: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    repo = UserRepo(db)
    existing = await repo.get_by_username(request.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{request.username}' already exists",
        )

    if request.role not in ("ADMIN", "OPERATOR", "VIEWER"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be ADMIN, OPERATOR, or VIEWER",
        )

    user = User(
        username=request.username,
        password_hash=hash_password(request.password),
        email=request.email,
        role=request.role,
    )
    user = await repo.create(user)
    await db.commit()
    return user


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    repo = UserRepo(db)
    return await repo.get_all()
