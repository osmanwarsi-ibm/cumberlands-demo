"""TOL2: Receiving Records Port (BOS/PDI mock).

Queries fixture receiving records by vendor/store/item/doc refs.
"""
from typing import NamedTuple, Protocol


class ReceivingRecordDTO(NamedTuple):
    """Receiving record data transfer object."""
    id: str
    vendor_id: str
    store_id: str
    item_id: str
    delivery_ref: str | None
    received_qty: float
    receipt_date: str | None
    source_system: str


class ReceivingRecordsPort(Protocol):
    """Port interface for TOL2: Receiving records retrieval."""

    def lookup(
        self,
        vendor_id: str,
        store_id: str,
        item_id: str,
        delivery_ref: str | None = None
    ) -> ReceivingRecordDTO | None:
        """Look up receiving record by vendor/store/item/delivery.

        Args:
            vendor_id: Vendor identifier
            store_id: Store identifier
            item_id: Item identifier
            delivery_ref: Optional delivery reference for matching

        Returns:
            ReceivingRecordDTO if found, None otherwise
        """
        ...


class FixtureReceivingRecordsAdapter:
    """Fixture-backed implementation of ReceivingRecordsPort."""

    def __init__(self, session):
        """Initialize with database session.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    def lookup(
        self,
        vendor_id: str,
        store_id: str,
        item_id: str,
        delivery_ref: str | None = None
    ) -> ReceivingRecordDTO | None:
        """Look up receiving record from fixture table.

        Args:
            vendor_id: Vendor identifier
            store_id: Store identifier
            item_id: Item identifier
            delivery_ref: Optional delivery reference for matching

        Returns:
            ReceivingRecordDTO if found, None otherwise
        """
        from ...db.models import ReceivingRecordFixture

        query = self.session.query(ReceivingRecordFixture).filter(
            ReceivingRecordFixture.vendor_id == vendor_id,
            ReceivingRecordFixture.store_id == store_id,
            ReceivingRecordFixture.item_id == item_id
        )

        if delivery_ref:
            query = query.filter(ReceivingRecordFixture.delivery_ref == delivery_ref)

        record = query.first()

        if not record:
            return None

        return ReceivingRecordDTO(
            id=record.id,
            vendor_id=record.vendor_id,
            store_id=record.store_id,
            item_id=record.item_id,
            delivery_ref=record.delivery_ref,
            received_qty=record.received_qty,
            receipt_date=record.receipt_date,
            source_system=record.source_system
        )
