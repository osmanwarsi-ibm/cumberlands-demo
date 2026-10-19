"""Audit trail API endpoints."""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.api.deps import get_session
from app.db.models import AuditEvent, User

router = APIRouter()


class AuditEventResponse(BaseModel):
    """Single audit event."""
    id: str
    aggregate_type: str
    aggregate_id: str
    actor_type: str
    actor_id: str
    event_type: str
    details_json: str
    event_ts: str


class AuditTrailResponse(BaseModel):
    """Audit trail for an aggregate."""
    aggregate_type: str
    aggregate_id: str
    total: int
    events: list[AuditEventResponse]


@router.get("/audit/{aggregate_type}/{aggregate_id}", response_model=AuditTrailResponse)
def get_audit_trail(
    aggregate_type: str,
    aggregate_id: str,
    event_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get audit trail for an aggregate (batch, case, etc.).

    Args:
        aggregate_type: Type of aggregate (BATCH, CASE, etc.)
        aggregate_id: Aggregate identifier
        event_type: Optional event type filter
        limit: Maximum events to return (1-200, default 50)
        session: Database session
        current_user: Authenticated user

    Returns:
        AuditTrailResponse with chronological event list

    Raises:
        HTTPException: 404 if aggregate not found
    """
    # Build query
    query = session.query(AuditEvent).filter(
        AuditEvent.aggregate_type == aggregate_type.upper(),
        AuditEvent.aggregate_id == aggregate_id
    )

    if event_type:
        query = query.filter(AuditEvent.event_type == event_type)

    # Order by timestamp (chronological)
    query = query.order_by(AuditEvent.event_ts)

    # Get total count
    total = query.count()

    # Get events with limit
    events = query.limit(limit).all()

    # Build response
    event_responses = [
        AuditEventResponse(
            id=event.id,
            aggregate_type=event.aggregate_type,
            aggregate_id=event.aggregate_id,
            actor_type=event.actor_type,
            actor_id=event.actor_id,
            event_type=event.event_type,
            details_json=event.details_json,
            event_ts=event.event_ts
        )
        for event in events
    ]

    return AuditTrailResponse(
        aggregate_type=aggregate_type.upper(),
        aggregate_id=aggregate_id,
        total=total,
        events=event_responses
    )
