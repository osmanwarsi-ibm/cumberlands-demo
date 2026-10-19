"""TOL3: Price Book Cost Port (BOS/PDI mock).

Looks up fixture expected unit cost and effective dates.
"""
from typing import NamedTuple, Protocol


class PriceBookCostDTO(NamedTuple):
    """Price book cost data transfer object."""
    id: str
    vendor_id: str
    item_id: str
    expected_unit_cost: float
    effective_start: str | None
    effective_end: str | None
    source_system: str


class PriceBookCostPort(Protocol):
    """Port interface for TOL3: Price book cost retrieval."""

    def lookup(
        self,
        vendor_id: str,
        item_id: str,
        date: str | None = None
    ) -> PriceBookCostDTO | None:
        """Look up expected cost from price book.

        Args:
            vendor_id: Vendor identifier
            item_id: Item identifier
            date: Optional effective date for temporal lookup

        Returns:
            PriceBookCostDTO if found, None otherwise
        """
        ...


class FixturePriceBookCostAdapter:
    """Fixture-backed implementation of PriceBookCostPort."""

    def __init__(self, session):
        """Initialize with database session.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    def lookup(
        self,
        vendor_id: str,
        item_id: str,
        date: str | None = None
    ) -> PriceBookCostDTO | None:
        """Look up price book cost from fixture table.

        Args:
            vendor_id: Vendor identifier
            item_id: Item identifier
            date: Optional delivery date for effective date filtering

        Returns:
            PriceBookCostDTO if found, None otherwise
        """
        from ...db.models import PriceBookCostFixture

        query = self.session.query(PriceBookCostFixture).filter(
            PriceBookCostFixture.vendor_id == vendor_id,
            PriceBookCostFixture.item_id == item_id
        )

        # For MVP, simple lookup without strict effective date filtering
        # In production, would filter by effective_start <= date <= effective_end
        if date:
            # Basic temporal filtering if dates are present
            query = query.filter(
                (PriceBookCostFixture.effective_start.is_(None)) |
                (PriceBookCostFixture.effective_start <= date)
            ).filter(
                (PriceBookCostFixture.effective_end.is_(None)) |
                (PriceBookCostFixture.effective_end >= date)
            )

        record = query.first()

        if not record:
            return None

        return PriceBookCostDTO(
            id=record.id,
            vendor_id=record.vendor_id,
            item_id=record.item_id,
            expected_unit_cost=record.expected_unit_cost,
            effective_start=record.effective_start,
            effective_end=record.effective_end,
            source_system=record.source_system
        )
