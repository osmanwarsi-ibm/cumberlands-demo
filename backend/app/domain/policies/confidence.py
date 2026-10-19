"""Confidence model policy implementing VR-008 and VR-009.

Assigns confidence bands and applies penalties for missing context.
"""
from enum import StrEnum
from typing import NamedTuple


class ConfidenceBand(StrEnum):
    """Confidence bands for triage recommendations."""
    GREEN = "GREEN"  # >= 0.85
    AMBER = "AMBER"  # 0.60 - 0.84
    RED = "RED"      # < 0.60
    NONE = "NONE"    # No recommendation (manual routing)


class ConfidencePenalty(NamedTuple):
    """Penalty applied for missing context element."""
    element: str
    penalty: float
    reason: str


class ConfidenceResult(NamedTuple):
    """Result of confidence evaluation."""
    confidence_score: float
    confidence_band: ConfidenceBand
    penalties: list[ConfidencePenalty]
    missing_context_elements: list[str]
    manual_routing_required: bool


class ConfidencePolicy:
    """Implements confidence model VR-008 and VR-009 from LLD Section 5.4.

    Evaluates required context elements and applies penalties:
    - missing receiving: -0.25
    - missing cost: -0.20
    - missing history: -0.10
    - missing doc/date: -0.10

    Manual routing when missing_context_count > 2 (VR-009).
    """

    # Confidence band thresholds
    GREEN_THRESHOLD = 0.85
    AMBER_THRESHOLD = 0.60

    # Manual routing threshold
    MANUAL_ROUTING_THRESHOLD = 2

    # Base score before penalties
    BASE_SCORE = 1.0

    # Penalty amounts
    MISSING_RECEIVING_PENALTY = 0.25
    MISSING_COST_PENALTY = 0.20
    MISSING_HISTORY_PENALTY = 0.10
    MISSING_DOC_DATE_PENALTY = 0.10

    @classmethod
    def evaluate(
        cls,
        has_statement_line: bool = True,
        has_receiving_record: bool = False,
        has_expected_cost: bool = False,
        has_prior_history: bool = False,
        has_document_refs: bool = False,
        has_effective_date_alignment: bool = False,
    ) -> ConfidenceResult:
        """Evaluate confidence based on available context elements.

        Args:
            has_statement_line: Whether normalized statement line exists (always true in practice)
            has_receiving_record: Whether receiving record from TOL2 exists
            has_expected_cost: Whether expected cost from TOL3 exists
            has_prior_history: Whether exception history from TOL4 exists
            has_document_refs: Whether invoice_ref/delivery_ref are present
            has_effective_date_alignment: Whether delivery_date aligns with effective dates

        Returns:
            ConfidenceResult with score, band, penalties, and manual routing flag
        """
        score = cls.BASE_SCORE
        penalties: list[ConfidencePenalty] = []
        missing_elements: list[str] = []

        # Apply penalties for missing required context
        if not has_receiving_record:
            penalties.append(ConfidencePenalty(
                element="receiving_record",
                penalty=cls.MISSING_RECEIVING_PENALTY,
                reason="No receiving record found via TOL2"
            ))
            missing_elements.append("receiving_record")
            score -= cls.MISSING_RECEIVING_PENALTY

        if not has_expected_cost:
            penalties.append(ConfidencePenalty(
                element="expected_cost",
                penalty=cls.MISSING_COST_PENALTY,
                reason="No expected cost found via TOL3"
            ))
            missing_elements.append("expected_cost")
            score -= cls.MISSING_COST_PENALTY

        if not has_prior_history:
            penalties.append(ConfidencePenalty(
                element="prior_history",
                penalty=cls.MISSING_HISTORY_PENALTY,
                reason="No prior exception history found via TOL4"
            ))
            missing_elements.append("prior_history")
            score -= cls.MISSING_HISTORY_PENALTY

        if not has_document_refs:
            penalties.append(ConfidencePenalty(
                element="document_refs",
                penalty=cls.MISSING_DOC_DATE_PENALTY,
                reason="Missing invoice_ref or delivery_ref"
            ))
            missing_elements.append("document_refs")
            score -= cls.MISSING_DOC_DATE_PENALTY

        if not has_effective_date_alignment:
            penalties.append(ConfidencePenalty(
                element="effective_date_alignment",
                penalty=cls.MISSING_DOC_DATE_PENALTY,
                reason="Delivery date does not align with effective dates"
            ))
            missing_elements.append("effective_date_alignment")
            score -= cls.MISSING_DOC_DATE_PENALTY

        # Ensure score does not go negative
        score = max(0.0, score)

        # Determine manual routing requirement (VR-009)
        missing_context_count = len(missing_elements)
        manual_routing_required = missing_context_count > cls.MANUAL_ROUTING_THRESHOLD

        # Assign confidence band
        if manual_routing_required:
            # Mandatory manual review due to severe context gaps
            confidence_band = ConfidenceBand.NONE
        elif score >= cls.GREEN_THRESHOLD:
            confidence_band = ConfidenceBand.GREEN
        elif score >= cls.AMBER_THRESHOLD:
            confidence_band = ConfidenceBand.AMBER
        else:
            confidence_band = ConfidenceBand.RED

        return ConfidenceResult(
            confidence_score=score,
            confidence_band=confidence_band,
            penalties=penalties,
            missing_context_elements=missing_elements,
            manual_routing_required=manual_routing_required
        )
