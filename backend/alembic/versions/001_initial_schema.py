"""Initial schema for Cumberland Farms DSD Vendor Receiving Reconciliation MVP.

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-19

Implements all 15 tables from LLD Section 6.3 DDL with indexes from Section 6.4.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables and indexes for the MVP schema."""
    
    # Table 1: users
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default=sa.text("'AP_SPECIALIST'")),
        sa.Column('is_active', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("role IN ('PRICE_BOOK_ANALYST','INVENTORY_CONTROL_ANALYST','AP_SPECIALIST','VENDOR_RELATIONS_MANAGER','INTERNAL_AUDIT')", name='check_user_role'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )

    # Table 2: statement_batches
    op.create_table(
        'statement_batches',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('source_type', sa.String(), nullable=False),
        sa.Column('source_identifier', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('total_lines', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('accepted_lines', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('rejected_lines', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('ingested_by_user_id', sa.String(), nullable=False),
        sa.Column('ingested_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("source_type IN ('fixture_file','fixture_record_set')", name='check_batch_source_type'),
        sa.CheckConstraint("status IN ('PENDING','COMPLETED','PARTIAL','REJECTED')", name='check_batch_status'),
        sa.ForeignKeyConstraint(['ingested_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 3: statement_lines
    op.create_table(
        'statement_lines',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('batch_id', sa.String(), nullable=False),
        sa.Column('vendor_id', sa.String(), nullable=False),
        sa.Column('store_id', sa.String(), nullable=False),
        sa.Column('item_id', sa.String(), nullable=False),
        sa.Column('invoice_ref', sa.String(), nullable=True),
        sa.Column('delivery_ref', sa.String(), nullable=True),
        sa.Column('delivery_date', sa.String(), nullable=True),
        sa.Column('statement_qty', sa.Float(), nullable=False),
        sa.Column('statement_unit_cost', sa.Float(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('rejection_reason', sa.String(), nullable=True),
        sa.Column('normalized_payload_json', sa.Text(), nullable=False),
        sa.CheckConstraint("status IN ('NORMALIZED','REJECTED','MATCHED')", name='check_statement_line_status'),
        sa.ForeignKeyConstraint(['batch_id'], ['statement_batches.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 4: receiving_records_fixture
    op.create_table(
        'receiving_records_fixture',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('vendor_id', sa.String(), nullable=False),
        sa.Column('store_id', sa.String(), nullable=False),
        sa.Column('item_id', sa.String(), nullable=False),
        sa.Column('delivery_ref', sa.String(), nullable=True),
        sa.Column('received_qty', sa.Float(), nullable=False),
        sa.Column('receipt_date', sa.String(), nullable=True),
        sa.Column('source_system', sa.String(), nullable=False, server_default=sa.text("'BOS_PDI'")),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 5: price_book_costs_fixture
    op.create_table(
        'price_book_costs_fixture',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('vendor_id', sa.String(), nullable=False),
        sa.Column('item_id', sa.String(), nullable=False),
        sa.Column('expected_unit_cost', sa.Float(), nullable=False),
        sa.Column('effective_start', sa.String(), nullable=True),
        sa.Column('effective_end', sa.String(), nullable=True),
        sa.Column('source_system', sa.String(), nullable=False, server_default=sa.text("'BOS_PDI'")),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 6: exception_history_fixture
    op.create_table(
        'exception_history_fixture',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('vendor_id', sa.String(), nullable=False),
        sa.Column('item_id', sa.String(), nullable=False),
        sa.Column('case_type', sa.String(), nullable=False),
        sa.Column('prior_outcome', sa.String(), nullable=False),
        sa.Column('summary_json', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 7: match_results
    op.create_table(
        'match_results',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('statement_line_id', sa.String(), nullable=False),
        sa.Column('receiving_record_id', sa.String(), nullable=True),
        sa.Column('price_book_cost_id', sa.String(), nullable=True),
        sa.Column('quantity_variance', sa.Float(), nullable=True),
        sa.Column('quantity_variance_pct', sa.Float(), nullable=True),
        sa.Column('cost_variance', sa.Float(), nullable=True),
        sa.Column('outcome_class', sa.String(), nullable=False),
        sa.Column('rule_basis_json', sa.Text(), nullable=False),
        sa.Column('matched_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("outcome_class IN ('FULL_MATCH','COST_EXCEPTION','QUANTITY_EXCEPTION','UNMATCHED_STATEMENT','UNMATCHED_RECEIPT')", name='check_match_outcome_class'),
        sa.ForeignKeyConstraint(['statement_line_id'], ['statement_lines.id'], ),
        sa.ForeignKeyConstraint(['receiving_record_id'], ['receiving_records_fixture.id'], ),
        sa.ForeignKeyConstraint(['price_book_cost_id'], ['price_book_costs_fixture.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('statement_line_id')
    )

    # Table 8: exception_cases
    op.create_table(
        'exception_cases',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('match_result_id', sa.String(), nullable=False),
        sa.Column('case_type', sa.String(), nullable=False),
        sa.Column('queue_type', sa.String(), nullable=False),
        sa.Column('case_status', sa.String(), nullable=False),
        sa.Column('missing_context_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('missing_context_list_json', sa.Text(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column('current_owner_role', sa.String(), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("case_type IN ('COST_EXCEPTION','QUANTITY_EXCEPTION','UNMATCHED_STATEMENT','UNMATCHED_RECEIPT','MIXED_EXCEPTION')", name='check_exception_case_type'),
        sa.CheckConstraint("queue_type IN ('cost_review','quantity_review','ap_review','vendor_follow_up')", name='check_exception_queue_type'),
        sa.CheckConstraint("case_status IN ('OPEN','UNDER_REVIEW','APPROVED','OVERRIDDEN','ESCALATED','SETTLEMENT_READY','QUEUED','HELD','FAILED')", name='check_exception_case_status'),
        sa.ForeignKeyConstraint(['match_result_id'], ['match_results.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('match_result_id')
    )

    # Table 9: triage_recommendations
    op.create_table(
        'triage_recommendations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('provider_mode', sa.String(), nullable=False),
        sa.Column('suggestion', sa.String(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('confidence_band', sa.String(), nullable=False),
        sa.Column('rationale', sa.Text(), nullable=False),
        sa.Column('evidence_refs_json', sa.Text(), nullable=False),
        sa.Column('penalty_reasons_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("provider_mode IN ('MOCK','LLM')", name='check_triage_provider_mode'),
        sa.CheckConstraint("confidence_band IN ('GREEN','AMBER','RED','NONE')", name='check_triage_confidence_band'),
        sa.ForeignKeyConstraint(['case_id'], ['exception_cases.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 10: review_decisions
    op.create_table(
        'review_decisions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('reviewer_user_id', sa.String(), nullable=False),
        sa.Column('decision_type', sa.String(), nullable=False),
        sa.Column('reason_code', sa.String(), nullable=True),
        sa.Column('rationale_note', sa.Text(), nullable=True),
        sa.Column('decided_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("decision_type IN ('APPROVE','OVERRIDE','ESCALATE')", name='check_review_decision_type'),
        sa.ForeignKeyConstraint(['case_id'], ['exception_cases.id'], ),
        sa.ForeignKeyConstraint(['reviewer_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 11: settlement_records
    op.create_table(
        'settlement_records',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=True),
        sa.Column('match_result_id', sa.String(), nullable=True),
        sa.Column('source_type', sa.String(), nullable=False),
        sa.Column('resolution_basis', sa.Text(), nullable=False),
        sa.Column('prepared_by_user_id', sa.String(), nullable=False),
        sa.Column('eligibility_status', sa.String(), nullable=False),
        sa.Column('prepared_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("source_type IN ('FULL_MATCH','APPROVED_EXCEPTION')", name='check_settlement_source_type'),
        sa.CheckConstraint("eligibility_status IN ('ELIGIBLE','BLOCKED','QUEUED')", name='check_settlement_eligibility_status'),
        sa.ForeignKeyConstraint(['case_id'], ['exception_cases.id'], ),
        sa.ForeignKeyConstraint(['match_result_id'], ['match_results.id'], ),
        sa.ForeignKeyConstraint(['prepared_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 12: ap_queue_entries
    op.create_table(
        'ap_queue_entries',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('settlement_record_id', sa.String(), nullable=False),
        sa.Column('queue_status', sa.String(), nullable=False),
        sa.Column('ack_status', sa.String(), nullable=False),
        sa.Column('payload_json', sa.Text(), nullable=False),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("queue_status IN ('QUEUED','HELD','FAILED')", name='check_ap_queue_status'),
        sa.CheckConstraint("ack_status IN ('ACCEPTED','REJECTED','PENDING')", name='check_ap_ack_status'),
        sa.ForeignKeyConstraint(['settlement_record_id'], ['settlement_records.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 13: chargeback_documents
    op.create_table(
        'chargeback_documents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('document_type', sa.String(), nullable=False),
        sa.Column('reason_code', sa.String(), nullable=False),
        sa.Column('evidence_bundle_json', sa.Text(), nullable=False),
        sa.Column('generated_at', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("document_type IN ('CHARGEBACK','CREDIT_REQUEST')", name='check_chargeback_document_type'),
        sa.ForeignKeyConstraint(['case_id'], ['exception_cases.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 14: audit_events
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('aggregate_type', sa.String(), nullable=False),
        sa.Column('aggregate_id', sa.String(), nullable=False),
        sa.Column('actor_type', sa.String(), nullable=False),
        sa.Column('actor_id', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('details_json', sa.Text(), nullable=False),
        sa.Column('event_ts', sa.String(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("actor_type IN ('SYSTEM','USER','BOUNDARY')", name='check_audit_actor_type'),
        sa.PrimaryKeyConstraint('id')
    )

    # Table 15: deferred_boundaries
    op.create_table(
        'deferred_boundaries',
        sa.Column('boundary_key', sa.String(), nullable=False),
        sa.Column('boundary_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=False),
        sa.CheckConstraint("boundary_type IN ('AGENT','TOOL')", name='check_deferred_boundary_type'),
        sa.CheckConstraint("status IN ('DEFERRED','PRESERVED_ONLY')", name='check_deferred_boundary_status'),
        sa.PrimaryKeyConstraint('boundary_key')
    )

    # Create indexes from LLD Section 6.4
    op.create_index('idx_statement_lines_batch_id', 'statement_lines', ['batch_id'])
    op.create_index('idx_match_results_outcome_class', 'match_results', ['outcome_class'])
    op.create_index('idx_exception_cases_queue_status', 'exception_cases', ['queue_type', 'case_status'])
    op.create_index('idx_review_decisions_case_id', 'review_decisions', ['case_id'])
    op.create_index('idx_settlement_records_case_id', 'settlement_records', ['case_id'])
    op.create_index('idx_ap_queue_entries_queue_status', 'ap_queue_entries', ['queue_status', 'ack_status'])
    op.create_index('idx_audit_events_aggregate', 'audit_events', ['aggregate_type', 'aggregate_id', 'event_ts'])


def downgrade() -> None:
    """Drop all tables and indexes."""
    # Drop indexes
    op.drop_index('idx_audit_events_aggregate', table_name='audit_events')
    op.drop_index('idx_ap_queue_entries_queue_status', table_name='ap_queue_entries')
    op.drop_index('idx_settlement_records_case_id', table_name='settlement_records')
    op.drop_index('idx_review_decisions_case_id', table_name='review_decisions')
    op.drop_index('idx_exception_cases_queue_status', table_name='exception_cases')
    op.drop_index('idx_match_results_outcome_class', table_name='match_results')
    op.drop_index('idx_statement_lines_batch_id', table_name='statement_lines')

    # Drop tables in reverse dependency order
    op.drop_table('deferred_boundaries')
    op.drop_table('audit_events')
    op.drop_table('chargeback_documents')
    op.drop_table('ap_queue_entries')
    op.drop_table('settlement_records')
    op.drop_table('review_decisions')
    op.drop_table('triage_recommendations')
    op.drop_table('exception_cases')
    op.drop_table('match_results')
    op.drop_table('exception_history_fixture')
    op.drop_table('price_book_costs_fixture')
    op.drop_table('receiving_records_fixture')
    op.drop_table('statement_lines')
    op.drop_table('statement_batches')
    op.drop_table('users')
