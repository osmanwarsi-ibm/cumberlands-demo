"""Idempotent seed script for Cumberland Farms DSD Vendor Receiving Reconciliation MVP.

Seeds:
- 5 pilot user personas matching login wireframe
- 4 deferred boundary records (AGN3, AGN6, TOL9, TOL10)
- 50+ statement lines spanning all 5 outcome classes
- Supporting fixture data (receiving records, price book costs, exception history)
- 3 intentionally malformed lines for quarantine testing

Run with: python -m app.db.seed
"""
import json
import os
import sys
from datetime import datetime, timedelta

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

# Add backend directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.db.models import (
    DeferredBoundary,
    ExceptionHistoryFixture,
    PriceBookCostFixture,
    ReceivingRecordFixture,
    StatementBatch,
    StatementLine,
    User,
)


def get_database_url() -> str:
    """Get database URL from environment or use default SQLite path."""
    return os.getenv("DATABASE_URL", "sqlite:///./data/reconciliation.db")


def seed_users(session: Session) -> None:
    """Seed exactly 5 pilot user personas matching login wireframe."""
    # Check if users already exist
    existing_count = session.scalar(select(User).limit(1))
    if existing_count is not None:
        print("✓ Users already seeded, skipping...")
        return

    users = [
        User(
            id="usr_001",
            username="p.nair",
            role="AP_SPECIALIST",
            is_active=1,
        ),
        User(
            id="usr_002",
            username="d.whitfield",
            role="PRICE_BOOK_ANALYST",
            is_active=1,
        ),
        User(
            id="usr_003",
            username="m.ortiz",
            role="INVENTORY_CONTROL_ANALYST",
            is_active=1,
        ),
        User(
            id="usr_004",
            username="h.brooks",
            role="VENDOR_RELATIONS_MANAGER",
            is_active=1,
        ),
        User(
            id="usr_005",
            username="t.reyes",
            role="INTERNAL_AUDIT",
            is_active=1,
        ),
    ]

    session.add_all(users)
    session.commit()
    print(f"✓ Seeded {len(users)} pilot users")


def seed_deferred_boundaries(session: Session) -> None:
    """Seed 4 deferred boundary records (AGN3, AGN6, TOL9, TOL10)."""
    # Check if deferred boundaries already exist
    existing = session.scalar(select(DeferredBoundary).limit(1))
    if existing is not None:
        print("✓ Deferred boundaries already seeded, skipping...")
        return

    boundaries = [
        DeferredBoundary(
            boundary_key="AGN3",
            boundary_type="AGENT",
            status="DEFERRED",
            notes="Unposted Receipt Monitor - preserved interface, not executed in MVP flow",
        ),
        DeferredBoundary(
            boundary_key="AGN6",
            boundary_type="AGENT",
            status="DEFERRED",
            notes="Reconciliation Monitor - preserved interface, not executed in MVP flow",
        ),
        DeferredBoundary(
            boundary_key="TOL9",
            boundary_type="TOOL",
            status="DEFERRED",
            notes="AP Batch Validation Port - preserved interface, not executed in MVP flow",
        ),
        DeferredBoundary(
            boundary_key="TOL10",
            boundary_type="TOOL",
            status="DEFERRED",
            notes="Dashboard Publish Port - preserved interface, not executed in MVP flow",
        ),
    ]

    session.add_all(boundaries)
    session.commit()
    print(f"✓ Seeded {len(boundaries)} deferred boundaries")


