"""Тесты XP и уровней. Запуск: uv run pytest"""

import datetime as dt

from app.progress import compute

MON = dt.date(2026, 11, 2)


def test_empty():
    p = compute(set())
    assert (p.xp, p.level, p.level_from, p.level_to) == (0, 1, 0, 2000)


def test_xp_is_per_day():
    p = compute({MON, MON + dt.timedelta(days=2), MON + dt.timedelta(days=4)})
    assert p.xp == 150


def test_levels():
    def level(n):
        return compute({MON - dt.timedelta(days=i) for i in range(n)}).level

    assert level(39) == 1  # 1950 XP
    assert level(40) == 2  # 2000 XP
    assert level(100) == 3  # 5000 XP
    top = compute({MON - dt.timedelta(days=i) for i in range(200)})
    assert (top.level, top.level_to) == (3, None)


def _add_set(client, day):
    client.post(f"/api/days/{day}/exercises", json={"exercise_id": "push-ups"})
    client.post(f"/api/days/{day}/exercises/push-ups/sets", json={"weight": 0, "reps": 10})


def test_progress_api_counts_only_days_with_sets(client):
    _add_set(client, "2026-11-02")
    _add_set(client, "2026-11-02")  # второй подход в тот же день XP не добавляет
    client.post("/api/days/2026-11-03/exercises", json={"exercise_id": "squat"})  # без подходов
    assert client.get("/api/me/progress").json()["xp"] == 50


def test_reset_clears_xp(client):
    _add_set(client, "2026-11-02")
    client.delete("/api/days")
    assert client.get("/api/me/progress").json()["xp"] == 0
