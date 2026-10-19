#!/bin/sh
set -e

echo "Running Alembic migrations..."
alembic upgrade head

echo "Seeding database if needed..."
python -m app.db.seed

echo "Starting application..."
exec "$@"
