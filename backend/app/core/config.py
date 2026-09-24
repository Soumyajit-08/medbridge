"""
app/core/config.py
──────────────────────────────────────────────────────────────────────────────
Application configuration using Pydantic BaseSettings.

HOW IT WORKS:
  1. Pydantic reads the `.env` file from the backend root directory.
  2. Each field below maps to an environment variable.
  3. If a required variable is missing, the app FAILS TO START with a clear error.
  4. Every other file imports `settings` from here. No file ever reads
     os.environ directly.

USAGE IN OTHER FILES:
  from app.core.config import settings
  db_url = settings.DATABASE_URL
  secret = settings.JWT_ACCESS_SECRET

WHY PYDANTIC SETTINGS?
  - Type validation: DATABASE_URL must be a string, PORT must be an int.
  - Default values: sensible defaults for optional settings.
  - IDE autocomplete: you can see all settings with type hints.
  - Testable: you can override settings in tests easily.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List
from functools import lru_cache
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """
    All application configuration lives here.
    Field names must match environment variable names exactly (case-insensitive).
    """

    # ── Application ───────────────────────────────────────────────────────────
    APP_NAME: str = "MedBridge"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000

    # ── Security ──────────────────────────────────────────────────────────────
    JWT_ACCESS_SECRET: str = "medbridge-super-secret-jwt-access-key-2024-secure"
    JWT_REFRESH_SECRET: str = "medbridge-super-secret-jwt-refresh-key-2024-secure"
    JWT_ACCESS_EXPIRES_MINUTES: int = 15
    JWT_REFRESH_EXPIRES_DAYS: int = 30

    # ── Database (MongoDB) ────────────────────────────────────────────────────
    MONGODB_URL: str = "mongodb+srv://soumyajitnag2021_db_user:Soumyajit_2021@cluster0.7ef5lug.mongodb.net/?appName=Cluster0"
    MONGODB_DB_NAME: str = "medbridge"
    DATABASE_URL: str = ""

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = ""

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Store as a plain string in .env: CORS_ORIGINS=http://localhost:5173,http://localhost:3000
    # A validator below converts it to a list.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, list):
            return ",".join(v)
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into a list for use in CORS middleware."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # ── SMTP Email ────────────────────────────────────────────────────────────
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "MedBridge <noreply@medbridge.app>"
    SMTP_TLS: bool = False

    # ── File Storage ──────────────────────────────────────────────────────────
    STORAGE_BACKEND: str = "local"   # "local" or "s3"
    STORAGE_ENDPOINT: str = ""
    STORAGE_BUCKET: str = "medbridge-uploads"
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_REGION: str = "ap-south-1"

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60

    # ── File Upload ───────────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_UPLOAD_EXTENSIONS: str = "pdf,jpg,jpeg,png"

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_UPLOAD_EXTENSIONS.split(",") if ext.strip()]

    # ── Pydantic Settings Config ───────────────────────────────────────────────
    model_config = SettingsConfigDict(
        # Look for .env in the backend/ root directory
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        # Allow "CORS_ORIGINS=a,b,c" to be parsed as a list
        env_parse_none_str="None",
        extra="ignore",  # Ignore unknown env vars gracefully
    )

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.

    Why @lru_cache?
    Reading from disk and parsing env vars takes a small amount of time.
    By caching, we only do this ONCE when the app starts, not on every request.

    In tests, you can override this:
        app.dependency_overrides[get_settings] = lambda: Settings(...)
    """
    return Settings()


# Module-level singleton for direct imports
# Usage: from app.core.config import settings
settings = get_settings()
