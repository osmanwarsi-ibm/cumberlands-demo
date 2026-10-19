"""Quantity tolerance policy implementing VR-003.

Rule: Variance exceeds BOTH 2 units AND 2% relative threshold.
"""
from typing import NamedTuple


class QuantityToleranceResult(NamedTuple):
    """Result of quantity tolerance evaluation."""
    is_exception: bool
    absolute_variance: float
    relative_variance_pct: float
    rule_applied: str


class QuantityTolerancePolicy:
    """Implements quantity tolerance rule VR-003 from LLD Section 5.2.

    Exception criteria: abs(variance) > 2 AND abs(variance_pct) > 0.02
    """

    ABSOLUTE_THRESHOLD = 2.0  # units
    RELATIVE_THRESHOLD = 0.02  # 2%

    @classmethod
    def evaluate(
        cls,
        statement_qty: float,
        received_qty: float
    ) -> QuantityToleranceResult:
        """Evaluate quantity tolerance policy.

        Args:
            statement_qty: Quantity from vendor statement
            received_qty: Quantity from receiving record

        Returns:
            QuantityToleranceResult with exception flag and variance details
        """
        variance = statement_qty - received_qty
        abs_variance = abs(variance)

        # Avoid division by zero; if statement_qty is 0, treat as exception
        if statement_qty == 0:
            relative_variance_pct = 0.0
            is_exception = abs_variance > cls.ABSOLUTE_THRESHOLD
        else:
            relative_variance_pct = abs(variance / statement_qty)
            # Both thresholds must be exceeded (AND logic)
            is_exception = (
                abs_variance > cls.ABSOLUTE_THRESHOLD
                and relative_variance_pct > cls.RELATIVE_THRESHOLD
            )

        rule_applied = (
            f"VR-003: abs(variance)>{cls.ABSOLUTE_THRESHOLD} AND "
            f"abs(variance_pct)>{cls.RELATIVE_THRESHOLD}"
        )

        return QuantityToleranceResult(
            is_exception=is_exception,
            absolute_variance=variance,
            relative_variance_pct=relative_variance_pct,
            rule_applied=rule_applied
        )
