"""Тесты статистики упражнения для графика. Запуск: uv run pytest"""


def _set(client, day, exercise, weight, reps):
    client.post(f"/api/days/{day}/exercises", json={"exercise_id": exercise})
    client.post(f"/api/days/{day}/exercises/{exercise}/sets", json={"weight": weight, "reps": reps})


def _stats(client, exercise, date_from="2026-10-01", date_to="2026-11-30"):
    r = client.get(f"/api/exercises/{exercise}/stats", params={"from": date_from, "to": date_to})
    assert r.status_code == 200
    return r.json()


def test_best_weight_and_volume_per_day(client):
    _set(client, "2026-11-02", "barbell-bench", 60, 10)
    _set(client, "2026-11-02", "barbell-bench", 65, 6)
    _set(client, "2026-11-04", "barbell-bench", 70, 5)
    _set(client, "2026-11-04", "squat", 100, 5)  # другое упражнение не мешает
    s = _stats(client, "barbell-bench")
    assert [p["date"] for p in s] == ["2026-11-02", "2026-11-04"]
    assert s[0] == {
        "date": "2026-11-02",
        "best_weight": 65,
        "max_reps": 10,
        "volume": 600 + 390,
        "total_reps": 16,
        "sets": 2,
    }
    assert (s[1]["best_weight"], s[1]["volume"]) == (70, 350)


def test_bodyweight_uses_reps(client):
    _set(client, "2026-11-02", "pull-ups", 0, 8)
    _set(client, "2026-11-02", "pull-ups", 0, 6)
    (p,) = _stats(client, "pull-ups")
    assert (p["best_weight"], p["max_reps"], p["total_reps"], p["volume"]) == (0, 8, 14, 0)


def test_range_and_empty_days(client):
    _set(client, "2026-09-15", "squat", 80, 5)  # раньше диапазона
    client.post("/api/days/2026-11-03/exercises", json={"exercise_id": "squat"})  # без подходов
    assert _stats(client, "squat") == []


def test_unknown_exercise(client):
    r = client.get("/api/exercises/nope/stats", params={"from": "2026-11-01", "to": "2026-11-30"})
    assert r.status_code == 404
