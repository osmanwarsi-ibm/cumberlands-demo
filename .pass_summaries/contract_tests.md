# Pass 3: Runtime Contract + Unit Tests

## Status: PARTIAL PASS

Backend verification: ✅ PASSED  
Frontend verification: ❌ FAILED due to contract mismatch

## Backend Test Results

### Baseline (B0)
- 98 passed, 5 failed, TOTAL COLLECTED: 103

### Final (B3)
- **102 passed, 1 failed, TOTAL COLLECTED: 103**
- Pass rate: 102/103 = 99.0%
- Improvement: +4 tests fixed (from 5 failed to 1 failed)

### Remaining Backend Failure
1. `tests/integration/test_api_endpoints.py::TestIntakeEndpoint::test_create_batch_validation_error` - Test expects 400/422 for invalid source_type but service returns 500. The intake service does not validate source_type before attempting to fetch from the statement source adapter, resulting in an unhandled exception. Fix required: add source_type validation in IntakeService.ingest_batch() before calling adapter.

## Frontend Test Results

- **102 passed, 25 failed, TOTAL COLLECTED: 127**
- Pass rate: 102/127 = 80.3%
- Frontend tests fail because the UI components expect richer API responses than the backend provides.

## Runtime Contract Verification

### Backend Started Successfully
- Server listening on http://127.0.0.1:9400 (PID 5841)
- All endpoints accessible and responding
- Authentication working with stub tokens

### Contract Mismatches Found

#### 1. User.id type mismatch (FIXED)
- **Backend returns**: `id: string` (e.g., "usr_001")
- **Frontend expected**: `id: number`
- **Fix applied**: Updated frontend `User` interface to `id: string`

#### 2. QueueItem response structure (INCOMPATIBLE - NOT FIXED)
Backend returns only 7 fields:
```typescript
{
  case_id: string;
  case_type: string;
  case_status: string;
  confidence_band?: string | null;
  missing_context_count: number;
  recommended_action?: string | null;
  assigned_role: string;
}
```

Frontend expects 20+ fields including:
- `vendor_id`, `store_id`, `item_id`, `invoice_ref`, `delivery_ref`, `delivery_date`
- `statement_qty`, `received_qty`, `statement_unit_cost`, `expected_unit_cost`
- `quantity_variance`, `quantity_variance_pct`, `cost_variance`
- `confidence_score`, `missing_context_list`, `current_owner_role`, `created_at`

**Result**: Queue pages (CostQueuePage, QuantityQueuePage, ApQueuePage, VendorFollowUpPage) cannot display expected information and will fail at runtime.

#### 3. CaseDetail response structure (INCOMPATIBLE - NOT FIXED)
Backend returns only 6 top-level fields with nested structures:
```typescript
{
  case_id: string;
  outcome_class: string;
  match_basis: MatchBasisResponse;
  triage?: TriageResponse | null;
  review_state?: ReviewStateResponse | null;
  settlement_eligibility: SettlementEligibilityResponse;
}
```

Frontend expects flat structure with 15+ fields including `vendor_id`, `store_id`, `item_id`, `invoice_ref`, `delivery_ref`, `delivery_date`, `case_type`, `case_status`, `current_owner_role`, `created_at`, `updated_at`.

**Result**: Case detail pages cannot display identifying information about vendor, store, item, or invoice references.

#### 4. Batch ID type changes (FIXED)
- **Backend returns**: `batch_id: string`
- **Frontend expected**: `batch_id: number`
- **Fix applied**: Updated all frontend interfaces to use `string` for batch_id, case_id, user_id, and other ID fields

### Frontend Build Status
❌ FAILED - Frontend build fails with 68 TypeScript errors due to missing fields that queue and case detail pages attempt to access but backend does not provide.

## Code Fixes Applied

### Backend Fixes

