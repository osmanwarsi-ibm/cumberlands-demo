"""Triage service orchestrating AGN4 AI-assisted exception triage."""
import json
import uuid
from datetime import datetime


class TriageService:
    """Orchestrates AI-assisted exception triage (AGN4)."""

    def __init__(
        self,
        session,
        history_adapter,
        confidence_policy,
        triage_mode="MOCK"
    ):
        """Initialize with dependencies.

        Args:
            session: SQLAlchemy session
            history_adapter: TOL4 adapter for exception history
            confidence_policy: Confidence model policy
            triage_mode: MOCK or LLM mode
        """
        self.session = session
        self.history_adapter = history_adapter
        self.confidence_policy = confidence_policy
        self.triage_mode = triage_mode

    def generate_triage(self, case_id: str) -> dict:
        """Generate triage recommendation for exception case.

        Args:
            case_id: Exception case identifier

        Returns:
            Dictionary with triage recommendation details
        """
        from ...db.models import ExceptionCase, MatchResult, StatementLine, TriageRecommendation

        case = self.session.query(ExceptionCase).filter(
            ExceptionCase.id == case_id
        ).first()

        if not case:
            raise ValueError(f"Case not found: {case_id}")

        # Get match result and statement line for context
        match_result = self.session.query(MatchResult).filter(
            MatchResult.id == case.match_result_id
        ).first()

        statement_line = self.session.query(StatementLine).filter(
            StatementLine.id == match_result.statement_line_id
        ).first()

        # Evaluate confidence based on available context
        has_receiving = match_result.receiving_record_id is not None
        has_cost = match_result.price_book_cost_id is not None
        has_doc_refs = statement_line.invoice_ref is not None and statement_line.delivery_ref is not None

        # Check for prior history via TOL4
        history = self.history_adapter.find(
            vendor_id=statement_line.vendor_id,
            item_id=statement_line.item_id,
            case_type=case.case_type
        )
        has_history = len(history) > 0

        # Evaluate confidence
        confidence_result = self.confidence_policy.evaluate(
            has_statement_line=True,
            has_receiving_record=has_receiving,
            has_expected_cost=has_cost,
            has_prior_history=has_history,
            has_document_refs=has_doc_refs,
            has_effective_date_alignment=has_cost  # Simplified check
        )

        # Update case with missing context info
        case.missing_context_count = len(confidence_result.missing_context_elements)
        case.missing_context_list_json = json.dumps(confidence_result.missing_context_elements)
        case.updated_at = datetime.utcnow().isoformat()

        # Generate recommendation based on confidence and mode
        if confidence_result.manual_routing_required:
            suggestion = "MANUAL_REVIEW_REQUIRED"
            rationale = f"Missing context count ({confidence_result.missing_context_count}) exceeds threshold (2). Manual review required."
        elif self.triage_mode == "MOCK":
            suggestion = self._generate_mock_suggestion(case.case_type, confidence_result.confidence_score)
            rationale = self._generate_mock_rationale(case.case_type, match_result)
        else:
            # LLM mode would call actual AI provider here
            suggestion = "APPROVE_WITH_ADJUSTMENT"
            rationale = "AI-generated recommendation (LLM mode not fully implemented in MVP)"

        # Build evidence references
        evidence_refs = []
        if match_result.receiving_record_id:
            evidence_refs.append(f"EV-1: Receiving record {match_result.receiving_record_id}")
        if match_result.price_book_cost_id:
            evidence_refs.append(f"EV-2: Price book cost {match_result.price_book_cost_id}")
        if has_history:
            evidence_refs.append(f"EV-3: Prior history ({len(history)} cases)")

        # Build penalty reasons
        penalty_reasons = [
            f"{p.element}: {p.reason} (-{p.penalty:.2f})"
            for p in confidence_result.penalties
        ]

        # Create triage recommendation record
        triage_id = str(uuid.uuid4())
        triage = TriageRecommendation(
            id=triage_id,
            case_id=case_id,
            provider_mode=self.triage_mode,
            suggestion=suggestion,
            confidence_score=confidence_result.confidence_score,
            confidence_band=confidence_result.confidence_band.value,
            rationale=rationale,
            evidence_refs_json=json.dumps(evidence_refs),
            penalty_reasons_json=json.dumps(penalty_reasons),
            created_at=datetime.utcnow().isoformat()
        )

        self.session.add(triage)
        self.session.commit()

        return {
            "triage_id": triage_id,
            "case_id": case_id,
            "suggestion": suggestion,
            "confidence_score": confidence_result.confidence_score,
            "confidence_band": confidence_result.confidence_band.value,
            "manual_routing_required": confidence_result.manual_routing_required,
            "missing_context_count": case.missing_context_count
        }

    def _generate_mock_suggestion(self, case_type: str, confidence_score: float) -> str:
        """Generate mock suggestion based on case type and confidence.

        Args:
            case_type: Exception case type
            confidence_score: Confidence score

        Returns:
            Suggestion string
        """
        if confidence_score >= 0.85:
            return "APPROVE_AS_IS"
        elif confidence_score >= 0.60:
            return "APPROVE_WITH_ADJUSTMENT"
        else:
            return "ESCALATE_FOR_REVIEW"

    def _generate_mock_rationale(self, case_type: str, match_result) -> str:
        """Generate mock rationale based on case details.

        Args:
            case_type: Exception case type
            match_result: MatchResult model instance

        Returns:
            Rationale string
        """
        if case_type == "COST_EXCEPTION":
            return (
                f"Cost variance of ${abs(match_result.cost_variance):.2f} detected. "
                "Receiving evidence confirms quantity. Recommend approval with cost adjustment."
            )
        elif case_type == "QUANTITY_EXCEPTION":
            return (
                f"Quantity variance of {abs(match_result.quantity_variance):.1f} units "
                f"({abs(match_result.quantity_variance_pct)*100:.1f}%) detected. "
                "Recommend approval with quantity adjustment."
            )
        else:
            return "Unmatched line requires manual investigation to determine appropriate resolution."
