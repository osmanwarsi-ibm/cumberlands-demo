"""Shared dependencies for FastAPI endpoints."""
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session


def get_current_user_dependency(session: Session, authorization: str | None = Header(None)):
    """Extract and validate current user from stub token.

    Args:
        session: Database session
        authorization: Authorization header with bearer token

    Returns:
        User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    from app.db.models import User

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
