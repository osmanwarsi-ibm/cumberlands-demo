"""SQLAlchemy ORM models for Cumberland Farms DSD Vendor Receiving Reconciliation MVP.

Implements all 15 tables from LLD Section 6.3 DDL with portable SQLite semantics.
"""
from sqlalchemy import (
    CheckConstraint,
    Column,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class User(Base):
    """Stub identity and role for pilot authentication."""
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username = Column(String, nullable=False, unique=True)
    role = Column(
        String,
        nullable=False,
        server_default=text("'AP_SPECIALIST'"),
    )
    is_active = Column(Integer, nullable=False, server_default=text("1"))
    created_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "role IN ('PRICE_BOOK_ANALYST','INVENTORY_CONTROL_ANALYST','AP_SPECIALIST','VENDOR_RELATIONS_MANAGER','INTERNAL_AUDIT')",
            name="check_user_role",
        ),
    )

    # Relationships
    ingested_batches = relationship("StatementBatch", back_populates="ingested_by_user", foreign_keys="StatementBatch.ingested_by_user_id")
    review_decisions = relationship("ReviewDecision", back_populates="reviewer_user")
    settlement_records = relationship("SettlementRecord", back_populates="prepared_by_user")


class StatementBatch(Base):
    """Intake batch header."""
    __tablename__ = "statement_batches"

    id = Column(String, primary_key=True)
    source_type = Column(String, nullable=False)
    source_identifier = Column(String, nullable=False)
    status = Column(String, nullable=False)
    total_lines = Column(Integer, nullable=False, server_default=text("0"))
    accepted_lines = Column(Integer, nullable=False, server_default=text("0"))
    rejected_lines = Column(Integer, nullable=False, server_default=text("0"))
    ingested_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    ingested_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "source_type IN ('fixture_file','fixture_record_set')",
            name="check_batch_source_type",
        ),
        CheckConstraint(
            "status IN ('PENDING','COMPLETED','PARTIAL','REJECTED')",
            name="check_batch_status",
        ),
    )

    # Relationships
    ingested_by_user = relationship("User", back_populates="ingested_batches", foreign_keys=[ingested_by_user_id])
    statement_lines = relationship("StatementLine", back_populates="batch")


class StatementLine(Base):
    """Normalized statement lines."""
    __tablename__ = "statement_lines"

    id = Column(String, primary_key=True)
    batch_id = Column(String, ForeignKey("statement_batches.id"), nullable=False)
    vendor_id = Column(String, nullable=False)
    store_id = Column(String, nullable=False)
    item_id = Column(String, nullable=False)
    invoice_ref = Column(String)
    delivery_ref = Column(String)
    delivery_date = Column(String)
    statement_qty = Column(Float, nullable=False)
    statement_unit_cost = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    rejection_reason = Column(String)
    normalized_payload_json = Column(Text, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "status IN ('NORMALIZED','REJECTED','MATCHED')",
            name="check_statement_line_status",
        ),
        Index('idx_statement_lines_batch_id', 'batch_id'),
    )

    # Relationships
    batch = relationship("StatementBatch", back_populates="statement_lines")
    match_result = relationship("MatchResult", back_populates="statement_line", uselist=False)


class ReceivingRecordFixture(Base):
    """Mock BOS/PDI receiving evidence."""
    __tablename__ = "receiving_records_fixture"

    id = Column(String, primary_key=True)
    vendor_id = Column(String, nullable=False)
    store_id = Column(String, nullable=False)
    item_id = Column(String, nullable=False)
    delivery_ref = Column(String)
    received_qty = Column(Float, nullable=False)
    receipt_date = Column(String)
    source_system = Column(String, nullable=False, server_default=text("'BOS_PDI'"))

    # Relationships
    match_results = relationship("MatchResult", back_populates="receiving_record")


class PriceBookCostFixture(Base):
    """Mock expected cost records."""
    __tablename__ = "price_book_costs_fixture"

    id = Column(String, primary_key=True)
    vendor_id = Column(String, nullable=False)
    item_id = Column(String, nullable=False)
    expected_unit_cost = Column(Float, nullable=False)
    effective_start = Column(String)
    effective_end = Column(String)
    source_system = Column(String, nullable=False, server_default=text("'BOS_PDI'"))

    # Relationships
    match_results = relationship("MatchResult", back_populates="price_book_cost")


