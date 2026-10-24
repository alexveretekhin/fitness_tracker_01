"""Общая подготовка для тестов.

Каждый тест получает чистую базу в памяти (не трогает fitness.db)
и клиент, который ходит в API без запуска настоящего сервера.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.db import get_session
from app.main import app
from app.seed import seed


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # одна и та же база в памяти для всех соединений
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        seed(s)
        yield s


@pytest.fixture
def client(session: Session):
    app.dependency_overrides[get_session] = lambda: session
    yield TestClient(app)
    app.dependency_overrides.clear()