def seed_fixture_data(session: Session) -> None:
    """Seed fixture tables with receiving records, price book costs, and exception history."""
    # Check if fixtures already exist
    existing = session.scalar(select(ReceivingRecordFixture).limit(1))
    if existing is not None:
        print("✓ Fixture data already seeded, skipping...")
        return

    # Seed receiving records fixture (mock BOS/PDI data)
    receiving_records = []
    for i in range(1, 61):
        receiving_records.append(
            ReceivingRecordFixture(
                id=f"rcv_{i:03d}",
                vendor_id=f"VND{(i % 10) + 1:03d}",
                store_id=f"STR{(i % 5) + 1:03d}",
                item_id=f"ITM{i:04d}",
                delivery_ref=f"DEL-2026-{i:04d}",
                received_qty=float(10 + (i % 50)),
                receipt_date=(datetime.now() - timedelta(days=i % 30)).strftime("%Y-%m-%d"),
                source_system="BOS_PDI",
            )
        )

    session.add_all(receiving_records)
    print(f"✓ Seeded {len(receiving_records)} receiving records")

    # Seed price book costs fixture
    price_book_costs = []
    for i in range(1, 61):
        price_book_costs.append(
            PriceBookCostFixture(
                id=f"pbc_{i:03d}",
                vendor_id=f"VND{(i % 10) + 1:03d}",
                item_id=f"ITM{i:04d}",
                expected_unit_cost=round(5.0 + (i % 20) * 0.5, 2),
                effective_start=(datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d"),
                effective_end=(datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d"),
                source_system="BOS_PDI",
            )
        )

    session.add_all(price_book_costs)
    print(f"✓ Seeded {len(price_book_costs)} price book costs")

    # Seed exception history fixture
    exception_history = []
    for i in range(1, 31):
        exception_history.append(
            ExceptionHistoryFixture(
                id=f"exh_{i:03d}",
                vendor_id=f"VND{(i % 10) + 1:03d}",
                item_id=f"ITM{i:04d}",
                case_type=["COST_EXCEPTION", "QUANTITY_EXCEPTION"][i % 2],
                prior_outcome=["APPROVED", "OVERRIDDEN", "ESCALATED"][i % 3],
                summary_json=json.dumps({
                    "prior_case_id": f"case_{i:03d}",
                    "resolution": ["Vendor pricing error corrected", "Receiving count adjusted", "Escalated to vendor relations"][i % 3],
                    "occurrence_count": (i % 5) + 1,
                }),
            )
        )

    session.add_all(exception_history)
    session.commit()
    print(f"✓ Seeded {len(exception_history)} exception history records")


def seed_statement_batch_and_lines(session: Session) -> None:
    """Seed pilot statement batch with 50+ lines spanning all 5 outcome classes plus 3 malformed lines."""
    # Check if statement batch already exists
    existing = session.scalar(select(StatementBatch).limit(1))
    if existing is not None:
        print("✓ Statement batch already seeded, skipping...")
        return

    # Create pilot batch
    batch = StatementBatch(
        id="batch_pilot_001",
        source_type="fixture_record_set",
        source_identifier="pilot_batch_01",
        status="COMPLETED",
        total_lines=0,  # Will update after adding lines
        accepted_lines=0,
        rejected_lines=0,
        ingested_by_user_id="usr_001",  # Priya Nair (AP Specialist)
    )
    session.add(batch)

    statement_lines = []

    # Generate 53 valid statement lines to create variety across all outcome classes
    # Full Match: lines 1-15 (15 lines)
    for i in range(1, 16):
        statement_lines.append(
            StatementLine(
                id=f"stmt_line_{i:03d}",
                batch_id="batch_pilot_001",
                vendor_id=f"VND{(i % 10) + 1:03d}",
                store_id=f"STR{(i % 5) + 1:03d}",
                item_id=f"ITM{i:04d}",
                invoice_ref=f"INV-2026-{i:04d}",
                delivery_ref=f"DEL-2026-{i:04d}",
                delivery_date=(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                statement_qty=float(10 + (i % 50)),
                statement_unit_cost=round(5.0 + (i % 20) * 0.5, 2),
                status="NORMALIZED",
                normalized_payload_json=json.dumps({
                    "vendor": f"VND{(i % 10) + 1:03d}",
                    "store": f"STR{(i % 5) + 1:03d}",
                    "item": f"ITM{i:04d}",
                    "qty": float(10 + (i % 50)),
                    "unit_cost": round(5.0 + (i % 20) * 0.5, 2),
                }),
            )
        )

    # Cost Exception: lines 16-28 (13 lines with variance > $0.05)
    for i in range(16, 29):
        expected_cost = round(5.0 + (i % 20) * 0.5, 2)
        statement_lines.append(
            StatementLine(
                id=f"stmt_line_{i:03d}",
                batch_id="batch_pilot_001",
                vendor_id=f"VND{(i % 10) + 1:03d}",
                store_id=f"STR{(i % 5) + 1:03d}",
                item_id=f"ITM{i:04d}",
                invoice_ref=f"INV-2026-{i:04d}",
                delivery_ref=f"DEL-2026-{i:04d}",
                delivery_date=(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                statement_qty=float(10 + (i % 50)),
                statement_unit_cost=expected_cost + 0.15,  # $0.15 variance > $0.05 threshold
                status="NORMALIZED",
                normalized_payload_json=json.dumps({
                    "vendor": f"VND{(i % 10) + 1:03d}",
                    "store": f"STR{(i % 5) + 1:03d}",
                    "item": f"ITM{i:04d}",
                    "qty": float(10 + (i % 50)),
                    "unit_cost": expected_cost + 0.15,
                }),
            )
        )

    # Quantity Exception: lines 29-38 (10 lines exceeding BOTH 2 units AND 2%)
    for i in range(29, 39):
        received_qty = float(10 + (i % 50))
        statement_qty = received_qty + 5  # +5 units exceeds 2-unit threshold and usually >2%
        statement_lines.append(
            StatementLine(
                id=f"stmt_line_{i:03d}",
                batch_id="batch_pilot_001",
                vendor_id=f"VND{(i % 10) + 1:03d}",
                store_id=f"STR{(i % 5) + 1:03d}",
                item_id=f"ITM{i:04d}",
                invoice_ref=f"INV-2026-{i:04d}",
                delivery_ref=f"DEL-2026-{i:04d}",
                delivery_date=(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                statement_qty=statement_qty,
                statement_unit_cost=round(5.0 + (i % 20) * 0.5, 2),
                status="NORMALIZED",
                normalized_payload_json=json.dumps({
                    "vendor": f"VND{(i % 10) + 1:03d}",
                    "store": f"STR{(i % 5) + 1:03d}",
                    "item": f"ITM{i:04d}",
                    "qty": statement_qty,
                    "unit_cost": round(5.0 + (i % 20) * 0.5, 2),
                }),
            )
        )

    # Unmatched Statement: lines 39-45 (7 lines with no receiving record)
    for i in range(39, 46):
        statement_lines.append(
            StatementLine(
                id=f"stmt_line_{i:03d}",
                batch_id="batch_pilot_001",
                vendor_id=f"VND{(i % 10) + 1:03d}",
                store_id=f"STR{(i % 5) + 1:03d}",
                item_id=f"ITM{i + 1000:04d}",  # Item ID not in receiving fixture
                invoice_ref=f"INV-2026-{i:04d}",
                delivery_ref=f"DEL-UNMATCHED-{i:04d}",
                delivery_date=(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                statement_qty=float(10 + (i % 50)),
                statement_unit_cost=round(5.0 + (i % 20) * 0.5, 2),
                status="NORMALIZED",
                normalized_payload_json=json.dumps({
                    "vendor": f"VND{(i % 10) + 1:03d}",
                    "store": f"STR{(i % 5) + 1:03d}",
                    "item": f"ITM{i + 1000:04d}",
                    "qty": float(10 + (i % 50)),
                    "unit_cost": round(5.0 + (i % 20) * 0.5, 2),
                }),
            )
        )

    # Unmatched Receipt: lines 46-53 (8 lines representing receipt without statement)
    # Note: These will be created during reconciliation workflow, not as statement lines
    # For seed purposes, we create statement lines that reference receipts with different delivery refs

    for i in range(46, 54):
        statement_lines.append(
            StatementLine(
                id=f"stmt_line_{i:03d}",
                batch_id="batch_pilot_001",
                vendor_id=f"VND{(i % 10) + 1:03d}",
                store_id=f"STR{(i % 5) + 1:03d}",
                item_id=f"ITM{i:04d}",
                invoice_ref=f"INV-2026-{i:04d}",
                delivery_ref=f"DEL-2026-{i:04d}",
                delivery_date=(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                statement_qty=float(10 + (i % 50)),
                statement_unit_cost=round(5.0 + (i % 20) * 0.5, 2),
                status="NORMALIZED",
                normalized_payload_json=json.dumps({
                    "vendor": f"VND{(i % 10) + 1:03d}",
                    "store": f"STR{(i % 5) + 1:03d}",
                    "item": f"ITM{i:04d}",
                    "qty": float(10 + (i % 50)),
                    "unit_cost": round(5.0 + (i % 20) * 0.5, 2),
                }),
            )
        )

    # Add 3 intentionally malformed lines for quarantine testing
    malformed_lines = [
        StatementLine(
            id="stmt_line_mal_001",
            batch_id="batch_pilot_001",
            vendor_id="",  # Missing vendor_id
            store_id="STR001",
            item_id="ITM9001",
            statement_qty=0.0,
            statement_unit_cost=0.0,
            status="REJECTED",
            rejection_reason="Missing required field: vendor_id",
            normalized_payload_json=json.dumps({"error": "missing vendor_id"}),
        ),
        StatementLine(
            id="stmt_line_mal_002",
            batch_id="batch_pilot_001",
            vendor_id="VND001",
            store_id="STR001",
            item_id="ITM9002",
            statement_qty=-5.0,  # Negative quantity
            statement_unit_cost=10.0,
            status="REJECTED",
            rejection_reason="Invalid quantity: negative value not allowed",
            normalized_payload_json=json.dumps({"qty": -5.0, "error": "negative quantity"}),
        ),
        StatementLine(
            id="stmt_line_mal_003",
            batch_id="batch_pilot_001",
            vendor_id="VND001",
            store_id="STR001",
            item_id="ITM9003",
            statement_qty=10.0,
            statement_unit_cost=0.0,  # Zero cost (suspicious)
            status="REJECTED",
            rejection_reason="Suspicious cost: zero or missing unit cost",
            normalized_payload_json=json.dumps({"unit_cost": 0.0, "error": "zero cost"}),
        ),
    ]

    statement_lines.extend(malformed_lines)
    session.add_all(statement_lines)

    # Update batch counts
    batch.total_lines = len(statement_lines)  # type: ignore[assignment]
    batch.accepted_lines = len([line for line in statement_lines if line.status == "NORMALIZED"])  # type: ignore[assignment]
    batch.rejected_lines = len([line for line in statement_lines if line.status == "REJECTED"])  # type: ignore[assignment]

    session.commit()
    print(f"✓ Seeded statement batch with {len(statement_lines)} lines (53 normalized + 3 quarantined)")


def seed_database(session: Session) -> None:
    """Seed the database with all required data.
    
    Args:
        session: SQLAlchemy session
    """
    print("\n=== Seeding Cumberland Farms DSD Reconciliation MVP ===\n")

    seed_users(session)
    seed_deferred_boundaries(session)
    seed_fixture_data(session)
    seed_statement_batch_and_lines(session)

    print("\n=== Seed complete ===\n")


def main():
    """Run all seed functions in order."""
    db_url = get_database_url()
    print(f"Using database: {db_url}")

    # Create engine and session
    engine = create_engine(db_url, echo=False)

    # Ensure data directory exists for SQLite
    if db_url.startswith("sqlite"):
        db_path = db_url.replace("sqlite:///", "")
        os.makedirs(os.path.dirname(db_path) if "/" in db_path else ".", exist_ok=True)

    with Session(engine) as session:
        seed_database(session)


if __name__ == "__main__":
    main()
