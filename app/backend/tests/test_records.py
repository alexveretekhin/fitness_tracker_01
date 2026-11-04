"""Тесты рекорда упражнения: одна рекордная тренировка за всё время. Запуск: uv run pytest"""


def _set(client, day, exercise, weight, reps):
    client.post(f"/api/days/{day}/exercises", json={"exercise_id": exercise})
    client.post(f"/api/days/{day}/exercises/{exercise}/sets", json={"weight": weight, "reps": reps})


def _record(client, exercise):
    r = client.get(f"/api/exercises/{exercise}/record")
    assert r.status_code == 200
    return r.json()


def _flags(client, day, exercise):
    exercises = client.get(f"/api/days/{day}").json()["exercises"]
    (e,) = [e for e in exercises if e["exercise_id"] == exercise]
    return [s["record"] for s in e["sets"]]


def test_only_one_record_day_for_all_time(client):
    _set(client, "2026-11-01", "barbell-bench", 60, 5)  # 70
    _set(client, "2026-11-02", "barbell-bench", 65, 5)  # 75,8: был рекордом, но его побили
    _set(client, "2026-11-03", "barbell-bench", 50, 5)  # разминка
    _set(client, "2026-11-03", "barbell-bench", 70, 5)  # 81,7: рекорд за всё время
    _set(client, "2026-11-04", "barbell-bench", 60, 5)
    assert _flags(client, "2026-11-02", "barbell-bench") == [False]
    assert _flags(client, "2026-11-03", "barbell-bench") == [False, True]
    summary = client.get("/api/days", params={"from": "2026-11-01", "to": "2026-11-30"}).json()
    assert {d["date"]: d["records"] for d in summary} == {
        "2026-11-04": 0,
        "2026-11-03": 1,
        "2026-11-02": 0,
        "2026-11-01": 0,
    }
    assert _record(client, "barbell-bench") == {
        "date": "2026-11-03",
        "weight": 70,
        "reps": 5,
        "strength": 81.7,
    }


def test_single_day_has_no_record(client):
    _set(client, "2026-11-01", "squat", 80, 5)
    _set(client, "2026-11-01", "squat", 90, 5)
    assert _flags(client, "2026-11-01", "squat") == [False, False]
    assert _record(client, "squat") is None


def test_tie_keeps_the_first(client):
    _set(client, "2026-11-01", "squat", 100, 5)
    _set(client, "2026-11-02", "squat", 100, 5)
    assert _record(client, "squat")["date"] == "2026-11-01"


def test_heavy_single_vs_light_sets_uses_e1rm(client):
    _set(client, "2026-11-01", "barbell-bench", 40, 1)  # 40
    _set(client, "2026-11-02", "barbell-bench", 20, 10)  # 26,7: слабее
    assert _record(client, "barbell-bench")["date"] == "2026-11-01"
    _set(client, "2026-11-03", "barbell-bench", 35, 5)  # 40,8: сильнее
    assert _record(client, "barbell-bench")["date"] == "2026-11-03"


def test_bodyweight_by_reps(client):
    _set(client, "2026-11-01", "pull-ups", 0, 8)
    _set(client, "2026-11-02", "pull-ups", 0, 12)
    assert _record(client, "pull-ups") == {
        "date": "2026-11-02",
        "weight": 0,
        "reps": 12,
        "strength": 12,
    }


def test_weighted_beats_bodyweight(client):
    _set(client, "2026-11-01", "pull-ups", 0, 15)
    _set(client, "2026-11-02", "pull-ups", 10, 5)  # с отягощением важнее
    assert _record(client, "pull-ups")["weight"] == 10


def test_exercises_are_separate(client):
    _set(client, "2026-11-01", "squat", 100, 5)
    _set(client, "2026-11-02", "squat", 110, 5)
    _set(client, "2026-11-02", "barbell-bench", 50, 5)  # первый день жима
    assert _flags(client, "2026-11-02", "squat") == [True]
    assert _flags(client, "2026-11-02", "barbell-bench") == [False]


def test_record_unknown_exercise(client):
    assert client.get("/api/exercises/nope/record").status_code == 404
