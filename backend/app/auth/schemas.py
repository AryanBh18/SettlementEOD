from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class UserCreate(BaseModel):
    username: str
    password: str
    email: str | None = None
    role: str = "VIEWER"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
