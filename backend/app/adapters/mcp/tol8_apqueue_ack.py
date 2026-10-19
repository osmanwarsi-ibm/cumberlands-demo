"""TOL8: AP Queue Acknowledgment Port (Oracle AP mock).

Returns mock acknowledgment or reject code for AP queue submissions.
"""
from typing import NamedTuple, Protocol


class ApAckResult(NamedTuple):
    """Result of AP queue acknowledgment."""
    queue_entry_id: str
    ack_status: str
    message: str


class ApQueueAckPort(Protocol):
    """Port interface for TOL8: AP queue acknowledgment."""

    def ack(self, queue_entry_id: str) -> ApAckResult:
        """Get acknowledgment status for AP queue entry.

        Args:
            queue_entry_id: Queue entry identifier

        Returns:
            ApAckResult with acknowledgment status
        """
        ...


class MockApQueueAckAdapter:
    """Mock implementation of ApQueueAckPort."""

    def __init__(self, session):
        """Initialize with database session.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    def ack(self, queue_entry_id: str) -> ApAckResult:
        """Get mock acknowledgment for AP queue entry.

        In production, this would poll Oracle AP for acknowledgment.
        For MVP, returns simulated ACCEPTED status.

        Args:
            queue_entry_id: Queue entry identifier

        Returns:
            ApAckResult with mock acknowledgment
        """
        from ...db.models import ApQueueEntry

        entry = self.session.query(ApQueueEntry).filter(
            ApQueueEntry.id == queue_entry_id
        ).first()

        if not entry:
            return ApAckResult(
                queue_entry_id=queue_entry_id,
                ack_status="REJECTED",
                message="Queue entry not found"
            )

        # Mock acknowledgment - always accepts for MVP
        # In production, Oracle AP might reject due to validation failures
        ack_status = "ACCEPTED"
        entry.ack_status = ack_status
        self.session.commit()

        return ApAckResult(
            queue_entry_id=queue_entry_id,
            ack_status=ack_status,
            message="AP queue submission acknowledged"
        )
