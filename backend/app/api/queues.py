"""Queue API endpoints."""
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.api.deps import get_session
from app.db.models import ExceptionCase, TriageRecommendation, User

router = APIRouter()


class QueueItemResponse(BaseModel):
    """Queue item in list response."""
    case_id: str
    case_type: str
    case_status: str
    confidence_band: str | None = None
    missing_context_count: int
    missing_context_list: list[str] = []
    recommended_action: str | None = None
    assigned_role: str


class QueueListResponse(BaseModel):
    """Queue list response."""
    queue_type: str
    total: int
    items: list[QueueItemResponse]


# Role to queue type mapping
ROLE_QUEUE_MAP = {
    "PRICE_BOOK_ANALYST": "cost_review",
    "INVENTORY_CONTROL_ANALYST": "quantity_review",
    "AP_SPECIALIST": "ap_review",
    "VENDOR_RELATIONS_MANAGER": "vendor_follow_up"
}


@router.get("/queues/{queue_type}", response_model=QueueListResponse)
def get_queue(
    queue_type: str,
    status: str | None = Query(None),
    limit: int = Query(50, ge=1, le=150),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get queue items for a specific queue type.

    Enforces role-to-queue alignment.

    Args:
        queue_type: Queue type identifier (cost_review, quantity_review, ap_review, vendor_follow_up)
        status: Optional status filter
        limit: Maximum items to return (1-150, default 50)
        session: Database session
        current_user: Authenticated user

    Returns:
        QueueListResponse with items and total count

    Raises:
        HTTPException: 403 if role doesn't match queue, 400 if invalid queue type
    """
    valid_queue_types = ["cost_review", "quantity_review", "ap_review", "vendor_follow_up"]

    if queue_type not in valid_queue_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid queue_type. Must be one of: {', '.join(valid_queue_types)}"
        )

    # Enforce role-to-queue alignment
    allowed_queue = ROLE_QUEUE_MAP.get(current_user.role)
    if allowed_queue != queue_type:
        raise HTTPException(
            status_code=403,
            detail=f"Role {current_user.role} is not authorized to access queue {queue_type}"
        )

    # Build query
    query = session.query(ExceptionCase).filter(ExceptionCase.queue_type == queue_type)

    if status:
        # Normalize status to uppercase for case-insensitive matching
        query = query.filter(ExceptionCase.case_status == status.upper())

    # Get total count
    total = query.count()

    # Get items with limit
    cases = query.limit(limit).all()

    # Build response items with triage recommendations
    items = []
    for case in cases:
        # Get triage recommendation if exists
        triage = session.query(TriageRecommendation).filter(
            TriageRecommendation.case_id == case.id
        ).first()

        # Parse missing_context_list from JSON
        missing_list = []
        if case.missing_context_list_json:
            try:
                missing_list = json.loads(case.missing_context_list_json)
            except (json.JSONDecodeError, TypeError):
                missing_list = []

        items.append(QueueItemResponse(
            case_id=case.id,
            case_type=case.case_type,
            case_status=case.case_status,
            confidence_band=triage.confidence_band if triage else None,
            missing_context_count=case.missing_context_count,
            missing_context_list=missing_list,
            recommended_action=triage.suggestion if triage else None,
            assigned_role=case.current_owner_role
        ))

    return QueueListResponse(
        queue_type=queue_type,
        total=total,
        items=items
    )
