"""Case detail and review decision API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.api.deps import get_config, get_session
from app.application.services.audit_service import AuditService
from app.application.services.review_workflow_service import ReviewWorkflowService
from app.bootstrap.config import ConfigurationService
from app.bootstrap.registry import ServiceRegistry
from app.db.models import (
    ExceptionCase,
    MatchResult,
    ReviewDecision,
    StatementLine,
    TriageRecommendation,
    User,
)

router = APIRouter()


class MatchBasisResponse(BaseModel):
    """Deterministic matching evidence."""
    statement_qty: float | None = None
    received_qty: float | None = None
    quantity_variance: float | None = None
    quantity_variance_pct: float | None = None
    statement_unit_cost: float | None = None
    expected_unit_cost: float | None = None
    cost_variance: float | None = None
    applied_rules: list[str] = []


class TriageResponse(BaseModel):
    """AI triage recommendation."""
    suggestion: str | None = None
    confidence_score: float | None = None
    confidence_band: str | None = None
    rationale: str | None = None
    evidence_refs: list[str] = []
    penalty_reasons: list[str] = []


class ReviewStateResponse(BaseModel):
    """Review decision state."""
    decision_type: str | None = None
    reviewer_username: str | None = None
    reason_code: str | None = None
    rationale_note: str | None = None
    decided_at: str | None = None


class SettlementEligibilityResponse(BaseModel):
    """Settlement eligibility information."""
    is_eligible: bool
    reason: str | None = None


class CaseDetailResponse(BaseModel):
    """Full case detail."""
    case_id: str
    outcome_class: str
    vendor_id: str
    item_id: str
    delivery_ref: str | None = None
    store_id: str
    current_owner_role: str | None = None
    match_basis: MatchBasisResponse
    triage: TriageResponse | None = None
    review_state: ReviewStateResponse | None = None
    settlement_eligibility: SettlementEligibilityResponse


class ReviewDecisionRequest(BaseModel):
    """Request to record a review decision."""
    decision_type: str
    reviewer_user_id: str
    reason_code: str | None = None
    rationale_note: str | None = None


class ReviewDecisionResponse(BaseModel):
    """Response after recording review decision."""
    case_id: str
    decision_id: str
    case_status: str


@router.get("/cases/{case_id}", response_model=CaseDetailResponse)
def get_case_detail(
    case_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get full case detail with match basis, triage, and review state.

    Args:
        case_id: Case identifier
        session: Database session
        current_user: Authenticated user

    Returns:
        CaseDetailResponse with complete case information

    Raises:
        HTTPException: 404 if case not found
    """
    # Get case
    case = session.query(ExceptionCase).filter(ExceptionCase.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # Get match result
    match_result = session.query(MatchResult).filter(
        MatchResult.id == case.match_result_id
    ).first()

    if not match_result:
        raise HTTPException(status_code=404, detail=f"Match result for case {case_id} not found")

    # Get statement line for additional context
    statement_line = session.query(StatementLine).filter(
        StatementLine.id == match_result.statement_line_id
    ).first()

    # Build match basis
    import json
    rule_basis = json.loads(match_result.rule_basis_json) if match_result.rule_basis_json else {}

    match_basis = MatchBasisResponse(
        statement_qty=statement_line.statement_qty if statement_line else None,
        received_qty=rule_basis.get("received_qty"),
        quantity_variance=match_result.quantity_variance,
        quantity_variance_pct=match_result.quantity_variance_pct,
        statement_unit_cost=statement_line.statement_unit_cost if statement_line else None,
        expected_unit_cost=rule_basis.get("expected_unit_cost"),
        cost_variance=match_result.cost_variance,
        applied_rules=rule_basis.get("applied_rules", [])
    )

    # Get triage recommendation
    triage_rec = session.query(TriageRecommendation).filter(
        TriageRecommendation.case_id == case_id
    ).first()

    triage = None
    if triage_rec:
        evidence_refs = json.loads(triage_rec.evidence_refs_json) if triage_rec.evidence_refs_json else []
        penalty_reasons = json.loads(triage_rec.penalty_reasons_json) if triage_rec.penalty_reasons_json else []

        triage = TriageResponse(
            suggestion=triage_rec.suggestion,
            confidence_score=triage_rec.confidence_score,
            confidence_band=triage_rec.confidence_band,
            rationale=triage_rec.rationale,
            evidence_refs=evidence_refs,
            penalty_reasons=penalty_reasons
        )

    # Get review decision
    review_decision = session.query(ReviewDecision).filter(
        ReviewDecision.case_id == case_id
    ).first()

    review_state = None
    if review_decision:
        reviewer = session.query(User).filter(User.id == review_decision.reviewer_user_id).first()
        review_state = ReviewStateResponse(
            decision_type=review_decision.decision_type,
            reviewer_username=reviewer.username if reviewer else None,
            reason_code=review_decision.reason_code,
            rationale_note=review_decision.rationale_note,
            decided_at=review_decision.decided_at
        )

    # Determine settlement eligibility
    is_eligible = case.case_status in ("APPROVED", "SETTLEMENT_READY")
    eligibility_reason = None
    if not is_eligible:
        if case.case_status == "OPEN":
            eligibility_reason = "Case must be reviewed first"
        elif case.case_status == "UNDER_REVIEW":
            eligibility_reason = "Review in progress"
        elif case.case_status == "ESCALATED":
            eligibility_reason = "Case is escalated"
        else:
            eligibility_reason = f"Current status: {case.case_status}"

    settlement_eligibility = SettlementEligibilityResponse(
        is_eligible=is_eligible,
        reason=eligibility_reason
    )

    return CaseDetailResponse(
        case_id=case_id,
        outcome_class=match_result.outcome_class,
        vendor_id=statement_line.vendor_id if statement_line else "",
        item_id=statement_line.item_id if statement_line else "",
        delivery_ref=statement_line.delivery_ref if statement_line else None,
        store_id=statement_line.store_id if statement_line else "",
        current_owner_role=case.current_owner_role,
        match_basis=match_basis,
        triage=triage,
        review_state=review_state,
        settlement_eligibility=settlement_eligibility
    )


@router.post("/cases/{case_id}/review-decisions", response_model=ReviewDecisionResponse)
def create_review_decision(
    case_id: str,
    request: ReviewDecisionRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    config: ConfigurationService = Depends(get_config)
):
    """Record a review decision (approve, override, escalate).

    Enforces role alignment and SoD checks.

    Args:
        case_id: Case identifier
        request: Review decision payload
        session: Database session
        current_user: Authenticated user
        config: Configuration service

    Returns:
        ReviewDecisionResponse with updated case status

    Raises:
        HTTPException: 403 if role/SoD violation, 404 if not found, 409 if not reviewable
    """
    # Get case
    case = session.query(ExceptionCase).filter(ExceptionCase.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # Create service registry
    registry = ServiceRegistry(lambda: session, config)

    # Create review workflow service
    review_service = ReviewWorkflowService(session, registry, config)

    # Create audit service
    audit_service = AuditService(session)

    try:
        # Record decision through service
        result = review_service.record_decision(
            case_id=case_id,
            reviewer_user_id=request.reviewer_user_id,
            decision_type=request.decision_type,
            reason_code=request.reason_code,
            rationale_note=request.rationale_note
        )

        # Log audit event
        audit_service.log_event(
            aggregate_type="CASE",
            aggregate_id=case_id,
            actor_type="USER",
            actor_id=request.reviewer_user_id,
            event_type=f"REVIEW_DECISION_{request.decision_type}",
            details={
                "decision_type": request.decision_type,
                "reason_code": request.reason_code,
                "case_status": result["case_status"],
            }
        )

        session.commit()

        return ReviewDecisionResponse(
            case_id=case_id,
            decision_id=result["decision_id"],
            case_status=result["case_status"]
        )

    except PermissionError as e:
        session.rollback()
        # Log SoD violation
        audit_service.log_event(
            aggregate_type="CASE",
            aggregate_id=case_id,
            actor_type="USER",
            actor_id=request.reviewer_user_id,
            event_type="AUDIT_DENIED_ACTION",
            details={
                "action": "REVIEW_DECISION",
                "reason": str(e),
                "policy": "SoD or role check"
            }
        )
        session.commit()
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        session.rollback()
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
