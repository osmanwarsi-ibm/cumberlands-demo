"""Statement intake API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.api.deps import get_config, get_session
from app.application.services.audit_service import AuditService
from app.application.services.intake_service import IntakeService
from app.bootstrap.config import ConfigurationService
from app.bootstrap.registry import ServiceRegistry
from app.db.models import User

router = APIRouter()


class IntakeBatchRequest(BaseModel):
    """Request to start statement ingestion."""
    source_type: str
    source_identifier: str
    initiated_by: str


class IntakeBatchResponse(BaseModel):
    """Response after statement ingestion."""
    batch_id: str
    status: str
    total_lines: int
    accepted_lines: int
    rejected_lines: int
    rejection_reasons: list[str] | None = None


@router.post("/intake/batches", response_model=IntakeBatchResponse, status_code=201)
def create_intake_batch(
    request: IntakeBatchRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    config: ConfigurationService = Depends(get_config)
):
    """Start statement ingestion batch.

    Validates structure, normalizes data, and rejects malformed inputs.

    Args:
        request: Intake batch request payload
        session: Database session
        current_user: Authenticated user
        config: Configuration service

    Returns:
        IntakeBatchResponse with batch ID and status

    Raises:
        HTTPException: 400 if validation fails, 401 if unauthorized
    """
    # Create service registry
    registry = ServiceRegistry(lambda: session, config)

    # Get TOL1 adapter from registry
    from app.adapters.mcp.tol1_statement_source import FixtureStatementSourceAdapter
    statement_source_adapter = FixtureStatementSourceAdapter(session)

    # Create intake service
    intake_service = IntakeService(session, statement_source_adapter)

    # Create audit service
    audit_service = AuditService(session)

    try:
        # Run intake
        result = intake_service.ingest_batch(
            source_type=request.source_type,
            source_identifier=request.source_identifier,
            initiated_by_user_id=current_user.id
        )

        # Log audit event
        audit_service.log_event(
            aggregate_type="BATCH",
            aggregate_id=result["batch_id"],
            actor_type="USER",
            actor_id=current_user.id,
            event_type="BATCH_INGESTION_COMPLETED",
            details={
                "source_type": request.source_type,
                "source_identifier": request.source_identifier,
                "status": result["status"],
                "total_lines": result["total_lines"],
                "accepted_lines": result["accepted_lines"],
                "rejected_lines": result["rejected_lines"],
            }
        )

        session.commit()

        return IntakeBatchResponse(
            batch_id=result["batch_id"],
            status=result["status"],
            total_lines=result["total_lines"],
            accepted_lines=result["accepted_lines"],
            rejected_lines=result["rejected_lines"],
            rejection_reasons=result.get("rejection_reasons")
        )

    except ValueError as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error during ingestion: {str(e)}")
