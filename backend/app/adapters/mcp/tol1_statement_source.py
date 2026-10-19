"""TOL1: Vendor Statement Source Port (Microsoft 365/Mimecast mock).

Retrieves fixture statement batch payloads.
"""
from typing import NamedTuple, Protocol


class StatementLineDTO(NamedTuple):
    """Statement line data transfer object."""
    vendor_id: str
    store_id: str
    item_id: str
    invoice_ref: str | None
    delivery_ref: str | None
    delivery_date: str | None
    statement_qty: float
    statement_unit_cost: float
    raw_payload: dict


class StatementSourceResult(NamedTuple):
    """Result of statement source fetch."""
    source_identifier: str
    lines: list[StatementLineDTO]
    total_lines: int
    metadata: dict


class VendorStatementSourcePort(Protocol):
    """Port interface for TOL1: Vendor statement source retrieval."""

    def fetch(self, source_identifier: str) -> StatementSourceResult:
        """Fetch statement batch from source.

        Args:
            source_identifier: Fixture source identifier

        Returns:
            StatementSourceResult with lines and metadata
        """
        ...


class FixtureStatementSourceAdapter:
    """Fixture-backed implementation of VendorStatementSourcePort."""

    def __init__(self, session):
        """Initialize with database session for fixture access.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    def fetch(self, source_identifier: str) -> StatementSourceResult:
        """Fetch statement batch from fixture data.

        This is a fixture-backed implementation. In production, this would
        call Microsoft 365/Mimecast API or read from email attachments.

        For MVP, returns hardcoded pilot fixture batch.

        Args:
            source_identifier: Fixture identifier (e.g., "pilot_batch_01")

        Returns:
            StatementSourceResult with fixture lines
        """
        # In MVP, we return a reference to the fixture batch
        # The actual fixture data is loaded from seed.py into the database
        # This adapter signals that the fixture is available for processing
        # Fixture retrieval happens through direct database queries in the intake service
        lines: list[StatementLineDTO] = []

        return StatementSourceResult(
            source_identifier=source_identifier,
            lines=lines,
            total_lines=0,
            metadata={
                "source_type": "fixture_record_set",
                "retrieval_mode": "local_fixture",
                "tol_boundary": "TOL1"
            }
        )
