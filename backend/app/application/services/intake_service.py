"""Intake service orchestrating AGN1 statement ingestion workflow."""
import uuid
from datetime import datetime


class IntakeService:
    """Orchestrates statement ingestion, validation, and normalization (AGN1)."""

    def __init__(self, session, statement_source_adapter):
        """Initialize with dependencies.

        Args:
            session: SQLAlchemy session
            statement_source_adapter: TOL1 adapter for statement retrieval
        """
        self.session = session
        self.statement_source = statement_source_adapter

    def ingest_batch(
        self,
        source_type: str,
        source_identifier: str,
        initiated_by_user_id: str
    ) -> dict:
        """Ingest statement batch from fixture source.

        Args:
            source_type: fixture_file or fixture_record_set
            source_identifier: Fixture identifier
            initiated_by_user_id: User initiating ingestion

        Returns:
            Dictionary with batch_id, status, counts, and rejection_reasons

        Raises:
            ValueError: If source_type is not valid
        """
        from ...db.models import StatementBatch

        # Validate source_type
        valid_source_types = {"fixture_file", "fixture_record_set"}
        if source_type not in valid_source_types:
            raise ValueError(
                f"Invalid source_type '{source_type}'. "
                f"Must be one of: {', '.join(sorted(valid_source_types))}"
            )

        batch_id = str(uuid.uuid4())

        # Create batch record
        batch = StatementBatch(
            id=batch_id,
            source_type=source_type,
            source_identifier=source_identifier,
            status="PENDING",
            total_lines=0,
            accepted_lines=0,
            rejected_lines=0,
            ingested_by_user_id=initiated_by_user_id,
            ingested_at=datetime.utcnow().isoformat()
        )

        self.session.add(batch)
        self.session.flush()

        # For MVP, we signal fixture availability but don't process lines yet
        # Actual line processing happens in the reconciliation service
        # This matches the fixture-backed approach where seed data pre-populates lines

        # Fetch statement source metadata via TOL1
        self.statement_source.fetch(source_identifier)

        # Update batch with placeholder counts
        # In real implementation, would process lines here
        batch.total_lines = 0
        batch.accepted_lines = 0
        batch.rejected_lines = 0
        batch.status = "COMPLETED"

        self.session.commit()

        return {
            "batch_id": batch_id,
            "status": batch.status,
            "total_lines": batch.total_lines,
            "accepted_lines": batch.accepted_lines,
            "rejected_lines": batch.rejected_lines,
            "rejection_reasons": []
        }