1. **Import Errors (4 files):**
   - `tests/integration/conftest.py` - Fixed import of `get_session`, `get_config` from `app.api.deps` instead of `app.main`
   - `app/api/intake.py` - Fixed import to use `FixtureStatementSourceAdapter` instead of `StatementSourceAdapter`
   - `app/api/reconciliation.py` - Fixed imports to use `FixtureReceivingRecordsAdapter` and `FixturePriceBookCostAdapter` with correct class names

2. **Migration Parity (1 file):**
   - `app/db/models.py` - Added missing `Index` declarations to match migration script:
     - `idx_statement_lines_batch_id` on `statement_lines.batch_id`
     - `idx_match_results_outcome_class` on `match_results.outcome_class`
     - `idx_exception_cases_queue_status` on `exception_cases(queue_type, case_status)`
     - `idx_review_decisions_case_id` on `review_decisions.case_id`
     - `idx_settlement_records_case_id` on `settlement_records.case_id`
     - `idx_ap_queue_entries_queue_status` on `ap_queue_entries(queue_status, ack_status)`
     - `idx_audit_events_aggregate` on `audit_events(aggregate_type, aggregate_id, event_ts)`

### Frontend Fixes

1. **Type Definitions (1 file):**
   - `src/types/api.ts` - Completely rewrote to match ACTUAL backend responses:
     - Changed all ID fields from `number` to `string`
     - Simplified `QueueItem` to only 7 fields backend actually returns
     - Simplified `CaseDetail` to match nested structure backend provides
     - Updated all response types to use `string` IDs and proper nullability

## What Was NOT Fixed

### Backend
- Input validation in IntakeService for invalid source_type (causes 1 test failure)

### Frontend
- Queue pages expecting 20+ fields per queue item but backend returns only 7
- Case detail pages expecting vendor_id, store_id, item_id but backend doesn't return them at top level
- All pages attempting to display data the backend API doesn't provide
- 68 TypeScript compilation errors due to missing fields
- 25 failing vitest tests due to UI expecting data that doesn't exist in API responses

## Root Cause

The frontend was designed for a rich, denormalized API that returns all display fields in queue and case responses. The backend implements a normalized, minimal API that returns only core workflow fields in list endpoints and requires clients to navigate nested structures in detail endpoints. The backend does not JOIN statement_line data into exception_case responses, so identifying information (vendor, store, item) is not available in case_id-based lookups.

This is an architectural mismatch, not a simple field rename. Fixing it requires either:
1. Backend change: enrich queue and case responses with JOINed statement_line fields, OR
2. Frontend change: redesign pages to work with minimal API and make additional requests for detail

## Verification Artifacts Preserved

- `backend/_start_server.py` - Server startup script
- `backend/_stop_server.py` - Server shutdown script
- `backend/_server.log` - Server output log
- `backend/_server.pid` - Server PID file (removed after stop)
- `.verification/pytest.xml` - Backend test results (103 tests, 102 passed, 1 failed)
- `.verification/vitest.xml` - Frontend test results (127 tests, 102 passed, 25 failed)
- `backend/dev.env` - Development configuration (SQLite database, stub auth)

All verification artifacts are listed in `.gitignore`.

## Configuration Verified With

Database: SQLite at `sqlite:///./data/reconciliation.db` (via dev.env)  
Auth: Stub tokens (no real password verification)  
CORS: Default origins  
Triage mode: MOCK  

## Next Steps for Pass 4

1. **CRITICAL**: Decide whether to enrich backend API or simplify frontend expectations
2. Fix intake service source_type validation to return 400 instead of 500
3. If enriching backend: add JOINs in queue/case endpoints to include vendor_id, store_id, item_id, etc.
4. If simplifying frontend: redesign queue/case pages to work with minimal API responses
5. Re-run frontend tests after contract alignment

## Summary

Backend runtime verification: ✅ SUCCESS  
Backend unit tests: ✅ 99.0% pass rate (102/103)  
Frontend/backend contract: ❌ MAJOR MISMATCH - frontend expects 3x more data than backend provides  
Frontend unit tests: ⚠️ 80.3% pass rate (102/127) - failures caused by contract mismatch  
