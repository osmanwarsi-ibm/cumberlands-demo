"""Pytest fixtures for integration tests."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.models import Base
from app.db import seed
from app.main import app
from app.api.deps import get_session, get_config
from app.bootstrap.config import ConfigurationService


# Test database URL
TEST_DATABASE_URL = "sqlite:///./test_reconciliation.db"


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh test database for each test."""
    # Create engine
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session factory
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Seed data
    with TestSessionLocal() as session:
        seed.seed_users(session)
        seed.seed_deferred_boundaries(session)
        seed.seed_fixture_data(session)
        seed.seed_statement_batch_and_lines(session)
        session.commit()
    
    yield TestSessionLocal
    
    # Drop all tables after test
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client with test database."""
    def override_get_session():
        session = test_db()
        try:
            yield session
        finally:
            session.close()
    
    def override_get_config():
        return ConfigurationService()
    
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_config] = override_get_config
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def auth_token(client, test_db):
    """Get authentication token for test user (Priya Nair - AP Specialist)."""
    response = client.post("/api/auth/login", json={"username": "p.nair"})
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    """Get authorization headers with test token."""
    return {"Authorization": f"Bearer {auth_token}"}
