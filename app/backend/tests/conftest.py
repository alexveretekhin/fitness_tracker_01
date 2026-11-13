"""Общая подготовка для тестов.

Каждый тест получает чистую базу в памяти (не трогает fitness.db)
и клиент, который ходит в API без запуска настоящего сервера.

client — уже вошедший пользователь (с токеном), anon — без входа.
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
def anon(session: Session):
    app.dependency_overrides[get_session] = lambda: session
    yield TestClient(app)
    app.dependency_overrides.clear()


def login(client: TestClient, email: str, password: str = "secret123") -> TestClient:
    """Регистрирует пользователя и кладёт его токен в заголовки клиента."""
    r = client.post("/api/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    client.headers["Authorization"] = f"Bearer {r.json()['access_token']}"
    return client


@pytest.fixture
def client(anon: TestClient):
    return login(anon, "athlete@example.com")
