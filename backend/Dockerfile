# Multi-stage Dockerfile for Cumberland Farms DSD Reconciliation MVP Backend
# Stage 1: Base image with Python 3.11
FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifest
COPY pyproject.toml ./

# Install dependencies
# Use build arg to allow installing with optional postgres extras
ARG INSTALL_SPEC="."
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir "$INSTALL_SPEC"

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Create data directory
RUN mkdir -p /data && chmod 777 /data

# Expose backend port
EXPOSE 8000

# Set entrypoint to run migrations and seed
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]

# Default command to start uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
