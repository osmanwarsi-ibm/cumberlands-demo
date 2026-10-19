/**
 * API type definitions matching backend contracts
 */

// Auth types
export interface LoginRequest {
  username: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
}

// Intake types
export interface IngestBatchRequest {
  source_type: string;
  source_identifier: string;
}

export interface IngestBatchResponse {
  batch_id: string;
  status: string;
  total_lines: number;
  accepted_lines: number;
  rejected_lines: number;
  quarantine_reasons: Array<{
    line_id: string;
    reason: string;
  }>;
}

// Reconciliation types
export interface BatchListItem {
  batch_id: string;
  status: string;
  total_lines: number;
  accepted_lines: number;
  rejected_lines: number;
  created_at?: string | null;
  matched_at?: string | null;
}

export interface BatchListResponse {
  batches: BatchListItem[];
  total: number;
}

export interface RunMatchRequest {
  batch_id: string;
}

export interface RunMatchResponse {
  batch_id: string;
  status: string;
  full_match_count: number;
  cost_exception_count: number;
  quantity_exception_count: number;
  unmatched_statement_count: number;
  unmatched_receipt_count: number;
  manual_route_count: number;
  matched_at: string;
}

// Queue types - ACTUAL backend contract
export interface QueueItem {
  case_id: string;
  case_type: string;
  case_status: string;
  vendor_id?: string;
  store_id?: string;
  item_id?: string;
  delivery_ref?: string;
  delivery_date?: string;
  statement_qty?: number | null;
  received_qty?: number | null;
  statement_unit_cost?: number | null;
  expected_unit_cost?: number | null;
  cost_variance?: number | null;
  quantity_variance?: number | null;
  quantity_variance_pct?: number | null;
  confidence_band?: string | null;
  confidence_score?: number | null;
  missing_context_count: number;
  missing_context_list?: string[];
  recommended_action?: string | null;
  assigned_role?: string;
  current_owner_role?: string;
  created_at?: string;
}

export interface QueueResponse {
  queue_type: string;
  total: number;
  items: QueueItem[];
}

// Case detail types - ACTUAL backend contract
export interface MatchBasisResponse {
  statement_qty?: number | null;
  received_qty?: number | null;
  quantity_variance?: number | null;
  quantity_variance_pct?: number | null;
  statement_unit_cost?: number | null;
  expected_unit_cost?: number | null;
  cost_variance?: number | null;
  applied_rules: string[];
}

export interface TriageResponse {
  suggestion?: string | null;
  confidence_score?: number | null;
  confidence_band?: string | null;
  rationale?: string | null;
  evidence_refs: string[];
  penalty_reasons: string[];
}

export interface ReviewStateResponse {
  decision_type?: string | null;
  reviewer_username?: string | null;
  reason_code?: string | null;
  rationale_note?: string | null;
  decided_at?: string | null;
}

export interface SettlementEligibilityResponse {
  is_eligible: boolean;
  reason?: string | null;
}

export interface CaseDetail {
  case_id: string;
  outcome_class: string;
  vendor_id: string;
  item_id: string;
  delivery_ref?: string | null;
  store_id: string;
  current_owner_role?: string | null;
  match_basis: MatchBasisResponse;
  triage?: TriageResponse | null;
  review_state?: ReviewStateResponse | null;
  settlement_eligibility: SettlementEligibilityResponse;
}

// Review decision types
export interface ReviewDecisionRequest {
  decision_type: string;
  reviewer_user_id: string;
  reason_code?: string | null;
  rationale_note?: string | null;
}

export interface ReviewDecisionResponse {
  case_id: string;
  decision_id: string;
  case_status: string;
}

// Settlement types
export interface SettlementRequest {
  prepared_by_user_id: string;
  generate_chargeback_support?: boolean;
}

export interface SettlementResponse {
  settlement_record_id: string;
  queue_entry_id: string;
  queue_status: string;
  ack_status?: string;
  chargeback_document_id?: string | null;
  created_at: string;
}

// Audit types
export interface AuditEvent {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  actor_type: string;
  actor_id?: string | null;
  actor_username?: string | null;
  event_type: string;
  details_json: Record<string, unknown>;
  event_ts: string;
}

export interface AuditResponse {
  aggregate_type: string;
  aggregate_id: string;
  events: AuditEvent[];
}

// Health types
export interface HealthResponse {
  status: string;
  sqlite: string;
  fixtures_loaded: boolean;
  triage_mode: string;
}
