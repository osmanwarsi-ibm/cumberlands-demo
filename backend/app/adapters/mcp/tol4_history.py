"""TOL4: Exception History Port.

Retrieves prior exception patterns from fixture history.
"""
from typing import NamedTuple, Protocol


class ExceptionHistorySummary(NamedTuple):
    """Exception history summary data transfer object."""
    id: str
    vendor_id: str
    item_id: str
    case_type: str
    prior_outcome: str
    summary: dict


class ExceptionHistoryPort(Protocol):
    """Port interface for TOL4: Exception history retrieval."""

    def find(
        self,
        vendor_id: str,
        item_id: str,
        case_type: str | None = None
    ) -> list[ExceptionHistorySummary]:
        """Find prior exception history for vendor/item.

        Args:
            vendor_id: Vendor identifier
            item_id: Item identifier
            case_type: Optional case type filter

        Returns:
            List of ExceptionHistorySummary records
        """
        ...


class FixtureExceptionHistoryAdapter:
    """Fixture-backed implementation of ExceptionHistoryPort."""

    def __init__(self, session):
        """Initialize with database session.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    def find(
        self,
        vendor_id: str,
        item_id: str,
        case_type: str | None = None
    ) -> list[ExceptionHistorySummary]:
        """Find prior exception history from fixture table.

        Args:
            vendor_id: Vendor identifier
            item_id: Item identifier
            case_type: Optional case type filter

        Returns:
            List of ExceptionHistorySummary records
        """
        import json

        from ...db.models import ExceptionHistoryFixture

        query = self.session.query(ExceptionHistoryFixture).filter(
            ExceptionHistoryFixture.vendor_id == vendor_id,
            ExceptionHistoryFixture.item_id == item_id
        )

        if case_type:
            query = query.filter(ExceptionHistoryFixture.case_type == case_type)

        records = query.all()

        summaries = []
        for record in records:
            try:
                summary = json.loads(record.summary_json)
            except (json.JSONDecodeError, ValueError):
                summary = {}

            summaries.append(ExceptionHistorySummary(
                id=record.id,
                vendor_id=record.vendor_id,
                item_id=record.item_id,
                case_type=record.case_type,
                prior_outcome=record.prior_outcome,
                summary=summary
            ))

        return summaries
