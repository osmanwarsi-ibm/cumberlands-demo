#!/bin/bash
# reset_fixtures.sh — Reset fixture data while preserving seed users and deferred boundaries
set -e

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

echo "=== Resetting fixture data ==="

# Probe for Python
PYTHON=""
for c in python3 python; do
    if "$c" -c 'import sys' >/dev/null 2>&1; then PYTHON=$c; break; fi
done

if [ -z "$PYTHON" ]; then
    echo "❌ Python 3 not found. Install from https://python.org"
    exit 1
fi

# Backend directory
BACKEND_DIR="$SCRIPT_DIR/backend"
cd "$BACKEND_DIR"

# Activate venv (Windows venvs have Scripts/, macOS/Linux venvs have bin/)
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Run start.sh first to set up the environment."
    exit 1
fi

if [ -f .venv/Scripts/activate ]; then 
    source .venv/Scripts/activate
else 
    source .venv/bin/activate
fi

# Database path
DB_PATH="$BACKEND_DIR/data/reconciliation.db"
export DATABASE_URL="${DATABASE_URL:-sqlite:///$(native_path "$DB_PATH")}"

echo "  Database: $DATABASE_URL"

# Reset fixture data using Python script
python -c "
from sqlalchemy import create_engine, text
from app.db.seed import seed_database

engine = create_engine('$DATABASE_URL')

print('Truncating non-seed tables...')
with engine.connect() as conn:
    # Truncate all tables EXCEPT users and deferred_boundaries
    # Order matters: child tables first, then parent tables
    tables_to_truncate = [
        'audit_events',
        'chargeback_documents',
        'ap_queue_entries',
        'settlement_records',
        'review_decisions',
        'triage_recommendations',
        'exception_cases',
        'match_results',
        'statement_lines',
        'statement_batches',
        'receiving_records_fixture',
        'price_book_costs_fixture',
        'exception_history_fixture',
    ]
    
    for table in tables_to_truncate:
        try:
            conn.execute(text(f'DELETE FROM {table}'))
            print(f'  Truncated {table}')
        except Exception as e:
            print(f'  Warning: Could not truncate {table}: {e}')
    
    conn.commit()

print('Re-inserting fixture data...')
from sqlalchemy.orm import sessionmaker
Session = sessionmaker(bind=engine)
session = Session()

# Re-seed fixture data (seed script is idempotent and will skip users/deferred_boundaries)
seed_database(session)

session.close()
print('✓ Fixture data reset complete')
"

echo ""
echo "=== Reset complete ==="
echo "Fixture data has been reset. Users and deferred boundaries were preserved."
echo "Run start.sh to start the application with fresh fixture data."
