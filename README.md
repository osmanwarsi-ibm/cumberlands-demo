# Cumberland Farms DSD Vendor Receiving Reconciliation MVP

A pilot application demonstrating focused, controls-aware reconciliation workflow for direct-store-delivery vendor receiving reconciliation.

## Overview

This MVP implements the following core capabilities:
- **Statement Ingestion (AGN1)**: Fixture-backed vendor statement intake with validation and normalization
- **Deterministic Three-Way Matching (AGN2)**: Automated reconciliation across statement, receipt, and invoice records
- **AI-Assisted Exception Triage (AGN4)**: Confidence-scored recommendations for reviewable exceptions
- **Settlement Preparation (AGN5)**: Settlement-ready outcome generation and mocked AP queue submission
- **Human Review Workflows**: Role-oriented exception review with segregation-of-duties enforcement
- **Audit Trail**: End-to-end case history capture with immutable audit events

## Architecture

### Repository Structure

```
cumberlands-demo/
├── backend/               # FastAPI backend application
│   ├── app/
│   │   ├── api/          # REST API endpoints
│   │   ├── application/  # Application orchestration services
│   │   ├── domain/       # Domain policies and business rules
│   │   ├── adapters/     # MCP tool adapters and persistence
│   │   ├── db/           # Database models, migrations, and seed data
│   │   └── bootstrap/    # Configuration and startup initialization
│   ├── alembic/          # Database migration scripts
│   ├── tests/            # Backend test suite
│   └── pyproject.toml    # Python dependencies and configuration
├── frontend/              # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── pages/        # Page components (login, queues, case detail, etc.)
│   │   ├── components/   # Reusable UI components
│   │   ├── api/          # API client for backend endpoints
│   │   ├── state/        # Authentication state management
│   │   ├── types/        # TypeScript type definitions
│   │   └── styles/       # Global CSS and design system
│   ├── tests/            # Frontend test suite
│   └── package.json      # npm dependencies and scripts
├── start.sh              # Local development startup script (cross-platform)
├── stop.sh               # Local development shutdown script
├── start.bat             # Windows wrapper (runs start.sh via Git Bash)
├── stop.bat              # Windows wrapper (runs stop.sh via Git Bash)
├── reset_fixtures.sh     # Fixture data reset script
└── docker-compose.yml    # Container orchestration configuration
```

### Tech Stack

- **Backend**: FastAPI (Python 3.11+), SQLAlchemy (sync), Alembic
- **Frontend**: React 18+, TypeScript, Vite, React Router v6
- **Database**: SQLite (default), PostgreSQL (optional via Docker override)
- **Testing**: pytest (backend), vitest (frontend)

## Setup

### Prerequisites

- **Node.js**: ≥20.19.0 or ≥22.12.0 (required by Vite and React tooling)
  - Node.js 21.x is not supported
- **Python**: ≥3.11
- **Git**: For cloning the repository
- **Git Bash** (Windows only): Required for running startup scripts on Windows
- Optional: **Docker** and **Docker Compose** for containerized deployment

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd cumberlands-demo
   ```

2. Run the startup script:
   
   **On macOS/Linux:**
   ```bash
   bash start.sh
   ```
   
   **On Windows (with Git Bash installed):**
   ```cmd
   start.bat
   ```
   
   Or directly:
   ```bash
   bash start.sh
   ```

   The script will automatically:
   - Check prerequisites (Node.js ≥20.19 or ≥22.12, Python ≥3.11)
   - Create Python virtual environment in `backend/.venv` if not present
   - Install backend dependencies (`pip install .`)
   - Install frontend dependencies (`npm ci`)
   - Initialize SQLite database schema (`alembic upgrade head`)
   - Seed pilot users and fixture data if users table is empty
   - Detect available backend port (default 8000, auto-increment if occupied)
   - Start backend server: `uvicorn app.main:app --host 127.0.0.1 --port $BACKEND_PORT --reload`
   - Detect available frontend port (default 5173, auto-increment if occupied)
   - Configure Vite proxy to forward `/api` requests to backend
   - Start frontend dev server: `npm run dev --port $FRONTEND_PORT`

3. Access the application:
   - **Frontend Login Screen**: `http://localhost:5173` (or detected port)
   - **Backend API**: `http://localhost:8000` (or detected port)
   - **OpenAPI docs**: `http://localhost:8000/docs`

