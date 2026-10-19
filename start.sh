#!/bin/bash
# start.sh — Start the Cumberland Farms DSD Reconciliation MVP application
set -e
trap 'echo "Shutting down..."; [ -f .pids ] && while IFS= read -r pid; do kill "$pid" 2>/dev/null || true; done < .pids; rm -f .pids; exit 0' SIGINT SIGTERM

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Convert path to native Windows format when running under Git Bash
native_path() { 
    if command -v cygpath >/dev/null 2>&1; then 
        cygpath -m "$1"
    else 
        printf '%s' "$1"
    fi
}

# Port detection (lsof on macOS/Linux, netstat under Git Bash on Windows)
port_in_use() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -iTCP:"$1" -sTCP:LISTEN -t >/dev/null 2>&1
    else
        netstat -an 2>/dev/null | grep -Eq "[:.]$1[[:space:]].*LISTEN"
    fi
}

find_available_port() {
    local port=$1
    while port_in_use "$port"; do
        echo "Port $port in use, trying $((port+1))..." >&2
        port=$((port+1))
    done
    echo $port
}

# === Prerequisite checks ===
check_prerequisites() {
    local errors=0
    echo "=== Checking prerequisites ==="

    # Python 3.11+ — probe by running it (python3 may be a Windows Store stub)
    PYTHON=""
    for c in python3 python; do
        if "$c" -c 'import sys' >/dev/null 2>&1; then PYTHON=$c; break; fi
    done
    if [ -n "$PYTHON" ]; then
        PYTHON_VERSION=$("$PYTHON" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
        if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 11 ]); then
            echo "❌ Python 3.11+ required (found $PYTHON_VERSION)"
            errors=$((errors+1))
        else
            echo "✓ Python $PYTHON_VERSION"
        fi
    else
        echo "❌ Python 3 not found. Install from https://python.org"
        errors=$((errors+1))
    fi

    # Node.js 20.19+/22.12+ (required by Vite and React tooling)
    if command -v node &>/dev/null; then
        NODE_VERSION=$(node --version | sed 's/v//')
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
        NODE_MINOR=$(echo $NODE_VERSION | cut -d. -f2)
        
        if [ "$NODE_MAJOR" -lt 20 ]; then
            echo "❌ Node.js >=20.19.0 or >=22.12.0 required (found $NODE_VERSION)"
            errors=$((errors+1))
        elif [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]; then
            echo "❌ Node.js >=20.19.0 or >=22.12.0 required (found $NODE_VERSION)"
            errors=$((errors+1))
        elif [ "$NODE_MAJOR" -eq 21 ]; then
            echo "❌ Node.js 21.x is not supported. Use >=20.19.0 or >=22.12.0 (found $NODE_VERSION)"
            errors=$((errors+1))
        elif [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]; then
            echo "❌ Node.js >=22.12.0 required (found $NODE_VERSION)"
            errors=$((errors+1))
        else
            echo "✓ Node.js $NODE_VERSION"
        fi
    else
        echo "❌ Node.js not found. Install from https://nodejs.org"
        errors=$((errors+1))
    fi

    # npm
    if ! command -v npm &>/dev/null; then
        echo "❌ npm not found"
        errors=$((errors+1))
    else
        echo "✓ npm $(npm --version)"
    fi

    # pip
    if [ -n "$PYTHON" ] && ! "$PYTHON" -m pip --version &>/dev/null; then
        echo "❌ pip not found. Run: $PYTHON -m ensurepip"
        errors=$((errors+1))
    fi

    if [ $errors -gt 0 ]; then
        echo ""
        echo "❌ $errors prerequisite(s) missing. Please install them and retry."
        exit 1
    fi
    echo ""
}

check_prerequisites

# === Backend Setup ===
echo "=== Setting up backend ==="
BACKEND_DIR="$SCRIPT_DIR/backend"
cd "$BACKEND_DIR"

# Materialize dev.env to .env if .env doesn't exist
if [ ! -f ".env" ] && [ -f "dev.env" ]; then
    echo "Creating .env from dev.env..."
    cp dev.env .env
fi

# Create venv if absent
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    "$PYTHON" -m venv .venv
fi

# Activate venv (Windows venvs have Scripts/, macOS/Linux venvs have bin/)
if [ -f .venv/Scripts/activate ]; then 
    source .venv/Scripts/activate
else 
    source .venv/bin/activate
fi

# Install backend dependencies
echo "Installing backend dependencies..."
pip install . -q

# Database setup — default to SQLite in ./data/
mkdir -p "$BACKEND_DIR/data"
DB_PATH="$BACKEND_DIR/data/reconciliation.db"
export DATABASE_URL="${DATABASE_URL:-sqlite:///$(native_path "$DB_PATH")}"
echo "  Database: $DATABASE_URL"

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Seed data if users table is empty
echo "Checking seed data..."
python -c "
from sqlalchemy import create_engine, text
from app.db.seed import seed_database

engine = create_engine('$DATABASE_URL')
with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM users')).scalar()
    if result == 0:
        print('Seeding database...')
        from sqlalchemy.orm import sessionmaker
        Session = sessionmaker(bind=engine)
        session = Session()
        seed_database(session)
        session.close()
    else:
        print('Database already seeded.')
" 2>/dev/null || echo "Seed check skipped (database may not exist yet)"

# Detect backend port and start backend
BACKEND_PORT=$(find_available_port 8000)
echo "Starting backend on http://127.0.0.1:$BACKEND_PORT"
echo "  API endpoints: http://127.0.0.1:$BACKEND_PORT/api"
uvicorn app.main:app --host 127.0.0.1 --port $BACKEND_PORT --reload &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Save backend PID
echo "$BACKEND_PID" > .pids

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 3

# === Frontend Setup ===
echo ""
echo "=== Setting up frontend ==="
FRONTEND_DIR="$SCRIPT_DIR/frontend"
cd "$FRONTEND_DIR"

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm ci

# Detect frontend port
FRONTEND_PORT=$(find_available_port 5173)

# Start frontend (BACKEND_PORT env var is read by vite.config.ts proxy)
echo "Starting frontend on http://localhost:$FRONTEND_PORT"
echo "  Login screen: http://localhost:$FRONTEND_PORT"
BACKEND_PORT="$BACKEND_PORT" npm run dev -- --port "$FRONTEND_PORT" &
FE_PID=$!
cd "$SCRIPT_DIR"

# Save frontend PID
echo "$FE_PID" >> .pids

echo ""
echo "=== Services running ==="
echo "  Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "  API:      http://127.0.0.1:$BACKEND_PORT/api"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "=== Default Pilot Users ==="
echo "  Priya Nair (AP Specialist):              p.nair"
echo "  Dana Whitfield (Price Book Analyst):     d.whitfield"
echo "  Marcus Ortiz (Inventory Control):        m.ortiz"
echo "  Helen Brooks (Vendor Relations Manager): h.brooks"
echo "  Tom Reyes (Internal Audit):              t.reyes"
echo ""
echo "  Note: Pilot stub auth uses usernames only (no password required)"
echo ""
echo "Press Ctrl+C to stop all services"
wait
