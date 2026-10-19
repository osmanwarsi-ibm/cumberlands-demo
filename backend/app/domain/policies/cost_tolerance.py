"""Cost tolerance policy implementing VR-004.

Rule: Per-unit variance exceeds $0.05.
"""
from typing import NamedTuple


class CostToleranceResult(NamedTuple):
    """Result of cost tolerance evaluation."""
    is_exception: bool
    unit_cost_variance: float
    rule_applied: str


class CostTolerancePolicy:
    """Implements cost tolerance rule VR-004 from LLD Section 5.2.

    Exception criteria: abs(variance) > 0.05
    """

    COST_THRESHOLD = 0.05  # dollars per unit

    @classmethod
    def evaluate(
        cls,
        statement_unit_cost: float,
        expected_unit_cost: float
    ) -> CostToleranceResult:
        """Evaluate cost tolerance policy.

        Args:
            statement_unit_cost: Per-unit cost from vendor statement
            expected_unit_cost: Expected per-unit cost from price book

        Returns:
            CostToleranceResult with exception flag and variance
        """
        variance = statement_unit_cost - expected_unit_cost
        abs_variance = abs(variance)

        is_exception = abs_variance > cls.COST_THRESHOLD

        rule_applied = f"VR-004: abs(variance)>{cls.COST_THRESHOLD}"

        return CostToleranceResult(
            is_exception=is_exception,
            unit_cost_variance=variance,
            rule_applied=rule_applied
        )
