"""Unit tests for domain policies."""
import pytest
from app.domain.policies.quantity_tolerance import QuantityTolerancePolicy
from app.domain.policies.cost_tolerance import CostTolerancePolicy
from app.domain.policies.classification import ClassificationPolicy, OutcomeClass
from app.domain.policies.confidence import ConfidencePolicy, ConfidenceBand
from app.domain.policies.sod import SoDPolicy
from app.domain.policies.reason_code import ReasonCodePolicy


class TestQuantityTolerancePolicy:
    """Tests for VR-003: Quantity tolerance policy."""
    
    def test_within_tolerance_both_thresholds(self):
        """Test variance within both absolute and relative thresholds."""
        result = QuantityTolerancePolicy.evaluate(
            statement_qty=100.0,
            received_qty=101.0
        )
        assert not result.is_exception
        assert result.absolute_variance == -1.0
        assert abs(result.relative_variance_pct) < 0.02
    
    def test_exceeds_absolute_only(self):
        """Test variance exceeds absolute but not relative threshold."""
        result = QuantityTolerancePolicy.evaluate(
            statement_qty=1000.0,
            received_qty=1003.0  # 3 units, 0.3%
        )
        assert not result.is_exception  # Must exceed BOTH thresholds
    
    def test_exceeds_relative_only(self):
        """Test variance exceeds relative but not absolute threshold."""
        result = QuantityTolerancePolicy.evaluate(
            statement_qty=50.0,
            received_qty=51.5  # 1.5 units, 3%
        )
        assert not result.is_exception  # Must exceed BOTH thresholds
    
    def test_exceeds_both_thresholds(self):
        """Test variance exceeds both absolute and relative thresholds."""
        result = QuantityTolerancePolicy.evaluate(
            statement_qty=100.0,
            received_qty=105.0  # 5 units, 5%
        )
        assert result.is_exception
        assert abs(result.absolute_variance) > 2.0
        assert result.relative_variance_pct > 0.02
    
    def test_zero_statement_qty(self):
        """Test handling of zero statement quantity."""
        result = QuantityTolerancePolicy.evaluate(
            statement_qty=0.0,
            received_qty=5.0
        )
        assert result.is_exception  # abs(variance) > 2
        assert result.absolute_variance == -5.0


class TestCostTolerancePolicy:
    """Tests for VR-004: Cost tolerance policy."""
    
    def test_within_tolerance(self):
        """Test cost variance within $0.05 threshold."""
        result = CostTolerancePolicy.evaluate(
            statement_unit_cost=10.00,
            expected_unit_cost=10.04
        )
        assert not result.is_exception
        assert abs(result.unit_cost_variance) <= 0.05
    
    def test_exceeds_tolerance_positive(self):
        """Test cost variance exceeds threshold (positive)."""
        result = CostTolerancePolicy.evaluate(
            statement_unit_cost=10.10,
            expected_unit_cost=10.00
        )
        assert result.is_exception
        assert abs(result.unit_cost_variance - 0.10) < 0.001
    
    def test_exceeds_tolerance_negative(self):
        """Test cost variance exceeds threshold (negative)."""
        result = CostTolerancePolicy.evaluate(
            statement_unit_cost=9.90,
            expected_unit_cost=10.00
        )
        assert result.is_exception
        assert abs(result.unit_cost_variance - (-0.10)) < 0.001
    
    def test_exact_threshold(self):
        """Test cost variance exactly at threshold."""
        result = CostTolerancePolicy.evaluate(
            statement_unit_cost=10.06,
            expected_unit_cost=10.00
        )
        assert result.is_exception  # 0.06 > 0.05


