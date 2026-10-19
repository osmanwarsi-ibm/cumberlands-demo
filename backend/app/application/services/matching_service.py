"""Matching service orchestrating AGN2 deterministic three-way matching."""
import json
import uuid
from datetime import datetime


class MatchingService:
    """Orchestrates deterministic three-way matching (AGN2)."""

    def __init__(
        self,
        session,
        receiving_adapter,
        pricebook_adapter,
        quantity_tolerance_policy,
        cost_tolerance_policy,
        classification_policy
    ):
        """Initialize with dependencies.

        Args:
            session: SQLAlchemy session
            receiving_adapter: TOL2 adapter for receiving records
            pricebook_adapter: TOL3 adapter for price book costs
            quantity_tolerance_policy: Quantity tolerance policy
            cost_tolerance_policy: Cost tolerance policy
            classification_policy: Five-outcome classification policy
        """
        self.session = session
        self.receiving_adapter = receiving_adapter
        self.pricebook_adapter = pricebook_adapter
        self.quantity_tolerance = quantity_tolerance_policy
        self.cost_tolerance = cost_tolerance_policy
        self.classification = classification_policy

    def run_matching(self, batch_id: str) -> dict:
        """Execute deterministic matching for all lines in batch.

        Args:
            batch_id: Batch identifier

        Returns:
            Dictionary with outcome counts
        """
        from ...db.models import StatementLine

        # Fetch all normalized lines for batch
        lines = self.session.query(StatementLine).filter(
            StatementLine.batch_id == batch_id,
            StatementLine.status == "NORMALIZED"
        ).all()

        outcome_counts = {
            "full_matches": 0,
            "cost_exceptions": 0,
            "quantity_exceptions": 0,
            "unmatched_statements": 0,
            "unmatched_receipts": 0,
            "manual_route_count": 0
        }

        for line in lines:
            match_result = self._match_line(line)

            # Count outcomes
            if match_result.outcome_class == "FULL_MATCH":
                outcome_counts["full_matches"] += 1
            elif match_result.outcome_class == "COST_EXCEPTION":
                outcome_counts["cost_exceptions"] += 1
            elif match_result.outcome_class == "QUANTITY_EXCEPTION":
                outcome_counts["quantity_exceptions"] += 1
            elif match_result.outcome_class == "UNMATCHED_STATEMENT":
                outcome_counts["unmatched_statements"] += 1
            elif match_result.outcome_class == "UNMATCHED_RECEIPT":
                outcome_counts["unmatched_receipts"] += 1

        self.session.commit()

        return {
            "batch_id": batch_id,
            **outcome_counts
        }

    def _match_line(self, line):
        """Match a single statement line.

        Args:
            line: StatementLine model instance

        Returns:
            MatchResult model instance
        """
        from ...db.models import MatchResult

        # Fetch receiving record via TOL2
        receiving_record = self.receiving_adapter.lookup(
            vendor_id=line.vendor_id,
            store_id=line.store_id,
            item_id=line.item_id,
            delivery_ref=line.delivery_ref
        )

        # Fetch price book cost via TOL3
        price_book_cost = self.pricebook_adapter.lookup(
            vendor_id=line.vendor_id,
            item_id=line.item_id,
            date=line.delivery_date
        )

        has_receiving = receiving_record is not None
        has_pricebook = price_book_cost is not None

        # Evaluate tolerances
        quantity_exception = False
        quantity_variance = None
        quantity_variance_pct = None

        if has_receiving:
            qty_result = self.quantity_tolerance.evaluate(
                statement_qty=line.statement_qty,
                received_qty=receiving_record.received_qty
            )
            quantity_exception = qty_result.is_exception
            quantity_variance = qty_result.absolute_variance
            quantity_variance_pct = qty_result.relative_variance_pct

        cost_exception = False
        cost_variance = None

        if has_pricebook:
            cost_result = self.cost_tolerance.evaluate(
                statement_unit_cost=line.statement_unit_cost,
                expected_unit_cost=price_book_cost.expected_unit_cost
            )
            cost_exception = cost_result.is_exception
            cost_variance = cost_result.unit_cost_variance

        # Classify outcome
        classification_result = self.classification.classify(
            has_receiving_record=has_receiving,
            has_price_book_cost=has_pricebook,
            quantity_exception=quantity_exception,
            cost_exception=cost_exception
        )

        # Create match result
        match_id = str(uuid.uuid4())
        match_result = MatchResult(
            id=match_id,
            statement_line_id=line.id,
            receiving_record_id=receiving_record.id if receiving_record else None,
            price_book_cost_id=price_book_cost.id if price_book_cost else None,
            quantity_variance=quantity_variance,
            quantity_variance_pct=quantity_variance_pct,
            cost_variance=cost_variance,
            outcome_class=classification_result.outcome_class.value,
            rule_basis_json=json.dumps({
                "reason": classification_result.reason,
                "rules_applied": classification_result.rules_applied
            }),
            matched_at=datetime.utcnow().isoformat()
        )

        self.session.add(match_result)
        self.session.flush()

        # Create exception case for non-full-match outcomes
        if classification_result.outcome_class.value != "FULL_MATCH":
            self._create_exception_case(match_result, classification_result)

        return match_result

    def _create_exception_case(self, match_result, classification_result):
        """Create exception case for reviewable outcome.

        Args:
            match_result: MatchResult model instance
            classification_result: ClassificationResult from policy
        """
        from ...db.models import ExceptionCase

        case_id = str(uuid.uuid4())

        # Determine queue type and owner role
        outcome = classification_result.outcome_class.value
        if outcome == "COST_EXCEPTION":
            queue_type = "cost_review"
            owner_role = "PRICE_BOOK_ANALYST"
        elif outcome in ("QUANTITY_EXCEPTION", "UNMATCHED_STATEMENT"):
            queue_type = "quantity_review"
            owner_role = "INVENTORY_CONTROL_ANALYST"
        else:
            queue_type = "ap_review"
            owner_role = "AP_SPECIALIST"

        case = ExceptionCase(
            id=case_id,
            match_result_id=match_result.id,
            case_type=outcome,
            queue_type=queue_type,
            case_status="OPEN",
            missing_context_count=0,  # Will be updated by triage service
            missing_context_list_json="[]",
            current_owner_role=owner_role,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat()
        )

        self.session.add(case)
