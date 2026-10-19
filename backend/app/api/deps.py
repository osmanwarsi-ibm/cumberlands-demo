"""Shared dependencies for API endpoints to avoid circular imports."""
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.models import User


def get_session():
    """Dependency to get database session."""
    from app.main import SessionLocal
    if SessionLocal is None:
        raise RuntimeError("Application not initialized")
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def get_config():
    """Dependency to get configuration."""
    from app.main import config
    if config is None:
        raise RuntimeError("Application not initialized")
    return config


def get_current_user(
    authorization: str | None = Header(None),
    session: Session = Depends(get_session)
) -> User:
    """Extract and validate current user from stub token.

    Args:
        authorization: Authorization header with bearer token
        session: Database session

    Returns:
        User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.replace("Bearer ", "")

    # Extract user ID from stub token
    if not token.startswith("stub_token_"):
        raise HTTPException(status_code=401, detail="Invalid token format")

    user_id = token.replace("stub_token_", "")

    user = session.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user
