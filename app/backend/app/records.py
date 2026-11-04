"""Рекорды: таблица лучших весов по повторам и отметка рекордных подходов.

Правила (решили с автором 2026-11-04, ADR 0012):

- Таблица: для 1, 3, 5, 8 и 10 повторов лучший вес среди подходов,
  где повторов было столько же или больше. 30 кг × 5 годится и для «3 повт.».
- Рекордный подход: лучший подход дня в упражнении, который сильнее всех
  прошлых дней. Сила = расчётный максимум e1RM (как на графике, ADR 0011).
  Сравниваем только с прошлыми днями: разминка 20 кг и потом 30 кг в тот же
  день не дают двух рекордов.
- Упражнения без веса (вес 0) сравниваем по повторам.
- Самый первый день упражнения не рекорд: побивать ещё нечего.

Всё считается на лету из подходов, в базе ничего отдельно не хранится.
"""

import datetime as dt
from collections.abc import Iterable
from dataclasses import dataclass

from sqlmodel import Session, col, select

from app.models import DayExercise, WorkoutDay, WorkoutSet

REP_TARGETS = (1, 3, 5, 8, 10)  # строки таблицы рекордов


def e1rm(weight: float, reps: int) -> float:
    """Расчётный максимум на 1 раз по формуле Эпли. На 1 повтор это сам вес."""
    return weight if reps == 1 else weight * (1 + reps / 30)


@dataclass
class SetRow:
    """Подход вместе с датой и упражнением, в порядке выполнения."""

    id: int
    exercise_id: str
    date: dt.date
    weight: float
    reps: int


def _score(s: SetRow) -> float:
    return e1rm(s.weight, s.reps) if s.weight > 0 else s.reps


def record_set_ids(rows: Iterable[SetRow]) -> set[int]:
    """id рекордных подходов. rows идут по дате, внутри дня по порядку подходов."""
    best: dict[tuple[str, bool], float] = {}  # (упражнение, с весом?) → лучшее до этого дня
    records: set[int] = set()
    day_best: dict[tuple[str, bool], SetRow] = {}
    current: dt.date | None = None

    def close_day():
        for key, s in day_best.items():
            score = _score(s)
            if key in best and score > best[key] + 1e-9:
                records.add(s.id)
            best[key] = max(best.get(key, score), score)
        day_best.clear()

    for s in rows:
        if s.date != current:
            close_day()
            current = s.date
        key = (s.exercise_id, s.weight > 0)
        # Строго больше: при равенстве рекордом остаётся первый такой подход дня
        if key not in day_best or _score(s) > _score(day_best[key]):
            day_best[key] = s
    close_day()
    return records


@dataclass
class Record:
    reps: int
    weight: float
    date: dt.date


def rep_records(rows: Iterable[SetRow]) -> tuple[list[Record], Record | None]:
    """Таблица рекордов одного упражнения и рекорд повторов без веса.

    При равном весе берём самую раннюю дату: тогда рекорд и поставлен.
    """
    rows = list(rows)
    table = []
    for target in REP_TARGETS:
        best: SetRow | None = None
        for s in rows:
            if s.weight > 0 and s.reps >= target and (best is None or s.weight > best.weight):
                best = s
        if best:
            table.append(Record(reps=target, weight=best.weight, date=best.date))
    bodyweight: SetRow | None = None
    for s in rows:
        if s.weight == 0 and (bodyweight is None or s.reps > bodyweight.reps):
            bodyweight = s
    bw = Record(reps=bodyweight.reps, weight=0, date=bodyweight.date) if bodyweight else None
    return table, bw


def load_sets(session: Session, user_id: int, exercise_id: str | None = None) -> list[SetRow]:
    """Все подходы пользователя (или одного упражнения) по порядку выполнения."""
    query = (
        select(
            WorkoutSet.id,
            DayExercise.exercise_id,
            WorkoutDay.date,
            WorkoutSet.weight,
            WorkoutSet.reps,
        )
        .join(DayExercise, col(WorkoutSet.day_exercise_id) == DayExercise.id)
        .join(WorkoutDay, col(DayExercise.day_id) == WorkoutDay.id)
        .where(WorkoutDay.user_id == user_id)
        .order_by(WorkoutDay.date, WorkoutSet.position, WorkoutSet.id)
    )
    if exercise_id is not None:
        query = query.where(DayExercise.exercise_id == exercise_id)
    return [SetRow(*row) for row in session.exec(query).all()]
