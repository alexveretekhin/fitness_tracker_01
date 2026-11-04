"""Рекорд упражнения: одна рекордная тренировка за всё время.

Правила (решили с автором 2026-11-04, ADR 0013, заменяет таблицу из ADR 0012):

- У каждого упражнения один рекорд: лучший подход за всё время. День, где он
  сделан, и есть рекордная тренировка. Кубок стоит только на нём.
- Сила подхода = расчётный максимум e1RM (как на графике, ADR 0011).
  Если в упражнении есть подходы с весом, сравниваем только их.
  Упражнения без веса (вес 0) сравниваем по повторам.
- При равенстве рекорд остаётся за первым подходом: его надо именно побить.
- Пока упражнение делал только в один день, рекорда нет: побивать ещё нечего.

Всё считается на лету из подходов, в базе ничего отдельно не хранится.
"""

import datetime as dt
from collections.abc import Iterable
from dataclasses import dataclass

from sqlmodel import Session, col, select

from app.models import DayExercise, WorkoutDay, WorkoutSet


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


def strength(s: SetRow) -> float:
    """Сила подхода: e1RM для подходов с весом, повторы для подходов без веса."""
    return e1rm(s.weight, s.reps) if s.weight > 0 else s.reps


def _beats(s: SetRow, old: SetRow) -> bool:
    if (s.weight > 0) != (old.weight > 0):
        return s.weight > 0  # подход с весом важнее подхода без веса
    return strength(s) > strength(old) + 1e-9  # строго больше: равенство не рекорд


def records(rows: Iterable[SetRow]) -> dict[str, SetRow]:
    """Рекордный подход каждого упражнения. rows идут по порядку выполнения."""
    best: dict[str, SetRow] = {}
    days: dict[str, set[dt.date]] = {}
    for s in rows:
        days.setdefault(s.exercise_id, set()).add(s.date)
        old = best.get(s.exercise_id)
        if old is None or _beats(s, old):
            best[s.exercise_id] = s
    return {ex: s for ex, s in best.items() if len(days[ex]) > 1}


def record_ids(rows: Iterable[SetRow]) -> set[int]:
    """id рекордных подходов всех упражнений: на них стоит кубок."""
    return {s.id for s in records(rows).values()}


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
