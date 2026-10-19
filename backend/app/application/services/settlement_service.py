"""Settlement service orchestrating AGN5 settlement preparation and AP handoff."""
import json
import uuid
from datetime import datetime


class SettlementService:
    """Orchestrates settlement preparation and AP queue submission (AGN5)."""

    def __init__(
        self,
        session,
        apqueue_adapter,
        apqueue_ack_adapter,
        chargeback_adapter,
        sod_policy,
        reason_code_policy
    ):
        """Initialize with dependencies.

        Args:
            session: SQLAlchemy session
            apqueue_adapter: TOL6 adapter for AP queue submission
            apqueue_ack_adapter: TOL8 adapter for AP acknowledgment
            chargeback_adapter: TOL7 adapter for chargeback generation
            sod_policy: Segregation of duties policy
            reason_code_policy: Reason code validation policy
        """
        self.session = session
        self.apqueue_adapter = apqueue_adapter
        self.apqueue_ack_adapter = apqueue_ack_adapter
        self.chargeback_adapter = chargeback_adapter
        self.sod_policy = sod_policy
        self.reason_code_policy = reason_code_policy

    def prepare_settlement(
        self,
        case_id: str,
        prepared_by_user_id: str,
        generate_chargeback_support: bool = False
    ) -> dict:
        """Prepare settlement and submit to AP queue.

        Args:
            case_id: Exception case identifier
            prepared_by_user_id: User preparing settlement (AP Specialist)
            generate_chargeback_support: Whether to generate chargeback document

        Returns:
            Dictionary with settlement and queue details
        """
        from ...db.models import (
            ExceptionCase,
            MatchResult,
            ReviewDecision,
            SettlementRecord,
            StatementLine,
        )

        # Get case and verify settlement eligibility
        case = self.session.query(ExceptionCase).filter(
            ExceptionCase.id == case_id
        ).first()

        if not case:
            raise ValueError(f"Case not found: {case_id}")

        if case.case_status not in ("APPROVED", "OVERRIDDEN"):
            raise ValueError(f"Case not settlement-eligible: {case.case_status}")

        # Get latest review decision to check SoD
        latest_decision = self.session.query(ReviewDecision).filter(
            ReviewDecision.case_id == case_id
        ).order_by(ReviewDecision.decided_at.desc()).first()

        if latest_decision:
            sod_check = self.sod_policy.check_settlement_preparation(
                prepared_by_user_id=prepared_by_user_id,
                approving_reviewer_user_id=latest_decision.reviewer_user_id
            )

            if sod_check.violated:
                # Log SoD violation (would create audit event here)
                raise PermissionError(f"SoD violation: {sod_check.reason}")

        # Get match result and statement line for payload
        match_result = self.session.query(MatchResult).filter(
            MatchResult.id == case.match_result_id
        ).first()

        statement_line = self.session.query(StatementLine).filter(
            StatementLine.id == match_result.statement_line_id
        ).first()

        # Create settlement record
        settlement_id = str(uuid.uuid4())
        settlement = SettlementRecord(
            id=settlement_id,
            case_id=case_id,
            match_result_id=match_result.id,
            source_type="APPROVED_EXCEPTION",
            resolution_basis=json.dumps({
                "outcome_class": match_result.outcome_class,
                "decision_type": latest_decision.decision_type if latest_decision else "AUTO",
                "reason_code": latest_decision.reason_code if latest_decision else None
            }),
            prepared_by_user_id=prepared_by_user_id,
            eligibility_status="ELIGIBLE",
            prepared_at=datetime.utcnow().isoformat()
        )

        self.session.add(settlement)
        self.session.flush()

        # Build AP queue payload
        payload = {
            "settlement_id": settlement_id,
            "case_id": case_id,
            "vendor_id": statement_line.vendor_id,
            "store_id": statement_line.store_id,
            "item_id": statement_line.item_id,
            "statement_qty": statement_line.statement_qty,
            "statement_unit_cost": statement_line.statement_unit_cost,
            "invoice_ref": statement_line.invoice_ref,
            "delivery_ref": statement_line.delivery_ref,
            "outcome_class": match_result.outcome_class
        }

        # Submit to AP queue via TOL6
        queue_result = self.apqueue_adapter.submit(
            settlement_record_id=settlement_id,
            payload=payload
        )

        if not queue_result.success:
            settlement.eligibility_status = "BLOCKED"
            self.session.commit()
            raise RuntimeError(f"AP queue submission failed: {queue_result.message}")

        # Get acknowledgment via TOL8
        ack_result = self.apqueue_ack_adapter.ack(queue_result.queue_entry_id)

        # Update case status
        case.case_status = "QUEUED"
        case.updated_at = datetime.utcnow().isoformat()

        # Generate chargeback document if requested
        chargeback_document_id = None
        if generate_chargeback_support and latest_decision:
            chargeback_document_id = self._generate_chargeback(
                case_id=case_id,
                reason_code=latest_decision.reason_code,
                match_result=match_result
            )

        self.session.commit()

        return {
            "settlement_record_id": settlement_id,
            "queue_entry_id": queue_result.queue_entry_id,
            "queue_status": queue_result.queue_status,
            "ack_status": ack_result.ack_status,
            "chargeback_document_id": chargeback_document_id
        }

    def _generate_chargeback(
        self,
        case_id: str,
        reason_code: str | None,
        match_result
    ) -> str | None:
        """Generate chargeback document if reason code and evidence valid.

        Args:
            case_id: Exception case identifier
            reason_code: Reason code from review decision
            match_result: MatchResult model instance

        Returns:
            Chargeback document ID or None if validation fails
        """
        # Build evidence bundle
        evidence_bundle = []
        if match_result.receiving_record_id:
            evidence_bundle.append(f"EV-RCV-{match_result.receiving_record_id}")
        if match_result.price_book_cost_id:
            evidence_bundle.append(f"EV-COST-{match_result.price_book_cost_id}")

        # Validate reason code and evidence
        validation = self.reason_code_policy.validate_for_chargeback_generation(
            reason_code=reason_code,
            evidence_bundle=evidence_bundle if evidence_bundle else None
        )

        if not validation.is_valid:
            # Log validation failure but don't block settlement
            return None

        # Determine document type based on reason code
        document_type = "CHARGEBACK" if reason_code and reason_code.startswith("PC") else "CREDIT_REQUEST"

        # Generate via TOL7
        result = self.chargeback_adapter.generate(
            case_id=case_id,
            document_type=document_type,
            reason_code=reason_code,
            evidence_bundle=evidence_bundle
        )

        return result.document_id if result.success else None
