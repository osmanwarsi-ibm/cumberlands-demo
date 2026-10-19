"""Authentication API stub for pilot."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_session
from app.db.models import User


router = APIRouter()


class LoginRequest(BaseModel):
    """Login request payload."""
    username: str


class UserResponse(BaseModel):
    """User information in response."""
    id: str
    username: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response with stub token."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest, session: Session = Depends(get_session)):
    """Stub login endpoint using seeded users.

    No password verification in MVP stub.
    """
    user = session.query(User).filter(User.username == request.username).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials or inactive user")

    # Generate stub token (just the user ID for simplicity)
    token = f"stub_token_{user.id}"

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=bool(user.is_active),
        )
    )