class ExceptionHistoryFixture(Base):
    """Mock prior exception context."""
    __tablename__ = "exception_history_fixture"

    id = Column(String, primary_key=True)
    vendor_id = Column(String, nullable=False)
    item_id = Column(String, nullable=False)
    case_type = Column(String, nullable=False)
    prior_outcome = Column(String, nullable=False)
    summary_json = Column(Text, nullable=False)


class MatchResult(Base):
    """Deterministic outputs and rule basis."""
    __tablename__ = "match_results"

    id = Column(String, primary_key=True)
    statement_line_id = Column(String, ForeignKey("statement_lines.id"), nullable=False, unique=True)
    receiving_record_id = Column(String, ForeignKey("receiving_records_fixture.id"))
    price_book_cost_id = Column(String, ForeignKey("price_book_costs_fixture.id"))
    quantity_variance = Column(Float)
    quantity_variance_pct = Column(Float)
    cost_variance = Column(Float)
    outcome_class = Column(String, nullable=False)
    rule_basis_json = Column(Text, nullable=False)
    matched_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "outcome_class IN ('FULL_MATCH','COST_EXCEPTION','QUANTITY_EXCEPTION','UNMATCHED_STATEMENT','UNMATCHED_RECEIPT')",
            name="check_match_outcome_class",
        ),
        Index('idx_match_results_outcome_class', 'outcome_class'),
    )

    # Relationships
    statement_line = relationship("StatementLine", back_populates="match_result")
    receiving_record = relationship("ReceivingRecordFixture", back_populates="match_results")
    price_book_cost = relationship("PriceBookCostFixture", back_populates="match_results")
    exception_case = relationship("ExceptionCase", back_populates="match_result", uselist=False)
    settlement_records = relationship("SettlementRecord", back_populates="match_result")


class ExceptionCase(Base):
    """Reviewable workflow state."""
    __tablename__ = "exception_cases"

    id = Column(String, primary_key=True)
    match_result_id = Column(String, ForeignKey("match_results.id"), nullable=False, unique=True)
    case_type = Column(String, nullable=False)
    queue_type = Column(String, nullable=False)
    case_status = Column(String, nullable=False)
    missing_context_count = Column(Integer, nullable=False, server_default=text("0"))
    missing_context_list_json = Column(Text, nullable=False, server_default=text("'[]'"))
    current_owner_role = Column(String, nullable=False)
    created_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "case_type IN ('COST_EXCEPTION','QUANTITY_EXCEPTION','UNMATCHED_STATEMENT','UNMATCHED_RECEIPT','MIXED_EXCEPTION')",
            name="check_exception_case_type",
        ),
        CheckConstraint(
            "queue_type IN ('cost_review','quantity_review','ap_review','vendor_follow_up')",
            name="check_exception_queue_type",
        ),
        CheckConstraint(
            "case_status IN ('OPEN','UNDER_REVIEW','APPROVED','OVERRIDDEN','ESCALATED','SETTLEMENT_READY','QUEUED','HELD','FAILED')",
            name="check_exception_case_status",
        ),
        Index('idx_exception_cases_queue_status', 'queue_type', 'case_status'),
    )

    # Relationships
    match_result = relationship("MatchResult", back_populates="exception_case")
    triage_recommendations = relationship("TriageRecommendation", back_populates="case")
    review_decisions = relationship("ReviewDecision", back_populates="case")
    settlement_records = relationship("SettlementRecord", back_populates="case")
    chargeback_documents = relationship("ChargebackDocument", back_populates="case")


class TriageRecommendation(Base):
    """AGN4 advisory output."""
    __tablename__ = "triage_recommendations"

    id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("exception_cases.id"), nullable=False)
    provider_mode = Column(String, nullable=False)
    suggestion = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)
    confidence_band = Column(String, nullable=False)
    rationale = Column(Text, nullable=False)
    evidence_refs_json = Column(Text, nullable=False)
    penalty_reasons_json = Column(Text, nullable=False)
    created_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "provider_mode IN ('MOCK','LLM')",
            name="check_triage_provider_mode",
        ),
        CheckConstraint(
            "confidence_band IN ('GREEN','AMBER','RED','NONE')",
            name="check_triage_confidence_band",
        ),
    )

    # Relationships
    case = relationship("ExceptionCase", back_populates="triage_recommendations")


