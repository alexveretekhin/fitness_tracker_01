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


def _add(client, exercise_id, day=DAY):
    return client.post(f"/api/days/{day}/exercises", json={"exercise_id": exercise_id})


def test_add_sets_and_flame(client):
    # Добавили упражнение: огонёк ещё не горит
    r = _add(client, "push-ups")
    assert r.status_code == 201
    assert r.json()["done"] is False
    assert r.json()["exercises"][0]["sets"] == []

    # Повторное добавление не создаёт дубль
    assert len(_add(client, "push-ups").json()["exercises"]) == 1

    # Первый подход: огонёк загорается
    url = f"/api/days/{DAY}/exercises/push-ups/sets"
    r = client.post(url, json={"weight": 0, "reps": 15})
    assert r.status_code == 201
    assert r.json()["done"] is True

    # Второй подход идёт следом, по порядку
    r = client.post(url, json={"weight": 0, "reps": 12})
    assert [s["reps"] for s in r.json()["exercises"][0]["sets"]] == [15, 12]

    summary = client.get("/api/days", params={"from": "2026-10-20", "to": "2026-10-28"}).json()
    assert summary == [{"date": DAY, "done": True, "count": 1, "done_exercises": ["Push-ups"]}]


def test_update_and_remove_set(client):
    _add(client, "squat")
    url = f"/api/days/{DAY}/exercises/squat/sets"
    day = client.post(url, json={"weight": 60, "reps": 10}).json()
    set_id = day["exercises"][0]["sets"][0]["id"]

    r = client.put(f"{url}/{set_id}", json={"weight": 62.5, "reps": 8})
    assert r.json()["exercises"][0]["sets"] == [{"id": set_id, "weight": 62.5, "reps": 8}]

    # Удалили единственный подход: огонёк гаснет
    r = client.delete(f"{url}/{set_id}")
    assert r.json()["done"] is False
    assert client.delete(f"{url}/{set_id}").status_code == 404


def test_set_of_other_exercise_is_404(client):
    _add(client, "squat")
    _add(client, "lunges")
    day = client.post(f"/api/days/{DAY}/exercises/squat/sets", json={"weight": 60, "reps": 10})
    set_id = day.json()["exercises"][0]["sets"][0]["id"]
    # Подход приседаний нельзя поменять через выпады
    r = client.put(f"/api/days/{DAY}/exercises/lunges/sets/{set_id}", json={"weight": 1, "reps": 1})
    assert r.status_code == 404


def test_days_without_sets_are_not_done(client):
    _add(client, "squat")
    summary = client.get("/api/days", params={"from": DAY, "to": DAY}).json()
    assert summary == [{"date": DAY, "done": False, "count": 1, "done_exercises": []}]


def test_remove_exercise_with_sets(client):
    _add(client, "squat")
    client.post(f"/api/days/{DAY}/exercises/squat/sets", json={"weight": 60, "reps": 10})
    r = client.delete(f"/api/days/{DAY}/exercises/squat")
    assert r.json() == {"date": DAY, "done": False, "exercises": []}
    assert client.delete(f"/api/days/{DAY}/exercises/squat").status_code == 404


def test_clear_days(client):
    _add(client, "squat")
    client.post(f"/api/days/{DAY}/exercises/squat/sets", json={"weight": 60, "reps": 10})
    _add(client, "plank", day="2026-10-25")
    assert client.delete("/api/days").status_code == 204
    assert client.get("/api/days", params={"from": "2026-10-01", "to": "2026-10-31"}).json() == []


def test_validation(client):
    _add(client, "squat")
    url = f"/api/days/{DAY}/exercises/squat/sets"
    assert client.post(url, json={"weight": -5, "reps": 10}).status_code == 422
    assert client.post(url, json={"weight": 50, "reps": 0}).status_code == 422
    assert _add(client, "nope").status_code == 404
    # Подход к упражнению, которого нет в дне
    r = client.post(f"/api/days/{DAY}/exercises/plank/sets", json={"weight": 0, "reps": 60})
    assert r.status_code == 404


def test_avatar(client):
    assert client.get("/api/me").json()["avatar"] is None
    assert client.put("/api/me", json={"avatar": "female"}).json()["avatar"] == "female"
    assert client.put("/api/me", json={"avatar": "robot"}).status_code == 422