class TestClassificationPolicy:
    """Tests for VR-005: Five-outcome classification."""
    
    def test_full_match(self):
        """Test full match classification."""
        result = ClassificationPolicy.classify(
            has_receiving_record=True,
            has_price_book_cost=True,
            quantity_exception=False,
            cost_exception=False
        )
        assert result.outcome_class == OutcomeClass.FULL_MATCH
    
    def test_cost_exception(self):
        """Test cost exception classification."""
        result = ClassificationPolicy.classify(
            has_receiving_record=True,
            has_price_book_cost=True,
            quantity_exception=False,
            cost_exception=True
        )
        assert result.outcome_class == OutcomeClass.COST_EXCEPTION
    
    def test_quantity_exception(self):
        """Test quantity exception classification."""
        result = ClassificationPolicy.classify(
            has_receiving_record=True,
            has_price_book_cost=True,
            quantity_exception=True,
            cost_exception=False
        )
        assert result.outcome_class == OutcomeClass.QUANTITY_EXCEPTION
    
    def test_quantity_takes_precedence(self):
        """Test quantity exception takes precedence over cost when both present."""
        result = ClassificationPolicy.classify(
            has_receiving_record=True,
            has_price_book_cost=True,
            quantity_exception=True,
            cost_exception=True
        )
        assert result.outcome_class == OutcomeClass.QUANTITY_EXCEPTION
    
    def test_unmatched_statement(self):
        """Test unmatched statement classification."""
        result = ClassificationPolicy.classify(
            has_receiving_record=False,
            has_price_book_cost=True,
            quantity_exception=False,
            cost_exception=False
        )
        assert result.outcome_class == OutcomeClass.UNMATCHED_STATEMENT
    
    def test_missing_cost_as_cost_exception(self):
        """Test missing cost treated as cost exception."""
        result = ClassificationPolicy.classify(
            has_receiving_record=True,
            has_price_book_cost=False,
            quantity_exception=False,
            cost_exception=False
        )
        assert result.outcome_class == OutcomeClass.COST_EXCEPTION


class TestConfidencePolicy:
    """Tests for VR-008/VR-009: Confidence model."""
    
    def test_all_context_present(self):
        """Test confidence with all context elements present."""
        result = ConfidencePolicy.evaluate(
            has_statement_line=True,
            has_receiving_record=True,
            has_expected_cost=True,
            has_prior_history=True,
            has_document_refs=True,
            has_effective_date_alignment=True
        )
        assert result.confidence_score == 1.0
        assert result.confidence_band == ConfidenceBand.GREEN
        assert len(result.penalties) == 0
        assert not result.manual_routing_required
    
    def test_missing_receiving_penalty(self):
        """Test penalty for missing receiving record."""
        result = ConfidencePolicy.evaluate(
            has_statement_line=True,
            has_receiving_record=False,
            has_expected_cost=True,
            has_prior_history=True,
            has_document_refs=True,
            has_effective_date_alignment=True
        )
        assert result.confidence_score == 0.75  # 1.0 - 0.25
        assert result.confidence_band == ConfidenceBand.AMBER
        assert len(result.penalties) == 1
        assert result.penalties[0].element == "receiving_record"
    
    def test_amber_band(self):
        """Test AMBER confidence band."""
        result = ConfidencePolicy.evaluate(
            has_statement_line=True,
            has_receiving_record=True,
            has_expected_cost=False,  # -0.20
            has_prior_history=True,
            has_document_refs=False,  # -0.10
            has_effective_date_alignment=True
        )
        assert abs(result.confidence_score - 0.70) < 0.001  # 1.0 - 0.30
        assert result.confidence_band == ConfidenceBand.AMBER
    
    def test_red_band(self):
        """Test RED confidence band."""
        result = ConfidencePolicy.evaluate(
            has_statement_line=True,
            has_receiving_record=False,  # -0.25
            has_expected_cost=False,  # -0.20
            has_prior_history=True,
            has_document_refs=True,
            has_effective_date_alignment=True
        )
        assert result.confidence_score == 0.55  # 1.0 - 0.45
        assert result.confidence_band == ConfidenceBand.RED
    
    def test_manual_routing_threshold(self):
        """Test manual routing when missing_context_count > 2 (VR-009)."""
        result = ConfidencePolicy.evaluate(
            has_statement_line=True,
            has_receiving_record=False,
            has_expected_cost=False,
            has_prior_history=False,
            has_document_refs=True,
            has_effective_date_alignment=True
        )
        assert len(result.missing_context_elements) == 3
        assert result.manual_routing_required
        assert result.confidence_band == ConfidenceBand.NONE
    
    def test_exactly_two_missing_no_manual_routing(self):
        """Test no manual routing when exactly 2 elements missing."""
        result = ConfidencePolicy.evaluate(
            has_statement_line=True,
            has_receiving_record=False,
            has_expected_cost=False,
            has_prior_history=True,
            has_document_refs=True,
            has_effective_date_alignment=True
        )
        assert len(result.missing_context_elements) == 2
        assert not result.manual_routing_required


