"""Тесты рекордов: таблица по повторам и кубки. Запуск: uv run pytest"""


def _set(client, day, exercise, weight, reps):
    client.post(f"/api/days/{day}/exercises", json={"exercise_id": exercise})
    r = client.post(
        f"/api/days/{day}/exercises/{exercise}/sets", json={"weight": weight, "reps": reps}
    )
    return r.json()


def _records(client, exercise):
    r = client.get(f"/api/exercises/{exercise}/records")
    assert r.status_code == 200
    return r.json()


def _flags(day_json, exercise):
    (e,) = [e for e in day_json["exercises"] if e["exercise_id"] == exercise]
    return [s["record"] for s in e["sets"]]


def test_rep_table_counts_sets_with_more_reps(client):
    _set(client, "2026-11-01", "barbell-bench", 40, 1)
    _set(client, "2026-11-02", "barbell-bench", 30, 5)  # годится и для 1, и для 3 повторов
    _set(client, "2026-11-03", "barbell-bench", 20, 10)
    _set(client, "2026-11-04", "barbell-bench", 30, 6)  # тот же вес позже: дата остаётся первой
    rec = _records(client, "barbell-bench")
    assert [(r["reps"], r["weight"], r["date"]) for r in rec["by_reps"]] == [
        (1, 40, "2026-11-01"),
        (3, 30, "2026-11-02"),
        (5, 30, "2026-11-02"),
        (8, 20, "2026-11-03"),
        (10, 20, "2026-11-03"),
    ]
    assert rec["bodyweight"] is None


def test_rep_table_skips_rows_without_sets(client):
    _set(client, "2026-11-01", "squat", 80, 5)
    rec = _records(client, "squat")
    assert [r["reps"] for r in rec["by_reps"]] == [1, 3, 5]


def test_bodyweight_record(client):
    _set(client, "2026-11-01", "pull-ups", 0, 8)
    _set(client, "2026-11-02", "pull-ups", 0, 12)
    rec = _records(client, "pull-ups")
    assert rec["by_reps"] == []
    assert rec["bodyweight"] == {"reps": 12, "weight": 0, "date": "2026-11-02"}


def test_records_unknown_exercise(client):
    assert client.get("/api/exercises/nope/records").status_code == 404


def test_first_day_is_not_a_record(client):
    day = _set(client, "2026-11-01", "barbell-bench", 60, 10)
    assert _flags(day, "barbell-bench") == [False]


def test_record_is_best_set_of_day_that_beats_past_days(client):
    _set(client, "2026-11-01", "barbell-bench", 60, 5)  # e1RM 70
    _set(client, "2026-11-03", "barbell-bench", 50, 5)  # разминка, слабее
    _set(client, "2026-11-03", "barbell-bench", 65, 5)  # 75,8 — рекорд
    day = _set(client, "2026-11-03", "barbell-bench", 66, 5)  # 77 — ещё лучше, кубок переходит
    assert _flags(day, "barbell-bench") == [False, False, True]
    # В сводке дней кубок посчитан
    summary = client.get("/api/days", params={"from": "2026-11-01", "to": "2026-11-30"}).json()
    assert {d["date"]: d["records"] for d in summary} == {"2026-11-03": 1, "2026-11-01": 0}


def test_equal_to_past_best_is_not_a_record(client):
    _set(client, "2026-11-01", "squat", 100, 5)
    day = _set(client, "2026-11-02", "squat", 100, 5)
    assert _flags(day, "squat") == [False]


def test_heavy_single_vs_light_sets_uses_e1rm(client):
    _set(client, "2026-11-01", "barbell-bench", 40, 1)  # 40
    day = _set(client, "2026-11-02", "barbell-bench", 20, 10)  # 26,7 — не рекорд
    assert _flags(day, "barbell-bench") == [False]
    day = _set(client, "2026-11-03", "barbell-bench", 35, 5)  # 40,8 — рекорд
    assert _flags(day, "barbell-bench") == [True]


def test_bodyweight_records_by_reps(client):
    _set(client, "2026-11-01", "pull-ups", 0, 8)
    day = _set(client, "2026-11-02", "pull-ups", 0, 9)
    assert _flags(day, "pull-ups") == [True]


def test_exercises_are_separate(client):
    _set(client, "2026-11-01", "squat", 100, 5)
    day = _set(client, "2026-11-02", "barbell-bench", 50, 5)  # первый день жима
    assert _flags(day, "barbell-bench") == [False]
