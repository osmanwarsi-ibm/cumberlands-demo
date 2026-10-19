"""FastAPI main application entry point for Cumberland Farms DSD Reconciliation MVP."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api import audit, auth, cases, health, intake, queues, reconciliation, settlement
from app.bootstrap.config import ConfigurationService
from app.db.models import Base
from app.db import seed

# Global state
engine = None
SessionLocal = None
config = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database and seed on startup."""
    global engine, SessionLocal, config

    # Load configuration
    config = ConfigurationService()

    # Create engine and session factory
    database_url = config.get_database_url()
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {},
    )

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create tables (idempotent)
    Base.metadata.create_all(bind=engine)

    # Seed data if needed (idempotent)
    seed.seed_users(SessionLocal())
    seed.seed_deferred_boundaries(SessionLocal())
    seed.seed_fixture_data(SessionLocal())
    seed.seed_statement_batch_and_lines(SessionLocal())

    yield

    # Cleanup
    if engine:
        engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="Cumberland Farms DSD Reconciliation API",
    description="Pilot API for vendor receiving reconciliation with deterministic matching and AI-assisted triage",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers under /api prefix
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(intake.router, prefix="/api", tags=["intake"])
app.include_router(reconciliation.router, prefix="/api", tags=["reconciliation"])
app.include_router(queues.router, prefix="/api", tags=["queues"])
app.include_router(cases.router, prefix="/api", tags=["cases"])
app.include_router(settlement.router, prefix="/api", tags=["settlement"])
app.include_router(audit.router, prefix="/api", tags=["audit"])
app.include_router(health.router, tags=["health"])