class TestSoDPolicy:
    """Tests for VR-011: Segregation of duties."""
    
    def test_settlement_same_user_violation(self):
        """Test SoD violation when same user approves and prepares settlement."""
        result = SoDPolicy.check_settlement_preparation(
            prepared_by_user_id="user-123",
            approving_reviewer_user_id="user-123"
        )
        assert result.violated
        assert "cannot approve and prepare" in result.reason.lower()
    
    def test_settlement_different_users_pass(self):
        """Test SoD pass when different users for approval and preparation."""
        result = SoDPolicy.check_settlement_preparation(
            prepared_by_user_id="user-123",
            approving_reviewer_user_id="user-456"
        )
        assert not result.violated
    
    def test_settlement_no_reviewer_pass(self):
        """Test SoD pass when no reviewer assigned (full match case)."""
        result = SoDPolicy.check_settlement_preparation(
            prepared_by_user_id="user-123",
            approving_reviewer_user_id=None
        )
        assert not result.violated
    
    def test_review_same_user_violation(self):
        """Test SoD violation when same user ingests and reviews."""
        result = SoDPolicy.check_review_decision(
            reviewer_user_id="user-123",
            ingested_by_user_id="user-123"
        )
        assert result.violated
    
    def test_review_different_users_pass(self):
        """Test SoD pass when different users for ingestion and review."""
        result = SoDPolicy.check_review_decision(
            reviewer_user_id="user-123",
            ingested_by_user_id="user-456"
        )
        assert not result.violated


class TestReasonCodePolicy:
    """Tests for VR-012: Reason code validation."""
    
    def test_valid_reason_code_with_evidence(self):
        """Test valid reason code with evidence passes."""
        result = ReasonCodePolicy.validate_for_chargeback_generation(
            reason_code="PC-02",
            evidence_bundle=["EV-1", "EV-2"]
        )
        assert result.is_valid
    
    def test_missing_reason_code(self):
        """Test validation fails without reason code."""
        result = ReasonCodePolicy.validate_for_chargeback_generation(
            reason_code=None,
            evidence_bundle=["EV-1"]
        )
        assert not result.is_valid
        assert "required" in result.reason.lower()
    
    def test_invalid_reason_code(self):
        """Test validation fails with unapproved reason code."""
        result = ReasonCodePolicy.validate_for_chargeback_generation(
            reason_code="INVALID-99",
            evidence_bundle=["EV-1"]
        )
        assert not result.is_valid
        assert "not in approved" in result.reason.lower()
    
    def test_missing_evidence(self):
        """Test validation fails without evidence."""
        result = ReasonCodePolicy.validate_for_chargeback_generation(
            reason_code="PC-02",
            evidence_bundle=None
        )
        assert not result.is_valid
        assert "evidence" in result.reason.lower()
    
    def test_empty_evidence_bundle(self):
        """Test validation fails with empty evidence bundle."""
        result = ReasonCodePolicy.validate_for_chargeback_generation(
            reason_code="PC-02",
            evidence_bundle=[]
        )
        assert not result.is_valid
    
    def test_get_reason_description(self):
        """Test reason code description lookup."""
        desc = ReasonCodePolicy.get_reason_description("PC-02")
        assert desc is not None
        assert "price" in desc.lower()
        
        desc_none = ReasonCodePolicy.get_reason_description("INVALID")
        assert desc_none is None
