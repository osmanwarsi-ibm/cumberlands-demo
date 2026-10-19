"""Reason code validation policy implementing VR-012.

Validates reason codes and evidence for chargeback/credit-request support.
"""
from typing import NamedTuple


class ReasonCodeValidationResult(NamedTuple):
    """Result of reason code validation."""
    is_valid: bool
    reason: str


class ReasonCodePolicy:
    """Implements reason code validation VR-012 from LLD Section 5.2.

    Rule: Chargeback document generation requires reason_code and evidence_bundle_json.
    """

    # Approved pilot reason codes from fixture data
    APPROVED_REASON_CODES = {
        "PC-02": "Price book cost mismatch",
        "PC-05": "Unauthorized price change",
        "QC-03": "Short ship without adjustment",
        "QC-06": "Overship without authorization",
        "UC-01": "Unmatched statement line",
        "UC-02": "Unmatched receipt without statement",
    }

    @classmethod
    def validate_for_chargeback_generation(
        cls,
        reason_code: str | None,
        evidence_bundle: list[str] | None
    ) -> ReasonCodeValidationResult:
        """Validate reason code and evidence for chargeback generation.

        Args:
            reason_code: Reason code from approved pilot list
            evidence_bundle: List of evidence reference identifiers (e.g., ["EV-1", "EV-2"])

        Returns:
            ReasonCodeValidationResult with validation flag and reason
        """
        if not reason_code:
            return ReasonCodeValidationResult(
                is_valid=False,
                reason="Reason code is required for chargeback generation"
            )

        if reason_code not in cls.APPROVED_REASON_CODES:
            return ReasonCodeValidationResult(
                is_valid=False,
                reason=f"Reason code '{reason_code}' not in approved pilot list"
            )

        if not evidence_bundle or len(evidence_bundle) == 0:
            return ReasonCodeValidationResult(
                is_valid=False,
                reason="At least one evidence reference is required for chargeback generation"
            )

        return ReasonCodeValidationResult(
            is_valid=True,
            reason=f"Reason code '{reason_code}' validated with {len(evidence_bundle)} evidence refs"
        )

    @classmethod
    def get_reason_description(cls, reason_code: str) -> str | None:
        """Get human-readable description for a reason code.

        Args:
            reason_code: Reason code to look up

        Returns:
            Description string or None if code not found
        """
        return cls.APPROVED_REASON_CODES.get(reason_code)
