"""TOL6: AP Queue Submission Port (Oracle AP mock).

Writes settlement-ready payload to local AP queue table.
"""
import json
from typing import NamedTuple, Protocol


class ApQueueSubmissionResult(NamedTuple):
    """Result of AP queue submission."""
    success: bool
    queue_entry_id: str | None
    queue_status: str
    message: str


class ApQueueSubmissionPort(Protocol):
    """Port interface for TOL6: AP queue submission."""

    def submit(
        self,
        settlement_record_id: str,
        payload: dict
    ) -> ApQueueSubmissionResult:
        """Submit settlement to AP queue.

        Args:
            settlement_record_id: Settlement record identifier
            payload: Settlement payload with vendor/item/amount details

        Returns:
            ApQueueSubmissionResult with queue entry status
        """
        ...


class MockApQueueSubmissionAdapter:
    """Mock implementation of ApQueueSubmissionPort."""

    def __init__(self, session):
        """Initialize with database session.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    def submit(
        self,
        settlement_record_id: str,
        payload: dict
    ) -> ApQueueSubmissionResult:
        """Submit settlement to mock AP queue table.

        In production, this would call Oracle AP interface.
        For MVP, writes to local ap_queue_entries table.

        Args:
            settlement_record_id: Settlement record identifier
            payload: Settlement payload

        Returns:
            ApQueueSubmissionResult with queue entry status
        """
        import uuid
        from datetime import datetime

        from ...db.models import ApQueueEntry

        queue_entry_id = str(uuid.uuid4())

        # Mock queue submission - always succeeds for MVP
        # In production, this might fail due to validation or connectivity issues
        queue_status = "QUEUED"
        ack_status = "PENDING"

        entry = ApQueueEntry(
            id=queue_entry_id,
            settlement_record_id=settlement_record_id,
            queue_status=queue_status,
            ack_status=ack_status,
            payload_json=json.dumps(payload),
            failure_reason=None,
            created_at=datetime.utcnow().isoformat()
        )

        self.session.add(entry)
        self.session.commit()

        return ApQueueSubmissionResult(
            success=True,
            queue_entry_id=queue_entry_id,
            queue_status=queue_status,
            message=f"Settlement queued successfully: {queue_entry_id}"
        )