class ReviewDecision(Base):
    """Human decision record."""
    __tablename__ = "review_decisions"

    id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("exception_cases.id"), nullable=False)
    reviewer_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    decision_type = Column(String, nullable=False)
    reason_code = Column(String)
    rationale_note = Column(Text)
    decided_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "decision_type IN ('APPROVE','OVERRIDE','ESCALATE')",
            name="check_review_decision_type",
        ),
        Index('idx_review_decisions_case_id', 'case_id'),
    )

    # Relationships
    case = relationship("ExceptionCase", back_populates="review_decisions")
    reviewer_user = relationship("User", back_populates="review_decisions")


class SettlementRecord(Base):
    """Settlement-ready business object."""
    __tablename__ = "settlement_records"

    id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("exception_cases.id"))
    match_result_id = Column(String, ForeignKey("match_results.id"))
    source_type = Column(String, nullable=False)
    resolution_basis = Column(Text, nullable=False)
    prepared_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    eligibility_status = Column(String, nullable=False)
    prepared_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "source_type IN ('FULL_MATCH','APPROVED_EXCEPTION')",
            name="check_settlement_source_type",
        ),
        CheckConstraint(
            "eligibility_status IN ('ELIGIBLE','BLOCKED','QUEUED')",
            name="check_settlement_eligibility_status",
        ),
        Index('idx_settlement_records_case_id', 'case_id'),
    )

    # Relationships
    case = relationship("ExceptionCase", back_populates="settlement_records")
    match_result = relationship("MatchResult", back_populates="settlement_records")
    prepared_by_user = relationship("User", back_populates="settlement_records")
    ap_queue_entries = relationship("ApQueueEntry", back_populates="settlement_record")


class ApQueueEntry(Base):
    """Mock AP handoff state."""
    __tablename__ = "ap_queue_entries"

    id = Column(String, primary_key=True)
    settlement_record_id = Column(String, ForeignKey("settlement_records.id"), nullable=False)
    queue_status = Column(String, nullable=False)
    ack_status = Column(String, nullable=False)
    payload_json = Column(Text, nullable=False)
    failure_reason = Column(Text)
    created_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "queue_status IN ('QUEUED','HELD','FAILED')",
            name="check_ap_queue_status",
        ),
        CheckConstraint(
            "ack_status IN ('ACCEPTED','REJECTED','PENDING')",
            name="check_ap_ack_status",
        ),
        Index('idx_ap_queue_entries_queue_status', 'queue_status', 'ack_status'),
    )

    # Relationships
    settlement_record = relationship("SettlementRecord", back_populates="ap_queue_entries")


class ChargebackDocument(Base):
    """Vendor follow-up support metadata."""
    __tablename__ = "chargeback_documents"

    id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("exception_cases.id"), nullable=False)
    document_type = Column(String, nullable=False)
    reason_code = Column(String, nullable=False)
    evidence_bundle_json = Column(Text, nullable=False)
    generated_at = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "document_type IN ('CHARGEBACK','CREDIT_REQUEST')",
            name="check_chargeback_document_type",
        ),
    )

    # Relationships
    case = relationship("ExceptionCase", back_populates="chargeback_documents")


class AuditEvent(Base):
    """Immutable audit trail."""
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True)
    aggregate_type = Column(String, nullable=False)
    aggregate_id = Column(String, nullable=False)
    actor_type = Column(String, nullable=False)
    actor_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    details_json = Column(Text, nullable=False)
    event_ts = Column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint(
            "actor_type IN ('SYSTEM','USER','BOUNDARY')",
            name="check_audit_actor_type",
        ),
        Index('idx_audit_events_aggregate', 'aggregate_type', 'aggregate_id', 'event_ts'),
    )


class DeferredBoundary(Base):
    """Preserved AGN3/AGN6/TOL9/TOL10 metadata."""
    __tablename__ = "deferred_boundaries"

    boundary_key = Column(String, primary_key=True)
    boundary_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    notes = Column(Text, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "boundary_type IN ('AGENT','TOOL')",
            name="check_deferred_boundary_type",
        ),
        CheckConstraint(
            "status IN ('DEFERRED','PRESERVED_ONLY')",
            name="check_deferred_boundary_status",
        ),
    )
