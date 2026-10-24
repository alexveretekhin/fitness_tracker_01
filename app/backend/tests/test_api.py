"""Тесты API. Запуск: uv run pytest"""

DAY = "2026-10-24"


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_muscle_groups_in_order(client):
    ids = [g["id"] for g in client.get("/api/muscle-groups").json()]
    assert ids[:3] == ["neck", "shoulders", "chest"]
    assert len(ids) == 9


def test_group_exercises_only_primary(client):
    chest = client.get("/api/muscle-groups/chest/exercises").json()
    names = {e["name"] for e in chest}
    assert "Push-ups" in names
    # Dips нагружают грудь только как вспомогательную мышцу, в списке груди их нет
    assert "Dips" not in names


def test_unknown_group_404(client):
    assert client.get("/api/muscle-groups/wings/exercises").status_code == 404


def test_search(client):
    names = [e["name"] for e in client.get("/api/exercises", params={"q": "bench"}).json()]
    assert names == ["Barbell bench", "Dumbbell bench"]


def test_empty_day(client):
    assert client.get(f"/api/days/{DAY}").json() == {"date": DAY, "done": False, "exercises": []}


def test_add_log_and_flame(client):
    # Добавили упражнение: огонёк ещё не горит
    r = client.post(f"/api/days/{DAY}/exercises", json={"exercise_id": "push-ups"})
    assert r.status_code == 201
    assert r.json()["done"] is False

    # Повторное добавление не создаёт дубль
    r = client.post(f"/api/days/{DAY}/exercises", json={"exercise_id": "push-ups"})
    assert len(r.json()["exercises"]) == 1

    # Записали подходы: огонёк загорается
    r = client.put(f"/api/days/{DAY}/exercises/push-ups", json={"weight": 0, "sets": 3, "reps": 15})
    assert r.json()["done"] is True
    assert r.json()["exercises"][0]["reps"] == 15

    summary = client.get("/api/days", params={"from": "2026-10-20", "to": "2026-10-28"}).json()
    assert summary == [{"date": DAY, "done": True, "count": 1}]


def test_days_without_logs_are_not_done(client):
    client.post(f"/api/days/{DAY}/exercises", json={"exercise_id": "squat"})
    summary = client.get("/api/days", params={"from": DAY, "to": DAY}).json()
    assert summary == [{"date": DAY, "done": False, "count": 1}]


def test_remove_exercise(client):
    client.post(f"/api/days/{DAY}/exercises", json={"exercise_id": "squat"})
    r = client.delete(f"/api/days/{DAY}/exercises/squat")
    assert r.json()["exercises"] == []
    assert client.delete(f"/api/days/{DAY}/exercises/squat").status_code == 404


def test_validation(client):
    client.post(f"/api/days/{DAY}/exercises", json={"exercise_id": "squat"})
    r = client.put(f"/api/days/{DAY}/exercises/squat", json={"weight": -5, "sets": 3, "reps": 10})
    assert r.status_code == 422
    r = client.post(f"/api/days/{DAY}/exercises", json={"exercise_id": "nope"})
    assert r.status_code == 404


def test_avatar(client):
    assert client.get("/api/me").json()["avatar"] is None
    assert client.put("/api/me", json={"avatar": "female"}).json()["avatar"] == "female"
    assert client.put("/api/me", json={"avatar": "robot"}).status_code == 422
