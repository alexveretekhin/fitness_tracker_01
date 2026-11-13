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


# ---------- Вход через Google ----------
# Настоящий Google в тестах не зовём: подменяем проверку токена.


def _fake_google(monkeypatch, info):
    monkeypatch.setattr("app.config.settings.google_client_id", "test-client-id")
    monkeypatch.setattr("app.security.read_google_token", lambda credential: info)


def test_google_off_by_default(anon):
    assert anon.get("/api/auth/config").json() == {"google_client_id": None}
    assert anon.post("/api/auth/google", json={"credential": "x"}).status_code == 503


def test_google_creates_account(anon, monkeypatch):
    _fake_google(
        monkeypatch, {"email": "Gym@Gmail.com", "email_verified": True, "given_name": "Alex"}
    )
    assert anon.get("/api/auth/config").json() == {"google_client_id": "test-client-id"}
    r = anon.post("/api/auth/google", json={"credential": "x"})
    assert r.status_code == 200
    anon.headers["Authorization"] = f"Bearer {r.json()['access_token']}"
    me = anon.get("/api/me").json()
    assert me["email"] == "gym@gmail.com" and me["name"] == "Alex"
    # Пароля у такого аккаунта нет: войти паролем нельзя
    bad = anon.post("/api/auth/login", data={"username": "gym@gmail.com", "password": ""})
    assert bad.status_code in (401, 422)


def test_google_joins_existing_account(client, monkeypatch):
    client.post(f"/api/days/{DAY}/exercises", json={"exercise_id": "push-ups"})
    _fake_google(monkeypatch, {"email": "athlete@example.com", "email_verified": True})
    token = client.post("/api/auth/google", json={"credential": "x"}).json()["access_token"]
    day = client.get(f"/api/days/{DAY}", headers={"Authorization": f"Bearer {token}"}).json()
    assert len(day["exercises"]) == 1  # тот же аккаунт, тренировки на месте


def test_google_bad_or_unverified(anon, monkeypatch):
    _fake_google(monkeypatch, None)
    assert anon.post("/api/auth/google", json={"credential": "x"}).status_code == 401
    _fake_google(monkeypatch, {"email": "a@gmail.com", "email_verified": False})
    assert anon.post("/api/auth/google", json={"credential": "x"}).status_code == 401
