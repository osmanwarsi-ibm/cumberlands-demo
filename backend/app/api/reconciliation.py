"""Reconciliation API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.api.deps import get_config, get_session
from app.application.services.audit_service import AuditService
from app.application.services.matching_service import MatchingService
from app.bootstrap.config import ConfigurationService
from app.bootstrap.registry import ServiceRegistry
from app.db.models import StatementBatch, User

router = APIRouter()


class BatchListItem(BaseModel):
    """Batch list item."""
    batch_id: str
    status: str
    total_lines: int
    accepted_lines: int
    rejected_lines: int
    created_at: str | None = None
    matched_at: str | None = None


class BatchListResponse(BaseModel):
    """Response with list of batches."""
    batches: list[BatchListItem]
    total: int


class ReconciliationRunResponse(BaseModel):
    """Response after running reconciliation."""
    batch_id: str
    full_matches: int
    cost_exceptions: int
    quantity_exceptions: int
    unmatched_statements: int
    unmatched_receipts: int
    manual_route_count: int | None = None


@router.get("/reconciliation/batches", response_model=BatchListResponse)
def list_batches(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all statement batches.

    Args:
        session: Database session
        current_user: Authenticated user

    Returns:
        BatchListResponse with all batches
    """
    batches = session.query(StatementBatch).order_by(StatementBatch.ingested_at.desc()).all()

    items = [
        BatchListItem(
            batch_id=batch.id,
            status=batch.status,
            total_lines=batch.total_lines or 0,
            accepted_lines=batch.accepted_lines or 0,
            rejected_lines=batch.rejected_lines or 0,
            created_at=batch.ingested_at,
            matched_at=None  # Not tracked in MVP
        )
        for batch in batches
    ]

    return BatchListResponse(batches=items, total=len(items))


@router.post("/reconciliation/batches/{batch_id}/run", response_model=ReconciliationRunResponse)
def run_reconciliation(
    batch_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    config: ConfigurationService = Depends(get_config)
):
    """Run deterministic three-way matching on a batch.

    Executes matching, classification, and optional triage bootstrap.

    Args:
        batch_id: Statement batch identifier
        session: Database session
        current_user: Authenticated user
        config: Configuration service

    Returns:
        ReconciliationRunResponse with outcome counts

    Raises:
        HTTPException: 404 if batch not found, 409 if not eligible for run
    """
    # Verify batch exists
    batch = session.query(StatementBatch).filter(StatementBatch.id == batch_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

    # Check batch eligibility
    if batch.status not in ("COMPLETED", "PARTIAL"):
        raise HTTPException(
            status_code=409,
            detail=f"Batch {batch_id} not eligible for reconciliation (status: {batch.status})"
        )

    # Create service registry
    registry = ServiceRegistry(lambda: session, config)

    # Get adapters and policies
    from app.adapters.mcp.tol2_receiving import FixtureReceivingRecordsAdapter
    from app.adapters.mcp.tol3_pricebook import FixturePriceBookCostAdapter
    from app.domain.policies.quantity_tolerance import QuantityTolerancePolicy
    from app.domain.policies.cost_tolerance import CostTolerancePolicy
    from app.domain.policies.classification import ClassificationPolicy

    receiving_adapter = FixtureReceivingRecordsAdapter(session)
    pricebook_adapter = FixturePriceBookCostAdapter(session)
    quantity_policy = QuantityTolerancePolicy()
    cost_policy = CostTolerancePolicy()
    classification_policy = ClassificationPolicy()

    # Create matching service
    matching_service = MatchingService(
        session,
        receiving_adapter,
        pricebook_adapter,
        quantity_policy,
        cost_policy,
        classification_policy
    )

    # Create audit service
    audit_service = AuditService(session)

    try:
        # Run reconciliation
        result = matching_service.run_matching(batch_id)

        # Log audit event
        audit_service.log_event(
            aggregate_type="BATCH",
            aggregate_id=batch_id,
            actor_type="USER",
            actor_id=current_user.id,
            event_type="RECONCILIATION_COMPLETED",
            details={
                "full_matches": result["full_matches"],
                "cost_exceptions": result["cost_exceptions"],
                "quantity_exceptions": result["quantity_exceptions"],
                "unmatched_statements": result["unmatched_statements"],
                "unmatched_receipts": result["unmatched_receipts"],
                "manual_route_count": result.get("manual_route_count", 0),
            }
        )

        session.commit()

        return ReconciliationRunResponse(
            batch_id=batch_id,
            full_matches=result["full_matches"],
            cost_exceptions=result["cost_exceptions"],
            quantity_exceptions=result["quantity_exceptions"],
            unmatched_statements=result["unmatched_statements"],
            unmatched_receipts=result["unmatched_receipts"],
            manual_route_count=result.get("manual_route_count", 0)
        )

    except ValueError as e:
        session.rollback()
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error during reconciliation: {str(e)}")