## Run

### Local Development

**Start both backend and frontend:**

macOS/Linux:
```bash
bash start.sh
```

Windows:
```cmd
start.bat
```

The script prints the detected ports and default pilot user credentials on startup.

**Stop services gracefully:**

macOS/Linux:
```bash
bash stop.sh
```

Windows:
```cmd
stop.bat
```

The stop script only terminates processes started by `start.sh` (using `.pids` file) and never kills unrelated processes.

**Restart with fresh database:**

If you need to completely reset and reseed the database:
```bash
rm -rf backend/data/reconciliation.db
bash start.sh
```

### Docker Compose

**Prerequisites**: Docker and Docker Compose must be installed on your system.

#### SQLite Mode (Default)
```bash
docker-compose up --build
```

Frontend accessible at: `http://localhost:80`

The base configuration uses SQLite with a persistent volume (`data:/data`) mounted at `/data` in the backend container. The SQLite database file is created at `/data/app.db` with the environment variable `DATABASE_URL=sqlite:////data/app.db`.

To stop:
```bash
docker-compose down
```

To stop and remove volumes (deletes SQLite data):
```bash
docker-compose down -v
```

#### PostgreSQL Mode (Optional)
```bash
docker-compose -f docker-compose.yml -f docker-compose.postgres.yml up --build
```

This configuration:
- Adds a PostgreSQL 16 Alpine container with pinned image tag
- Backend connects to PostgreSQL instead of SQLite using `DATABASE_URL=postgresql+psycopg://...`
- Backend build includes `psycopg[binary]>=3.2` driver via `PIP_TARGET=".[postgres]"` build arg
- PostgreSQL data persisted in `postgres_data` volume

To stop:
```bash
docker-compose -f docker-compose.yml -f docker-compose.postgres.yml down
```

**Note**: The base `docker-compose.yml` is designed for zero-config local validation and preview environments. The PostgreSQL override is optional for production-like testing.

## Environment Variables

### Backend (`backend/.env`)

The backend reads from `backend/.env` if present, or falls back to defaults. Copy `backend/.env.example` to `backend/.env` and customize as needed.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `sqlite:///./data/reconciliation.db` | Database connection string. For PostgreSQL: `postgresql+psycopg://user:pass@host:5432/dbname` |
| `APP_ENV` | No | `pilot_local` | Application environment identifier |
| `FIXTURE_ROOT` | No | `./fixtures` | Root directory for fixture data files |
| `TRIAGE_MODE` | No | `MOCK` | AI triage mode: `MOCK` (default) or `LLM` |
| `TRIAGE_PROVIDER_API_KEY` | No* | - | API key for LLM triage provider (*required only when `TRIAGE_MODE=LLM`) |
| `AUTH_STUB_ENABLED` | No | `true` | Enable authentication stub for pilot (username-only login) |
| `DEFAULT_BATCH_SOURCE` | No | `pilot_batch_01` | Default batch source identifier for smoke tests |

### Frontend (`frontend/.env`)

The frontend reads from `frontend/.env` if present, or falls back to defaults. Typically no customization needed for local development.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `/api` | API base URL. Uses relative path `/api` which is proxied to backend in dev mode and forwarded by nginx in Docker |

**Note**: The frontend uses a relative `/api` path by default. The Vite dev server proxies `/api` requests to the backend based on the `BACKEND_PORT` environment variable set by `start.sh`. No manual configuration needed for same-origin API access.

## Seed Credentials

The pilot includes five seeded users matching the login screen personas:

| Username | Role | Description | Can Work | Cannot Do |
|----------|------|-------------|----------|-----------|
| `p.nair` | AP Specialist | Statement intake, AP queue management, settlement preparation | Cost queue, Quantity queue, AP queue, Settlement preparation | Cannot approve cost/quantity exceptions, Cannot prepare settlements they approved |
| `d.whitfield` | Price Book Analyst | Cost exception review and approval | Cost queue only | Cannot work quantity queue, Cannot post AP transactions |
| `m.ortiz` | Inventory Control Analyst | Quantity exception and unmatched case review | Quantity queue only | Cannot work cost queue, Cannot post AP transactions |
| `h.brooks` | Vendor Relations Manager | Vendor follow-up and chargeback support | Vendor follow-up only | Cannot work any review queues |
| `t.reyes` | Internal Audit | Audit trail review and compliance oversight | Audit trace only | Cannot make review decisions |

