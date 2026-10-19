"""Review workflow service orchestrating human decision recording."""


class ReviewWorkflowService:
    """Orchestrates human review decision workflows."""

    def __init__(self, session, resolution_adapter, sod_policy):
        """Initialize with dependencies.

        Args:
            session: SQLAlchemy session
            resolution_adapter: TOL5 adapter for resolution submission
            sod_policy: Segregation of duties policy
        """
        self.session = session
        self.resolution_adapter = resolution_adapter
        self.sod_policy = sod_policy

    def record_decision(
        self,
        case_id: str,
        reviewer_user_id: str,
        decision_type: str,
        reason_code: str | None = None,
        rationale_note: str | None = None
    ) -> dict:
        """Record review decision for exception case.

        Args:
            case_id: Exception case identifier
            reviewer_user_id: User making decision
            decision_type: APPROVE, OVERRIDE, or ESCALATE
            reason_code: Optional reason code
            rationale_note: Optional rationale text

        Returns:
            Dictionary with decision details
        """
        from ...db.models import ExceptionCase, MatchResult, StatementBatch, StatementLine

        # Get case and check if reviewable
        case = self.session.query(ExceptionCase).filter(
            ExceptionCase.id == case_id
        ).first()

        if not case:
            raise ValueError(f"Case not found: {case_id}")

        if case.case_status not in ("OPEN", "UNDER_REVIEW"):
            raise ValueError(f"Case not in reviewable state: {case.case_status}")

        # Check SoD: reviewer should not be the ingestion user
        match_result = self.session.query(MatchResult).filter(
            MatchResult.id == case.match_result_id
        ).first()

        statement_line = self.session.query(StatementLine).filter(
            StatementLine.id == match_result.statement_line_id
        ).first()

        batch = self.session.query(StatementBatch).filter(
            StatementBatch.id == statement_line.batch_id
        ).first()

        sod_check = self.sod_policy.check_review_decision(
            reviewer_user_id=reviewer_user_id,
            ingested_by_user_id=batch.ingested_by_user_id if batch else None
        )

        if sod_check.violated:
            # Log SoD violation (would create audit event here)
            raise PermissionError(f"SoD violation: {sod_check.reason}")

        # Submit decision via TOL5
        result = self.resolution_adapter.submit(
            case_id=case_id,
            decision_type=decision_type,
            reviewer_user_id=reviewer_user_id,
            reason_code=reason_code,
            rationale_note=rationale_note
        )

        if not result.success:
            raise RuntimeError(f"Decision submission failed: {result.message}")

        # Refresh case to get updated status
        self.session.refresh(case)

        return {
            "case_id": case_id,
            "decision_id": result.decision_id,
            "case_status": case.case_status,
            "message": result.message
        }

    def get_queue_items(
        self,
        queue_type: str,
        status: str | None = None,
        limit: int = 50
    ) -> dict:
        """Get exception queue items for a given queue type.

        Args:
            queue_type: cost_review, quantity_review, ap_review, or vendor_follow_up
            status: Optional status filter
            limit: Maximum items to return

        Returns:
            Dictionary with queue items and total count
        """
        from ...db.models import ExceptionCase, TriageRecommendation

        query = self.session.query(ExceptionCase).filter(
            ExceptionCase.queue_type == queue_type
        )

        if status:
            query = query.filter(ExceptionCase.case_status == status)

        total = query.count()
        cases = query.limit(limit).all()

        items = []
        for case in cases:
            # Get latest triage recommendation if exists
            triage = self.session.query(TriageRecommendation).filter(
                TriageRecommendation.case_id == case.id
            ).order_by(TriageRecommendation.created_at.desc()).first()

            items.append({
                "case_id": case.id,
                "case_type": case.case_type,
                "case_status": case.case_status,
                "confidence_band": triage.confidence_band if triage else "NONE",
                "missing_context_count": case.missing_context_count,
                "recommended_action": triage.suggestion if triage else None,
                "assigned_role": case.current_owner_role
            })

        return {
            "queue_type": queue_type,
            "total": total,
            "items": items
        }
