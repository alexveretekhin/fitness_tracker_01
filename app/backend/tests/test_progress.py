"""Тесты серии, XP и заморозки. Запуск: uv run pytest"""

import datetime as dt

from app.progress import compute

# 2026-11-02 — понедельник
MON = dt.date(2026, 11, 2)


def days(*offsets: int) -> set[dt.date]:
    """Дни относительно понедельника MON: 0 = пн, -7 = пн прошлой недели."""
    return {MON + dt.timedelta(days=o) for o in offsets}


def test_empty():
    p = compute(set(), set(), MON)
    assert (p.xp, p.level, p.level_from, p.level_to) == (0, 1, 0, 2000)
    assert (p.streak_weeks, p.week_workouts, p.week_goal) == (0, 0, 3)


def test_xp_is_per_day():
    p = compute(days(0, 2, 4), set(), MON + dt.timedelta(days=6))
    assert p.xp == 150


def test_levels():
    def level(n):
        return compute({MON - dt.timedelta(days=i) for i in range(n)}, set(), MON).level

    assert level(39) == 1  # 1950 XP
    assert level(40) == 2  # 2000 XP
    assert level(100) == 3  # 5000 XP
    top = compute({MON - dt.timedelta(days=i) for i in range(200)}, set(), MON)
    assert (top.level, top.level_to) == (3, None)


def test_streak_counts_weeks_with_3_or_more():
    # две прошлые недели: 3 и 4 тренировки
    p = compute(days(-14, -12, -10, -7, -6, -5, -4), set(), MON)
    assert p.streak_weeks == 2


def test_week_with_2_breaks_streak():
    # позапрошлая 3 тренировки, прошлая только 2 → серия сгорела
    p = compute(days(-14, -12, -10, -7, -5), set(), MON)
    assert p.streak_weeks == 0


def test_current_week_adds_only_when_done():
    past = days(-7, -5, -3)
    assert compute(past | days(0, 2), set(), MON + dt.timedelta(days=3)).streak_weeks == 1
    p = compute(past | days(0, 2, 4), set(), MON + dt.timedelta(days=4))
    assert (p.streak_weeks, p.week_workouts) == (2, 3)


def test_frozen_week_keeps_but_does_not_add():
    # позапрошлая засчитана, прошлая пустая, но заморожена
    frozen = {MON - dt.timedelta(days=7)}
    p = compute(days(-14, -12, -10), frozen, MON)
    assert p.streak_weeks == 1


def _add_set(client, day):
    client.post(f"/api/days/{day}/exercises", json={"exercise_id": "push-ups"})
    client.post(f"/api/days/{day}/exercises/push-ups/sets", json={"weight": 0, "reps": 10})


def test_progress_api_counts_only_days_with_sets(client):
    _add_set(client, "2026-11-02")
    _add_set(client, "2026-11-02")  # второй подход в тот же день XP не добавляет
    client.post("/api/days/2026-11-03/exercises", json={"exercise_id": "squat"})  # без подходов
    p = client.get("/api/me/progress", params={"today": "2026-11-04"}).json()
    assert (p["xp"], p["week_workouts"]) == (50, 1)


def test_freeze_once_per_month(client):
    today = {"today": "2026-11-04"}
    r = client.post("/api/me/freeze", params=today)
    assert r.status_code == 200
    assert r.json()["week_frozen"] is True
    assert r.json()["freezes_left"] == 0
    assert client.post("/api/me/freeze", params=today).status_code == 409
    # через неделю, в том же месяце, заморозок не осталось
    assert client.post("/api/me/freeze", params={"today": "2026-11-11"}).status_code == 409
    # отмена возвращает заморозку
    p = client.delete("/api/me/freeze", params=today).json()
    assert (p["week_frozen"], p["freezes_left"]) == (False, 1)


def test_cannot_freeze_done_week(client):
    for d in ("2026-11-02", "2026-11-03", "2026-11-04"):
        _add_set(client, d)
    assert client.post("/api/me/freeze", params={"today": "2026-11-04"}).status_code == 409


def test_reset_clears_freezes(client):
    client.post("/api/me/freeze", params={"today": "2026-11-04"})
    client.delete("/api/days")
    p = client.get("/api/me/progress", params={"today": "2026-11-04"}).json()
    assert p["week_frozen"] is False
