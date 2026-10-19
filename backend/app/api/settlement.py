"""Settlement preparation API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.api.deps import get_config, get_session
from app.application.services.audit_service import AuditService
from app.application.services.settlement_service import SettlementService
from app.bootstrap.config import ConfigurationService
from app.bootstrap.registry import ServiceRegistry
from app.db.models import ExceptionCase, User

router = APIRouter()


class SettlementRequest(BaseModel):
    """Request to prepare settlement."""
    prepared_by_user_id: str
    generate_chargeback_support: bool = False


class SettlementResponse(BaseModel):
    """Response after settlement preparation."""
    settlement_record_id: str
    queue_entry_id: str | None = None
    queue_status: str
    ack_status: str | None = None
    chargeback_document_id: str | None = None


@router.post("/cases/{case_id}/settlement", response_model=SettlementResponse, status_code=201)
def prepare_settlement(
    case_id: str,
    request: SettlementRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    config: ConfigurationService = Depends(get_config)
):
    """Prepare settlement and submit to mocked AP queue.

    Validates eligibility, enforces SoD, and optionally generates chargeback support.

    Args:
        case_id: Case identifier
        request: Settlement preparation payload
        session: Database session
        current_user: Authenticated user
        config: Configuration service

    Returns:
        SettlementResponse with settlement record and queue entry details

    Raises:
        HTTPException: 403 if SoD violation or role restriction,
                      404 if not found,
                      409 if not settlement-eligible,
                      502 if mock boundary failure
    """
    # Get case
    case = session.query(ExceptionCase).filter(ExceptionCase.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # Verify user is AP Specialist
    if current_user.role != "AP_SPECIALIST":
        raise HTTPException(
            status_code=403,
            detail=f"Only AP Specialists can prepare settlements. Your role: {current_user.role}"
        )

    # Create service registry
    registry = ServiceRegistry(lambda: session, config)

    # Get adapters and policies
    from app.adapters.mcp.tol6_apqueue import MockApQueueSubmissionAdapter
    from app.adapters.mcp.tol7_chargeback import LocalChargebackDocumentAdapter
    from app.adapters.mcp.tol8_apqueue_ack import MockApQueueAckAdapter
    from app.domain.policies.sod import SoDPolicy
    from app.domain.policies.reason_code import ReasonCodePolicy

    apqueue_adapter = MockApQueueSubmissionAdapter(session)
    apqueue_ack_adapter = MockApQueueAckAdapter(session)
    chargeback_adapter = LocalChargebackDocumentAdapter(session)
    sod_policy = SoDPolicy()
    reason_code_policy = ReasonCodePolicy()

    # Create settlement service
    settlement_service = SettlementService(
        session,
        apqueue_adapter,
        apqueue_ack_adapter,
        chargeback_adapter,
        sod_policy,
        reason_code_policy
    )

    # Create audit service
    audit_service = AuditService(session)

    try:
        # Prepare settlement
        result = settlement_service.prepare_settlement(
            case_id=case_id,
            prepared_by_user_id=request.prepared_by_user_id,
            generate_chargeback_support=request.generate_chargeback_support
        )

        # Log audit event
        audit_service.log_event(
            aggregate_type="CASE",
            aggregate_id=case_id,
            actor_type="USER",
            actor_id=request.prepared_by_user_id,
            event_type="SETTLEMENT_PREPARED",
            details={
                "settlement_record_id": result["settlement_record_id"],
                "queue_status": result["queue_status"],
                "ack_status": result.get("ack_status"),
                "chargeback_generated": result.get("chargeback_document_id") is not None,
            }
        )

        session.commit()

        return SettlementResponse(
            settlement_record_id=result["settlement_record_id"],
            queue_entry_id=result.get("queue_entry_id"),
            queue_status=result["queue_status"],
            ack_status=result.get("ack_status"),
            chargeback_document_id=result.get("chargeback_document_id")
        )

    except PermissionError as e:
        session.rollback()
        # Log SoD violation
        audit_service.log_event(
            aggregate_type="CASE",
            aggregate_id=case_id,
            actor_type="USER",
            actor_id=request.prepared_by_user_id,
            event_type="AUDIT_DENIED_ACTION",
            details={
                "action": "SETTLEMENT_PREPARATION",
                "reason": str(e),
                "policy": "SoD check"
            }
        )
        session.commit()
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        session.rollback()
        raise HTTPException(status_code=409, detail=str(e))
    except RuntimeError as e:
        session.rollback()
        # Mock boundary failure
        audit_service.log_event(
            aggregate_type="CASE",
            aggregate_id=case_id,
            actor_type="SYSTEM",
            actor_id="settlement_service",
            event_type="BOUNDARY_FAILURE",
            details={
                "action": "AP_QUEUE_SUBMISSION",
                "reason": str(e),
            }
        )
        session.commit()
        raise HTTPException(status_code=502, detail=f"Mock boundary failure: {str(e)}")
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