**Authentication**: This is a pilot MVP with simplified stub authentication. No passwords are required; users are selected directly from the login screen.

## Test

### Backend Tests

Run all backend tests with pytest:
```bash
cd backend
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pytest --junitxml=test-results.xml
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html --cov-report=term
```

### Frontend Tests

Run all frontend tests with vitest:
```bash
cd frontend
npx vitest --run --reporter=junit --outputFile=test-results.xml
```

Run with coverage:
```bash
npx vitest --run --coverage
```

Run in watch mode (for development):
```bash
npx vitest
```

### Linting and Type Checking

**Backend:**
```bash
cd backend
source .venv/bin/activate
ruff check app/           # Linting
mypy app/                 # Type checking
```

**Frontend:**
```bash
cd frontend
npm run typecheck         # TypeScript type checking
```

## Reset Fixtures

To reset fixture data while preserving pilot users and deferred boundaries:

```bash
bash reset_fixtures.sh
```

This script:
- Truncates non-seed tables (statement batches, match results, exception cases, settlements, AP queue entries, audit events)
- Preserves `users` table (5 pilot users)
- Preserves `deferred_boundaries` table (AGN3, AGN6, TOL9, TOL10 contracts)
- Re-inserts fixture data (50+ statement lines, receiving records, price book costs, exception history)
- Completes within 10 minutes for pilot data volumes

Use this when:
- You need repeatable demonstration data
- Test runs have modified case states
- You want to start fresh without recreating users

## Deployment

### Docker Compose (Base - SQLite)

The base `docker-compose.yml` uses SQLite and requires no external database server:

```bash
docker-compose up --build -d
```

Access:
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

To stop:
```bash
docker-compose down
```

### Docker Compose with PostgreSQL (Optional)

For production-like testing with PostgreSQL:

```bash
docker-compose -f docker-compose.yml -f docker-compose.postgres.yml up --build -d
```

This configuration adds:
- PostgreSQL 16 container with pinned image
- Backend configured to connect to PostgreSQL
- Backend build includes `psycopg[binary]` driver via `[postgres]` extras

To stop:
```bash
docker-compose -f docker-compose.yml -f docker-compose.postgres.yml down
```

### Container Details

**Backend Dockerfile:**
- Multi-stage build
- Python 3.11+ base image
- Installs dependencies from `pyproject.toml`
- Runs migrations and seed via `docker-entrypoint.sh`
- Starts with: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

**Frontend Dockerfile:**
- Multi-stage build: Node build stage + nginx runtime stage
- Build stage: Installs deps, runs `npm run build`
- Runtime stage: nginx serving static files from `/usr/share/nginx/html`
- nginx configured to proxy `/api` to backend service
- Exposes port 80

## Scope Boundaries

### Implemented in MVP
- **AGN1**: Statement Ingestion Agent with validation and normalization
- **AGN2**: Three-Way Match Engine with deterministic tolerance rules
- **AGN4**: Exception Triage Agent with confidence scoring and manual routing
- **AGN5**: Settlement Posting Agent with AP queue submission
- **UI Flows**: Login, statement intake, batch results, cost/quantity queues, case detail pages, AP queue, audit trace, vendor follow-up
- **Role-based Access**: Queue-to-role alignment and segregation-of-duties enforcement
- **Audit Trail**: Immutable audit event capture for all lifecycle transitions
- **Fixture Adapters**: TOL1-TOL8 MCP tool adapters backed by local fixture tables

### Explicitly Deferred (Out of Scope)
- **BL-021**: AGN3 Unposted Receipt Monitor (interface preserved in `deferred_boundaries` table, not executed in MVP workflows)
- **BL-022**: AGN6 Reconciliation Monitor and control-tower analytics (interface preserved, not executed)
- **BL-023**: Live enterprise integrations
  - BOS/PDI (receiving records and store context)
  - Oracle AP (invoice context and AP queue writes)
  - Microsoft 365/Mimecast (email-based statement intake)
  - EDI Gateway/VAN (EDI 810 invoice intake)
  - Production deployment hardening (secrets management, load balancing, monitoring)
