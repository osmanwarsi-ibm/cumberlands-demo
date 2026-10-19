"""Five-outcome classification policy implementing VR-005.

Classifies each line into exactly one outcome class.
"""
from enum import StrEnum
from typing import NamedTuple


class OutcomeClass(StrEnum):
    """Five mutually exclusive outcome classes."""
    FULL_MATCH = "FULL_MATCH"
    COST_EXCEPTION = "COST_EXCEPTION"
    QUANTITY_EXCEPTION = "QUANTITY_EXCEPTION"
    UNMATCHED_STATEMENT = "UNMATCHED_STATEMENT"
    UNMATCHED_RECEIPT = "UNMATCHED_RECEIPT"


class ClassificationResult(NamedTuple):
    """Result of outcome classification."""
    outcome_class: OutcomeClass
    reason: str
    rules_applied: list[str]


class ClassificationPolicy:
    """Implements five-outcome classification VR-005 from LLD Section 5.1.

    Produces exactly one of:
    - Full Match: both quantity and cost within tolerance AND required refs exist
    - Cost Exception: cost variance > $0.05
    - Quantity Exception: both 2-unit and 2% thresholds exceeded
    - Unmatched Statement: no receiving record found
    - Unmatched Receipt: receipt exists but no statement line matches
    """

    @classmethod
    def classify(
        cls,
        has_receiving_record: bool,
        has_price_book_cost: bool,
        quantity_exception: bool,
        cost_exception: bool,
        statement_qty: float | None = None,
        received_qty: float | None = None,
    ) -> ClassificationResult:
        """Classify a statement line outcome.

        Args:
            has_receiving_record: Whether receiving record was found
            has_price_book_cost: Whether price book cost was found
            quantity_exception: Whether quantity tolerance was exceeded
            cost_exception: Whether cost tolerance was exceeded
            statement_qty: Optional statement quantity for context
            received_qty: Optional received quantity for context

        Returns:
            ClassificationResult with outcome class and reasoning
        """
        rules_applied = []

        # Unmatched Statement: no receiving record
        if not has_receiving_record:
            return ClassificationResult(
                outcome_class=OutcomeClass.UNMATCHED_STATEMENT,
                reason="No receiving record found for statement line",
                rules_applied=["VR-006: Missing receiving evidence"]
            )

        # Unmatched Receipt: receiving exists but statement has no valid match path
        # (This would be handled by a separate receipt-scanning flow in AGN3, deferred in MVP)
        # For MVP, we classify from statement perspective only

        # Quantity Exception: both thresholds exceeded
        if quantity_exception:
            rules_applied.append("VR-003: Quantity variance exceeds both 2 units and 2%")
            return ClassificationResult(
                outcome_class=OutcomeClass.QUANTITY_EXCEPTION,
                reason="Quantity variance exceeds tolerance",
                rules_applied=rules_applied
            )

        # Cost Exception: per-unit variance > $0.05
        if cost_exception:
            rules_applied.append("VR-004: Cost variance exceeds $0.05")
            return ClassificationResult(
                outcome_class=OutcomeClass.COST_EXCEPTION,
                reason="Cost variance exceeds tolerance",
                rules_applied=rules_applied
            )

        # Full Match: no quantity or cost exception and required references exist
        if has_receiving_record and has_price_book_cost:
            rules_applied.append("VR-005: All tolerances met and references present")
            return ClassificationResult(
                outcome_class=OutcomeClass.FULL_MATCH,
                reason="All variances within tolerance",
                rules_applied=rules_applied
            )

        # Fallback: missing expected cost but within quantity tolerance
        # Treat as cost exception requiring review
        return ClassificationResult(
            outcome_class=OutcomeClass.COST_EXCEPTION,
            reason="Missing expected cost reference",
            rules_applied=["VR-006: Missing expected cost evidence"]
        )
