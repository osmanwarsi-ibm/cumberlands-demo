"""TOL9: AP Batch Validation Port (deferred).

Registered but not invoked; reserved for AGN6 monitoring.
"""
from typing import NamedTuple, Protocol


class ApBatchValidationResult(NamedTuple):
    """Result of AP batch validation (deferred)."""
    deferred: bool
    message: str


class ApBatchValidationPort(Protocol):
    """Port interface for TOL9: AP batch validation (deferred)."""

    def validate(self, batch_id: str) -> ApBatchValidationResult:
        """Validate AP batch (deferred functionality).

        Args:
            batch_id: Batch identifier

        Returns:
            ApBatchValidationResult indicating deferred status
        """
        ...


class DeferredApBatchValidationAdapter:
    """Deferred implementation of ApBatchValidationPort."""

    def validate(self, batch_id: str) -> ApBatchValidationResult:
        """Return deferred status for AP batch validation.

        This functionality is preserved for future AGN6 implementation
        but not invoked in MVP flow.

        Args:
            batch_id: Batch identifier

        Returns:
            ApBatchValidationResult with deferred flag
        """
        raise NotImplementedError(
            "TOL9: AP Batch Validation is deferred. "
            "This boundary is preserved for AGN6 but not executed in MVP."
        )