- **BL-024**: Extended capabilities
  - Analytics dashboards (TOL10 preserved but not invoked)
  - Email notifications (TOL9 preserved but not invoked)
  - Vendor self-service portal
  - Admin user-management consoles

**Deferred boundaries** are registered in the `deferred_boundaries` database table with `status=DEFERRED` and can be activated in future phases without architectural redesign.

## Business Rules

### Matching Tolerance Rules
- **Quantity Tolerance (VR-003)**: Variance must exceed **BOTH** 2 units **AND** 2% relative threshold to qualify as quantity exception
- **Cost Tolerance (VR-004)**: Per-unit variance exceeding **$0.05** qualifies as cost exception

### Classification Rules (VR-005)
Five mutually exclusive outcome classes:
1. **Full Match**: Quantity and cost within tolerance → settlement-eligible immediately
2. **Cost Exception**: Cost variance exceeds threshold → route to Price Book Analyst
3. **Quantity Exception**: Quantity variance exceeds threshold → route to Inventory Control Analyst
4. **Unmatched Statement**: Statement line with no receiving record → route based on context
5. **Unmatched Receipt**: Receipt with no matching statement → route based on context

### Confidence Model (VR-008, VR-009)
- **GREEN**: Confidence ≥85% (high-context cases)
- **AMBER**: Confidence 60-84% (moderate-context cases, require human approval)
- **RED**: Confidence <60% (low-context cases, require human approval)
- **NONE**: No recommendation (manual routing due to insufficient context)

**Confidence Penalties:**
- Missing receiving record: -25 points
- Missing price book cost: -20 points
- Missing exception history: -10 points
- Missing delivery doc or date: -10 points

**Mandatory Manual Review**: Cases with **more than 2 missing context elements** (`missing_context_count > 2`) route directly to manual review with no AI recommendation.

### Segregation of Duties (VR-011)
- AP Specialists cannot approve exceptions in their own ingested batches
- Preparers cannot post settlements for cases they approved
- All SoD violations are blocked (403 response) and logged in audit events

### Reason Code Validation (VR-012)
Approved pilot reason codes:
- **PC-02**: Supplier price change effective date
- **PC-05**: Price promotion or temporary discount
- **QC-03**: Delivery shortage versus order quantity
- **QC-06**: Receiving count discrepancy
- **UC-01**: Invoice not yet posted
- **UC-02**: Receipt not yet recorded

All review decisions must include an approved reason code and rationale note.

## Performance Targets

- **Statement ingestion**: ≤30 seconds for 50 lines
- **Deterministic match**: ≤60 seconds for 50 lines
- **Queue screen load**: ≤3 seconds for 150 items
- **Case detail load**: ≤2 seconds for 95% of interactions
- **Local availability**: 99% during scheduled demonstrations

## Troubleshooting

### Startup Issues

**"Python 3.11+ required"**
- Install Python 3.11 or later from https://python.org
- Verify: `python --version` or `python3 --version`

**"Node.js >=20.19.0 or >=22.12.0 required"**
- Install Node.js from https://nodejs.org (LTS recommended)
- Avoid Node.js 21.x (not supported by Vite)
- Verify: `node --version`

**"Port 8000/5173 already in use"**
- The start script auto-detects available ports and increments if occupied
- Check output for actual ports: "Starting backend on http://localhost:XXXX"

**"Database migration failed"**
- Delete the database file: `rm -rf backend/data/reconciliation.db`
- Run `bash start.sh` again to recreate

### Runtime Issues

**"Unable to connect to backend API"**
- Verify backend is running: check console output for "Starting backend..."
- Check backend health: `curl http://localhost:8000/health`
- Verify proxy configuration in `frontend/vite.config.ts`

**"Login screen not loading"**
- Check frontend is running: `http://localhost:5173` (or detected port)
- Check browser console for JavaScript errors
- Verify npm dependencies installed: `cd frontend && npm ci`

**"Cannot stop services"**
- If `stop.sh` fails, check `.pids` file exists: `cat .pids`
- Manually kill processes if needed: `kill <PID>`
- Never use `pkill` or `killall` as it may affect other processes

## Support

For issues, feature requests, or questions about this pilot MVP, please contact the project team.

---

**Pilot Build** · Fixture data only · Vendor, item, and user names are fictional.
