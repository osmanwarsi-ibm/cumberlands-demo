"""Configuration service for environment-driven settings."""
import os


class ConfigurationService:
    """Manages environment-driven configuration for pilot."""

    def __init__(self):
        """Initialize with environment variables."""
        self.app_env = os.getenv("APP_ENV", "pilot_local")
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./data/reconciliation.db")
        self.fixture_root = os.getenv("FIXTURE_ROOT", "./fixtures")
        self.triage_mode = os.getenv("TRIAGE_MODE", "MOCK")
        self.auth_stub_enabled = os.getenv("AUTH_STUB_ENABLED", "true").lower() == "true"
        self.default_batch_source = os.getenv("DEFAULT_BATCH_SOURCE", "pilot_batch_01")

    def get_database_url(self) -> str:
        """Get database URL.

        Returns:
            Database URL string (SQLite or PostgreSQL)
        """
        return self.database_url

    def is_mock_triage_mode(self) -> bool:
        """Check if triage mode is MOCK.

        Returns:
            True if MOCK mode, False otherwise
        """
        return bool(self.triage_mode.upper() == "MOCK")

    def is_auth_stub_enabled(self) -> bool:
        """Check if authentication stub is enabled.

        Returns:
            True if enabled, False otherwise
        """
        return bool(self.auth_stub_enabled)

    def get_fixture_root(self) -> str:
        """Get fixture data root directory.

        Returns:
            Fixture root path
        """
        return str(self.fixture_root)

    def get_default_batch_source(self) -> str:
        """Get default batch source identifier for smoke tests.

        Returns:
            Default batch source ID
        """
        return str(self.default_batch_source)


# Global configuration instance
config = ConfigurationService()
