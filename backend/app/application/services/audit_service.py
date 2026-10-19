"""Audit service for capturing immutable audit events."""
import uuid
from datetime import datetime


class AuditService:
    """Orchestrates audit event capture and retrieval."""

    def __init__(self, session):
        """Initialize with database session.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    def log_event(
        self,
        aggregate_type: str,
        aggregate_id: str,
        actor_type: str,
        actor_id: str,
        event_type: str,
        details: dict
    ) -> str:
        """Log an immutable audit event.

        Args:
            aggregate_type: BATCH, CASE, SETTLEMENT, etc.
            aggregate_id: Identifier of the aggregate
            actor_type: SYSTEM, USER, or BOUNDARY
            actor_id: Identifier of the actor
            event_type: Event type code
            details: Event details dictionary

        Returns:
            Audit event ID
        """
        import json

        from ...db.models import AuditEvent

        event_id = str(uuid.uuid4())
        event = AuditEvent(
            id=event_id,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            actor_type=actor_type,
            actor_id=actor_id,
            event_type=event_type,
            details_json=json.dumps(details),
            event_ts=datetime.utcnow().isoformat()
        )

        self.session.add(event)
        self.session.commit()

        return event_id

    def get_case_timeline(self, case_id: str) -> list[dict]:
        """Get chronological audit timeline for a case.

        Args:
            case_id: Exception case identifier

        Returns:
            List of audit event dictionaries
        """
        import json

        from ...db.models import AuditEvent

        events = self.session.query(AuditEvent).filter(
            AuditEvent.aggregate_type == "CASE",
            AuditEvent.aggregate_id == case_id
        ).order_by(AuditEvent.event_ts).all()

        timeline = []
        for event in events:
            try:
                details = json.loads(event.details_json)
            except (json.JSONDecodeError, ValueError):
                details = {}

            timeline.append({
                "id": event.id,
                "event_ts": event.event_ts,
                "actor_type": event.actor_type,
                "actor_id": event.actor_id,
                "event_type": event.event_type,
                "details": details
            })

        return timeline
