"""TOL5: Resolution Submission Port.

Persists human review decisions and downstream state transitions.
"""
from typing import NamedTuple, Protocol


class ResolutionSubmissionResult(NamedTuple):
    """Result of resolution submission."""
    success: bool
    decision_id: str | None
    message: str


class ResolutionSubmissionPort(Protocol):
    """Port interface for TOL5: Resolution submission."""

    def submit(
        self,
        case_id: str,
        decision_type: str,
        reviewer_user_id: str,
        reason_code: str | None = None,
        rationale_note: str | None = None
    ) -> ResolutionSubmissionResult:
        """Submit review decision for a case.

        Args:
            case_id: Exception case identifier
            decision_type: APPROVE, OVERRIDE, or ESCALATE
            reviewer_user_id: User making the decision
            reason_code: Optional reason code
            rationale_note: Optional rationale text

        Returns:
            ResolutionSubmissionResult with status
        """
        ...


class LocalResolutionSubmissionAdapter:
    """Local implementation of ResolutionSubmissionPort."""

    def __init__(self, session):
        """Initialize with database session.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    def submit(
        self,
        case_id: str,
        decision_type: str,
        reviewer_user_id: str,
        reason_code: str | None = None,
        rationale_note: str | None = None
    ) -> ResolutionSubmissionResult:
        """Submit review decision to local database.

        This persists the decision and updates case state.
        In production, this might also call external workflow systems.

        Args:
            case_id: Exception case identifier
            decision_type: APPROVE, OVERRIDE, or ESCALATE
            reviewer_user_id: User making the decision
            reason_code: Optional reason code
            rationale_note: Optional rationale text

        Returns:
            ResolutionSubmissionResult with status
        """
        import uuid
        from datetime import datetime

        from ...db.models import ExceptionCase, ReviewDecision

        # Create decision record
        decision_id = str(uuid.uuid4())
        decision = ReviewDecision(
            id=decision_id,
            case_id=case_id,
            reviewer_user_id=reviewer_user_id,
            decision_type=decision_type,
            reason_code=reason_code,
            rationale_note=rationale_note,
            decided_at=datetime.utcnow().isoformat()
        )

        self.session.add(decision)

        # Update case status
        case = self.session.query(ExceptionCase).filter(
            ExceptionCase.id == case_id
        ).first()

        if case:
            if decision_type == "APPROVE":
                case.case_status = "APPROVED"
            elif decision_type == "OVERRIDE":
                case.case_status = "OVERRIDDEN"
            elif decision_type == "ESCALATE":
                case.case_status = "ESCALATED"

            case.updated_at = datetime.utcnow().isoformat()

        self.session.commit()

        return ResolutionSubmissionResult(
            success=True,
            decision_id=decision_id,
            message=f"Decision {decision_type} recorded for case {case_id}"
        )
