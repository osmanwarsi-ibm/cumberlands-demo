"""Health check API endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.common import HealthResponse
from app.api.deps import get_config, get_session
from app.bootstrap.config import ConfigurationService
from app.db.models import ReceivingRecordFixture, User


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(
    session: Session = Depends(get_session),
    config: ConfigurationService = Depends(get_config)
):
    """Health check endpoint.

    Returns:
        HealthResponse with status, database reachability, fixtures loaded status, and triage mode
    """
    # Check SQLite reachability
    try:
        session.execute(text("SELECT 1"))
        sqlite_status = "reachable"
    except Exception:
        sqlite_status = "unreachable"

    # Check if fixtures are loaded
    fixtures_loaded = False
    try:
        user_count = session.query(User).count()
        fixture_count = session.query(ReceivingRecordFixture).count()
        fixtures_loaded = user_count >= 5 and fixture_count > 0
    except Exception:
        fixtures_loaded = False

    return HealthResponse(
        status="ok",
        sqlite=sqlite_status,
        fixtures_loaded=fixtures_loaded,
        triage_mode=config.triage_mode
    )
