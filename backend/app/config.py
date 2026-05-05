import os

from pydantic_settings import BaseSettings


def _default_db_url() -> str:
    if os.path.isdir("/data"):
        return "sqlite+aiosqlite:////data/app.db"
    return "sqlite+aiosqlite:///./talkie.db"


class Settings(BaseSettings):
    database_url: str = _default_db_url()
    gemini_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
