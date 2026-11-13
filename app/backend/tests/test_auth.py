"""Тесты аккаунтов: регистрация, вход, чужие данные не видны."""

import datetime as dt

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.main import app
from app.models import User, WorkoutDay
from tests.conftest import login

DAY = "2026-10-24"


def test_without_token_401(anon):
    assert anon.get("/api/me").status_code == 401
    assert anon.get(f"/api/days/{DAY}").status_code == 401


def test_catalog_is_public(anon):
    assert anon.get("/api/muscle-groups").status_code == 200


def test_register_and_me(anon):
    login(anon, "New@Example.com")
    me = anon.get("/api/me").json()
    assert me["email"] == "new@example.com"  # почта приводится к нижнему регистру
    assert me["name"] == "new"
    assert me["avatar"] is None


def test_password_is_hashed(anon, session: Session):
    login(anon, "a@example.com", "secret123")
    user = session.get(User, 1)
    assert user.password_hash and "secret123" not in user.password_hash


def test_duplicate_email_409(anon):
    login(anon, "a@example.com")
    r = anon.post("/api/auth/register", json={"email": "A@example.com", "password": "12345678"})
    assert r.status_code == 409


def test_bad_input_422(anon):
    assert (
        anon.post("/api/auth/register", json={"email": "nope", "password": "12345678"}).status_code
        == 422
    )
    assert (
        anon.post("/api/auth/register", json={"email": "a@b.co", "password": "short"}).status_code
        == 422
    )


def test_login(anon):
    login(anon, "a@example.com", "secret123")
    ok = anon.post("/api/auth/login", data={"username": "A@example.com", "password": "secret123"})
    assert ok.status_code == 200 and ok.json()["token_type"] == "bearer"
    bad = anon.post("/api/auth/login", data={"username": "a@example.com", "password": "wrong!!!"})
    assert bad.status_code == 401
    nobody = anon.post("/api/auth/login", data={"username": "x@example.com", "password": "x"})
    assert nobody.status_code == 401


def test_garbage_token_401(anon):
    anon.headers["Authorization"] = "Bearer not-a-token"
    assert anon.get("/api/me").status_code == 401


def test_users_see_only_their_data(client, session: Session):
    client.post(f"/api/days/{DAY}/exercises", json={"exercise_id": "push-ups"})
    client.post(f"/api/days/{DAY}/exercises/push-ups/sets", json={"weight": 0, "reps": 10})

    other = login(TestClient(app), "other@example.com")
    assert other.get(f"/api/days/{DAY}").json()["exercises"] == []
    assert other.get("/api/me/progress").json()["xp"] == 0
    # Сброс у другого не трогает тренировки первого
    other.delete("/api/days")
    assert client.get(f"/api/days/{DAY}").json()["done"] is True


def test_old_default_user_is_not_reachable(anon, session: Session):
    """Пользователь до этапа 6 (без почты) остаётся в базе, но войти в него нельзя."""
    old = User()
    session.add(old)
    session.commit()
    session.add(WorkoutDay(user_id=old.id, date=dt.date(2026, 10, 24)))
    session.commit()
    login(anon, "fresh@example.com")
    assert anon.get(f"/api/days/{DAY}").json()["exercises"] == []
