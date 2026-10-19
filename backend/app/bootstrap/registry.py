"""Service registry and deferred boundary registration."""
from typing import Any


class DeferredBoundaryRegistry:
    """Registers AGN3, AGN6, TOL9, TOL10 contracts without execution."""

    def __init__(self):
        """Initialize registry with deferred boundaries."""
        self._boundaries: dict[str, dict[str, Any]] = {}
        self._register_deferred_boundaries()

    def _register_deferred_boundaries(self):
        """Register all deferred boundaries at startup."""
        # AGN3: Unposted Receipt Monitor
        self._boundaries["AGN3"] = {
            "boundary_key": "AGN3",
            "boundary_type": "AGENT",
            "status": "DEFERRED",
            "notes": "Unposted Receipt Monitor agent preserved for future implementation. "
                     "Not invoked in MVP flow.",
            "interface": "agn3_unposted_receipt_monitor_port"
        }

        # AGN6: Reconciliation Monitor
        self._boundaries["AGN6"] = {
            "boundary_key": "AGN6",
            "boundary_type": "AGENT",
            "status": "DEFERRED",
            "notes": "Reconciliation Monitor agent preserved for future implementation. "
                     "Not invoked in MVP flow.",
            "interface": "agn6_reconciliation_monitor_port"
        }

        # TOL9: AP Batch Validation
        self._boundaries["TOL9"] = {
            "boundary_key": "TOL9",
            "boundary_type": "TOOL",
            "status": "DEFERRED",
            "notes": "AP Batch Validation tool preserved for AGN6. "
                     "Not invoked in MVP flow.",
            "interface": "ap_batch_validation_port"
        }

        # TOL10: Dashboard Publish
        self._boundaries["TOL10"] = {
            "boundary_key": "TOL10",
            "boundary_type": "TOOL",
            "status": "DEFERRED",
            "notes": "Dashboard Publishing tool preserved for AGN6 analytics export. "
                     "Not invoked in MVP flow.",
            "interface": "dashboard_publish_port"
        }

    def get_boundary(self, boundary_key: str) -> dict[str, Any] | None:
        """Get deferred boundary metadata.

        Args:
            boundary_key: AGN3, AGN6, TOL9, or TOL10

        Returns:
            Boundary metadata or None if not found
        """
        return self._boundaries.get(boundary_key)

    def list_all_boundaries(self) -> list[dict[str, Any]]:
        """List all registered deferred boundaries.

        Returns:
            List of boundary metadata dictionaries
        """
        return list(self._boundaries.values())

    def is_deferred(self, boundary_key: str) -> bool:
        """Check if a boundary is deferred.

        Args:
            boundary_key: Boundary identifier

        Returns:
            True if deferred, False otherwise
        """
        boundary = self._boundaries.get(boundary_key)
        return boundary is not None and boundary["status"] == "DEFERRED"


class ServiceRegistry:
    """Central registry for dependency injection and service wiring."""

    def __init__(self, session_factory, config):
        """Initialize with session factory and configuration.

        Args:
            session_factory: SQLAlchemy session factory
            config: ConfigurationService instance
        """
        self.session_factory = session_factory
        self.config = config
        self.deferred_registry = DeferredBoundaryRegistry()

    def create_session(self):
        """Create a new database session.

        Returns:
            SQLAlchemy session
        """
        return self.session_factory()

    def get_intake_service(self, session):
        """Create intake service with dependencies.

        Args:
            session: SQLAlchemy session

        Returns:
            IntakeService instance
        """
        from ..adapters.mcp.tol1_statement_source import FixtureStatementSourceAdapter
        from ..application.services.intake_service import IntakeService

        statement_source_adapter = FixtureStatementSourceAdapter(session)
        return IntakeService(session, statement_source_adapter)

    def get_matching_service(self, session):
        """Create matching service with dependencies.

        Args:
            session: SQLAlchemy session

        Returns:
            MatchingService instance
        """
        from ..adapters.mcp.tol2_receiving import FixtureReceivingRecordsAdapter
        from ..adapters.mcp.tol3_pricebook import FixturePriceBookCostAdapter
        from ..application.services.matching_service import MatchingService
        from ..domain.policies.classification import ClassificationPolicy
        from ..domain.policies.cost_tolerance import CostTolerancePolicy
        from ..domain.policies.quantity_tolerance import QuantityTolerancePolicy

        receiving_adapter = FixtureReceivingRecordsAdapter(session)
        pricebook_adapter = FixturePriceBookCostAdapter(session)

        return MatchingService(
            session,
            receiving_adapter,
            pricebook_adapter,
            QuantityTolerancePolicy,
            CostTolerancePolicy,
            ClassificationPolicy
        )

    def get_triage_service(self, session):
        """Create triage service with dependencies.

        Args:
            session: SQLAlchemy session

        Returns:
            TriageService instance
        """
        from ..adapters.mcp.tol4_history import FixtureExceptionHistoryAdapter
        from ..application.services.triage_service import TriageService
        from ..domain.policies.confidence import ConfidencePolicy

        history_adapter = FixtureExceptionHistoryAdapter(session)

        return TriageService(
            session,
            history_adapter,
            ConfidencePolicy,
            triage_mode=self.config.triage_mode
        )

    def get_review_workflow_service(self, session):
        """Create review workflow service with dependencies.

        Args:
            session: SQLAlchemy session

        Returns:
            ReviewWorkflowService instance
        """
        from ..adapters.mcp.tol5_resolution import LocalResolutionSubmissionAdapter
        from ..application.services.review_workflow_service import ReviewWorkflowService
        from ..domain.policies.sod import SoDPolicy

        resolution_adapter = LocalResolutionSubmissionAdapter(session)

        return ReviewWorkflowService(session, resolution_adapter, SoDPolicy)

    def get_settlement_service(self, session):
        """Create settlement service with dependencies.

        Args:
            session: SQLAlchemy session

        Returns:
            SettlementService instance
        """
        from ..adapters.mcp.tol6_apqueue import MockApQueueSubmissionAdapter
        from ..adapters.mcp.tol7_chargeback import LocalChargebackDocumentAdapter
        from ..adapters.mcp.tol8_apqueue_ack import MockApQueueAckAdapter
        from ..application.services.settlement_service import SettlementService
        from ..domain.policies.reason_code import ReasonCodePolicy
        from ..domain.policies.sod import SoDPolicy

        apqueue_adapter = MockApQueueSubmissionAdapter(session)
        apqueue_ack_adapter = MockApQueueAckAdapter(session)
        chargeback_adapter = LocalChargebackDocumentAdapter(session)

        return SettlementService(
            session,
            apqueue_adapter,
            apqueue_ack_adapter,
            chargeback_adapter,
            SoDPolicy,
            ReasonCodePolicy
        )

    def get_audit_service(self, session):
        """Create audit service with dependencies.

        Args:
            session: SQLAlchemy session

        Returns:
            AuditService instance
        """
        from ..application.services.audit_service import AuditService

        return AuditService(session)


# Global service registry (will be initialized with session factory at startup)
_registry: ServiceRegistry | None = None


def initialize_registry(session_factory, config):
    """Initialize global service registry.

    Args:
        session_factory: SQLAlchemy session factory
        config: ConfigurationService instance
    """
    global _registry
    _registry = ServiceRegistry(session_factory, config)


def get_registry() -> ServiceRegistry:
    """Get global service registry.

    Returns:
        ServiceRegistry instance

    Raises:
        RuntimeError: If registry not initialized
    """
    if _registry is None:
        raise RuntimeError("Service registry not initialized. Call initialize_registry() first.")
    return _registry
