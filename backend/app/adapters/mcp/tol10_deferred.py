"""TOL10: Dashboard Publish Port (deferred).

Registered but not invoked; reserved for AGN6 analytics export.
"""
from typing import NamedTuple, Protocol


class DashboardPublishResult(NamedTuple):
    """Result of dashboard publish (deferred)."""
    deferred: bool
    message: str


class DashboardPublishPort(Protocol):
    """Port interface for TOL10: Dashboard publishing (deferred)."""

    def publish(self, payload: dict) -> DashboardPublishResult:
        """Publish analytics payload (deferred functionality).

        Args:
            payload: Analytics data payload

        Returns:
            DashboardPublishResult indicating deferred status
        """
        ...


class DeferredDashboardPublishAdapter:
    """Deferred implementation of DashboardPublishPort."""

    def publish(self, payload: dict) -> DashboardPublishResult:
        """Return deferred status for dashboard publishing.

        This functionality is preserved for future AGN6 implementation
        but not invoked in MVP flow.

        Args:
            payload: Analytics data payload

        Returns:
            DashboardPublishResult with deferred flag
        """
        raise NotImplementedError(
            "TOL10: Dashboard Publishing is deferred. "
            "This boundary is preserved for AGN6 but not executed in MVP."
        )
