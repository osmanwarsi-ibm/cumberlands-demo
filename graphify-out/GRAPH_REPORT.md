# Graph Report - cumberlands-demo  (2026-10-19)

## Corpus Check
- 111 files · ~49,914 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 8, .example 2, .xml 2)

## Summary
- 1064 nodes · 1882 edges · 75 communities (38 shown, 37 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `66f71f68`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Cumberland Farms DSD Vendor Receiving Reconciliation MVP
- package.json
- compilerOptions
- compilerOptions
- tol6_apqueue.py
- ReasonCodePolicy
- env.py
- SoDPolicy
- Base
- models.py
- cumberlands-demo-backend
- tol10_deferred.py
- create_intake_batch
- .evaluate
- .evaluate
- client.ts
- cases.py
- 1. README.md Complete Sections
- App.tsx
- test_domain_policies.py
- DeferredBoundaryRegistry
- FixtureStatementSourceAdapter
- ApQueuePage.tsx
- StatementIntakePage.tsx
- common.py
- tol5_resolution.py
- ServiceRegistry
- LocalChargebackDocumentAdapter
- auth.tsx
- start.sh
- Docker Packaging Verification
- login
- ApAckResult
- FormControls.tsx
- reset_fixtures.sh
- prepare_settlement
- FixtureReceivingRecordsAdapter
- client
- tol9_deferred.py
- AuditService
- get_audit_trail
- get_queue
- TestQueuesEndpoint
- TestAuthEndpoint
- TestIntakeEndpoint
- CostQueuePage.tsx
- test_api_endpoints.py
- TestReconciliationEndpoint
- TestCasesEndpoint
- TestSettlementEndpoint
- TestAuditEndpoint
- TestHealthEndpoint
- devDependencies
- ExceptionHistorySummary
- scripts
- MockApQueueAckAdapter
- typing
- vite
- dependencies
- main.tsx
- stop.sh
- MockApQueueSubmissionAdapter
- ChargebackDocumentPort
- docker-entrypoint.sh

## God Nodes (most connected - your core abstractions)
1. `ServiceRegistry` - 40 edges
2. `User` - 27 edges
3. `ConfigurationService` - 23 edges
4. `Base` - 23 edges
5. `react` - 23 edges
6. `react-router-dom` - 23 edges
7. `useAuth()` - 23 edges
8. `ExceptionCase` - 21 edges
9. `Button()` - 20 edges
10. `Chip()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `ServiceRegistry` --uses--> `FixtureStatementSourceAdapter`  [INFERRED]
  backend/app/bootstrap/registry.py → backend/app/adapters/mcp/tol1_statement_source.py
- `FixtureReceivingRecordsAdapter` --uses--> `ReceivingRecordFixture`  [INFERRED]
  backend/app/adapters/mcp/tol2_receiving.py → backend/app/db/models.py
- `ServiceRegistry` --uses--> `FixtureReceivingRecordsAdapter`  [INFERRED]
  backend/app/bootstrap/registry.py → backend/app/adapters/mcp/tol2_receiving.py
- `FixturePriceBookCostAdapter` --uses--> `PriceBookCostFixture`  [INFERRED]
  backend/app/adapters/mcp/tol3_pricebook.py → backend/app/db/models.py
- `ServiceRegistry` --uses--> `FixturePriceBookCostAdapter`  [INFERRED]
  backend/app/bootstrap/registry.py → backend/app/adapters/mcp/tol3_pricebook.py

## Import Cycles
- None detected.

## Communities (75 total, 37 thin omitted)

### Community 0 - "Cumberland Farms DSD Vendor Receiving Reconciliation MVP"
Cohesion: 0.05
Nodes (40): Architecture, Backend (`backend/.env`), Backend Tests, Business Rules, Classification Rules (VR-005), Confidence Model (VR-008, VR-009), Container Details, Cumberland Farms DSD Vendor Receiving Reconciliation MVP (+32 more)

### Community 1 - "package.json"
Cohesion: 0.13
Nodes (14): description, engines, node, name, private, type, version, jsdom (+6 more)

### Community 2 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+11 more)

### Community 3 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowSyntheticDefaultImports, composite, lib, module, moduleResolution, noUnusedLocals, noUnusedParameters (+5 more)

### Community 5 - "ReasonCodePolicy"
Cohesion: 0.10
Nodes (3): ReasonCodePolicy, ReasonCodeValidationResult, TestReasonCodePolicy

### Community 6 - "env.py"
Cohesion: 0.20
Nodes (3): render_item(), run_migrations_offline(), run_migrations_online()

### Community 7 - "SoDPolicy"
Cohesion: 0.11
Nodes (3): SoDPolicy, SoDViolation, TestSoDPolicy

### Community 8 - "Base"
Cohesion: 0.12
Nodes (14): Base, DeferredBoundary, ExceptionHistoryFixture, PriceBookCostFixture, ReceivingRecordFixture, StatementBatch, get_database_url(), main() (+6 more)

### Community 9 - "models.py"
Cohesion: 0.06
Nodes (10): get_current_user(), get_session(), get_config(), get_current_user(), get_session(), get_config(), get_session(), ConfigurationService (+2 more)

### Community 13 - "tol10_deferred.py"
Cohesion: 0.16
Nodes (3): DashboardPublishPort, DashboardPublishResult, DeferredDashboardPublishAdapter

### Community 14 - "create_intake_batch"
Cohesion: 0.20
Nodes (3): create_intake_batch(), IntakeBatchRequest, IntakeBatchResponse

### Community 17 - "client.ts"
Cohesion: 0.16
Nodes (18): authAPI, casesAPI, healthAPI, AuditEvent, AuditResponse, CaseDetail, HealthResponse, IngestBatchRequest (+10 more)

### Community 18 - "cases.py"
Cohesion: 0.05
Nodes (18): CaseDetailResponse, create_review_decision(), get_case_detail(), MatchBasisResponse, ReviewDecisionRequest, ReviewDecisionResponse, ReviewStateResponse, SettlementEligibilityResponse (+10 more)

### Community 19 - "1. README.md Complete Sections"
Cohesion: 0.08
Nodes (25): 1. README.md Complete Sections, 2. Backend .env.example Documentation, 3. Frontend .env.example Documentation, 4. Seed Credentials Match, 5. Frontend LoginPage Default User Selection, 6. Runtime Verification, 7. Environment Variable Usage, 8. Docker Compose Configuration (+17 more)

### Community 20 - "App.tsx"
Cohesion: 0.38
Nodes (18): App(), Banner(), Breadcrumb(), Button(), Chip(), Header(), ApQueuePage(), AuditTracePage() (+10 more)

### Community 21 - "test_domain_policies.py"
Cohesion: 0.05
Nodes (8): ClassificationResult, OutcomeClass, ConfidenceBand, ConfidencePenalty, ConfidencePolicy, ConfidenceResult, TestClassificationPolicy, TestConfidencePolicy

### Community 23 - "FixtureStatementSourceAdapter"
Cohesion: 0.12
Nodes (4): FixtureStatementSourceAdapter, StatementLineDTO, StatementSourceResult, VendorStatementSourcePort

### Community 24 - "ApQueuePage.tsx"
Cohesion: 0.08
Nodes (31): auditAPI, settlementAPI, BreadcrumbItem, BreadcrumbProps, ButtonProps, Card(), CardProps, HeaderProps (+23 more)

### Community 25 - "StatementIntakePage.tsx"
Cohesion: 0.40
Nodes (4): intakeAPI, reconciliationAPI, FIXTURE_OPTIONS, QuarantineItem

### Community 26 - "common.py"
Cohesion: 0.10
Nodes (7): ErrorCode, ErrorResponse, generate_correlation_id(), generic_exception_handler(), HealthResponse, http_exception_handler(), health_check()

### Community 28 - "ServiceRegistry"
Cohesion: 0.06
Nodes (11): FixtureExceptionHistoryAdapter, LocalResolutionSubmissionAdapter, ReconciliationRunResponse, run_reconciliation(), IntakeService, get_registry(), initialize_registry(), ServiceRegistry (+3 more)

### Community 29 - "LocalChargebackDocumentAdapter"
Cohesion: 0.19
Nodes (3): ChargebackDocumentResult, LocalChargebackDocumentAdapter, ChargebackDocument

### Community 30 - "auth.tsx"
Cohesion: 0.12
Nodes (21): PILOT_USERS, ROLE_PERMISSIONS, WORKFLOW_STEPS, AuthContext, AuthContextType, AuthProvider(), AuthProviderProps, User (+13 more)

### Community 31 - "start.sh"
Cohesion: 0.48
Nodes (6): check_prerequisites(), DATABASE_URL, find_available_port(), native_path(), port_in_use(), start.sh script

### Community 32 - "Docker Packaging Verification"
Cohesion: 0.13
Nodes (14): All Acceptance Checks Status: PASSED (Manual Deployment Verification Required), Backend docker-entrypoint.sh Verification, Backend Dockerfile Verification, Backend .dockerignore Verification, Base docker-compose.yml Verification, Build Stage, Docker Packaging Verification, Frontend Dockerfile Verification (+6 more)

### Community 33 - "login"
Cohesion: 0.20
Nodes (5): login(), LoginRequest, LoginResponse, UserResponse, Config

### Community 35 - "FormControls.tsx"
Cohesion: 0.22
Nodes (4): RadioGroupProps, SelectProps, TextAreaProps, TextInputProps

### Community 36 - "reset_fixtures.sh"
Cohesion: 0.67
Nodes (3): DATABASE_URL, native_path(), reset_fixtures.sh script

### Community 37 - "prepare_settlement"
Cohesion: 0.14
Nodes (4): prepare_settlement(), SettlementRequest, SettlementResponse, SettlementRecord

### Community 38 - "FixtureReceivingRecordsAdapter"
Cohesion: 0.07
Nodes (6): FixtureReceivingRecordsAdapter, ReceivingRecordDTO, ReceivingRecordsPort, FixturePriceBookCostAdapter, PriceBookCostDTO, PriceBookCostPort

### Community 39 - "client"
Cohesion: 0.22
Nodes (5): auth_headers(), auth_token(), client(), override_get_config(), override_get_session()

### Community 40 - "tol9_deferred.py"
Cohesion: 0.16
Nodes (3): ApBatchValidationPort, ApBatchValidationResult, DeferredApBatchValidationAdapter

### Community 42 - "get_audit_trail"
Cohesion: 0.29
Nodes (3): AuditEventResponse, AuditTrailResponse, get_audit_trail()

### Community 43 - "get_queue"
Cohesion: 0.29
Nodes (3): get_queue(), QueueItemResponse, QueueListResponse

### Community 54 - "CostQueuePage.tsx"
Cohesion: 0.18
Nodes (10): queueAPI, BannerColor, BannerProps, colorMap, ChipColor, ChipProps, colorMap, QueueCounts (+2 more)

### Community 65 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, jsdom, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, @types/node, @types/react, @types/react-dom (+4 more)

### Community 68 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, preview, test, test:ui, test:watch (+1 more)

### Community 77 - "dependencies"
Cohesion: 0.50
Nodes (4): dependencies, react, react-dom, react-router-dom

## Knowledge Gaps
- **9 isolated node(s):** `cumberlands-demo-backend`, `@testing-library/user-event`, `@types/node`, `@types/react`, `@types/react-dom` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 584 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ServiceRegistry` connect `ServiceRegistry` to `prepare_settlement`, `FixtureReceivingRecordsAdapter`, `MockApQueueAckAdapter`, `ReasonCodePolicy`, `models.py`, `AuditService`, `SoDPolicy`, `create_intake_batch`, `MockApQueueSubmissionAdapter`, `cases.py`, `test_domain_policies.py`, `DeferredBoundaryRegistry`, `FixtureStatementSourceAdapter`, `LocalChargebackDocumentAdapter`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `ServiceRegistry` (e.g. with `create_review_decision()` and `create_intake_batch()`) actually correct?**
  _`ServiceRegistry` has 24 INFERRED edges - model-reasoned connections that need verification._
- **What connects `cumberlands-demo-backend`, `@testing-library/user-event`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Cumberland Farms DSD Vendor Receiving Reconciliation MVP` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Why does `User` connect `models.py` to `login`, `prepare_settlement`, `Base`, `get_audit_trail`, `get_queue`, `create_intake_batch`, `cases.py`, `common.py`, `ServiceRegistry`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `User` (e.g. with `get_audit_trail()` and `get_current_user()`) actually correct?**
  _`User` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._