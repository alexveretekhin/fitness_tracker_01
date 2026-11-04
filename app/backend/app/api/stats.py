"""Статистика упражнения по дням: из неё рисуется график в истории.

Сила считается как расчётный максимум на 1 раз (e1RM) по формуле Эпли:
вес × (1 + повторы / 30). Так подходы 40 кг × 1 и 30 кг × 8 можно сравнить.
Формула точна примерно до 10–12 повторов (ADR 0011).
"""

import datetime as dt
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import case, col, func, select

from app.deps import CurrentUser, SessionDep
from app.models import DayExercise, Exercise, WorkoutDay, WorkoutSet
from app.records import load_sets, records, strength
from app.schemas import ExerciseStat, RecordOut

router = APIRouter(tags=["stats"])

# Расчётный максимум одного подхода. На 1 повтор это сам вес.
E1RM = case(
    (WorkoutSet.reps == 1, WorkoutSet.weight),
    else_=WorkoutSet.weight * (1 + WorkoutSet.reps / 30.0),
)


@router.get("/exercises/{exercise_id}/stats", response_model=list[ExerciseStat])
def get_exercise_stats(
    exercise_id: str,
    session: SessionDep,
    user: CurrentUser,
    date_from: Annotated[dt.date, Query(alias="from")],
    date_to: Annotated[dt.date, Query(alias="to")],
):
    """Лучший вес, повторы и объём за каждый день с этим упражнением, по порядку дат.

    Дни, где упражнение добавлено, но подходов нет, не попадают.
    """
    if session.get(Exercise, exercise_id) is None:
        raise HTTPException(404, f"Нет упражнения '{exercise_id}'")
    rows = session.exec(
        select(
            WorkoutDay.date,
            func.max(WorkoutSet.weight),
            func.max(E1RM),
            func.max(WorkoutSet.reps),
            func.sum(WorkoutSet.weight * WorkoutSet.reps),
            func.sum(WorkoutSet.reps),
            func.count(col(WorkoutSet.id)),
        )
        .join(DayExercise, col(DayExercise.day_id) == WorkoutDay.id)
        .join(WorkoutSet, col(WorkoutSet.day_exercise_id) == DayExercise.id)
        .where(
            WorkoutDay.user_id == user.id,
            DayExercise.exercise_id == exercise_id,
            WorkoutDay.date >= date_from,
            WorkoutDay.date <= date_to,
        )
        .group_by(WorkoutDay.date)
        .order_by(WorkoutDay.date)
    ).all()
    return [
        ExerciseStat(
            date=date,
            best_weight=best,
            best_e1rm=round(e1rm, 1),
            max_reps=reps,
            volume=volume,
            total_reps=total,
            sets=n,
        )
        for date, best, e1rm, reps, volume, total, n in rows
    ]


@router.get("/exercises/{exercise_id}/record", response_model=RecordOut | None)
def get_exercise_record(exercise_id: str, session: SessionDep, user: CurrentUser):
    """Рекордная тренировка упражнения за всё время, или null, если рекорда ещё нет (ADR 0013)."""
    if session.get(Exercise, exercise_id) is None:
        raise HTTPException(404, f"Нет упражнения '{exercise_id}'")
    best = records(load_sets(session, user.id, exercise_id)).get(exercise_id)
    if best is None:
        return None
    return RecordOut(
        date=best.date, weight=best.weight, reps=best.reps, strength=round(strength(best), 1)
    )
