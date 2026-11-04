"""Статистика упражнения по дням: из неё рисуется график в истории."""

import datetime as dt
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import col, func, select

from app.deps import CurrentUser, SessionDep
from app.models import DayExercise, Exercise, WorkoutDay, WorkoutSet
from app.schemas import ExerciseStat

router = APIRouter(tags=["stats"])


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
            max_reps=reps,
            volume=volume,
            total_reps=total,
            sets=n,
        )
        for date, best, reps, volume, total, n in rows
    ]
