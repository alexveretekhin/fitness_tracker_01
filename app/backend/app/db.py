"""Подключение к базе данных."""

from collections.abc import Iterator

from sqlmodel import Session, create_engine

from app.config import settings

# check_same_thread=False нужен только для SQLite: FastAPI обрабатывает
# запросы в разных потоках, а SQLite по умолчанию это запрещает.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)


def get_session() -> Iterator[Session]:
    """Отдаёт сессию базы на время одного запроса и закрывает её после."""
    with Session(engine) as session:
        yield session
