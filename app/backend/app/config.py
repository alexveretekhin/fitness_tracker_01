"""Настройки приложения.

pydantic-settings читает значения из переменных окружения и файла .env.
Так секреты и адрес базы не хранятся в коде.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # SQLite: база в одном файле fitness.db рядом с кодом. Позже сменим на PostgreSQL.
    database_url: str = "sqlite:///./fitness.db"
    # С каких адресов браузеру разрешено обращаться к API (фронтенд на Vite)
    cors_origins: list[str] = ["http://localhost:5173"]
    # Секрет, которым сервер подписывает токены входа. Для разработки годится
    # значение по умолчанию, на настоящем сервере обязательно своё в .env:
    #   uv run python -c "import secrets; print(secrets.token_urlsafe(32))"
    jwt_secret: str = "dev-secret-change-me-in-env-file-please"
    # Сколько дней токен действует, потом придётся войти заново
    token_days: int = 30


settings = Settings()
