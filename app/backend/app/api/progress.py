"""XP, уровень, недельная серия и заморозка недели.

Дату «сегодня» присылает фронтенд: он знает часовой пояс пользователя, сервер нет.
"""

import datetime as dt
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import delete, select

from app import progress
from app.deps import CurrentUser, SessionDep
from app.models import DayExercise, WeekFreeze, WorkoutDay, WorkoutSet
from app.progress import Progress

router = APIRouter(prefix="/me", tags=["me"])

TodayQuery = Annotated[dt.date, Query(description="Сегодняшняя дата у пользователя")]


def _progress(session: SessionDep, user: CurrentUser, today: dt.date) -> Progress:
    days = session.exec(
        select(WorkoutDay.date)
        .join(DayExercise, DayExercise.day_id == WorkoutDay.id)
        .join(WorkoutSet, WorkoutSet.day_exercise_id == DayExercise.id)
        .where(WorkoutDay.user_id == user.id)
        .distinct()
    ).all()
    frozen = session.exec(select(WeekFreeze.week_start).where(WeekFreeze.user_id == user.id)).all()
    return progress.compute(set(days), set(frozen), today)


@router.get("/progress", response_model=Progress)
def get_progress(today: TodayQuery, session: SessionDep, user: CurrentUser):
    return _progress(session, user, today)


@router.post("/freeze", response_model=Progress)
def freeze_week(today: TodayQuery, session: SessionDep, user: CurrentUser):
    """Заморозить текущую неделю."""
    current = _progress(session, user, today)
    if current.week_frozen:
        raise HTTPException(409, "Эта неделя уже заморожена")
    if current.week_workouts >= current.week_goal:
        raise HTTPException(409, "Эта неделя уже засчитана, замораживать не нужно")
    if current.freezes_left == 0:
        raise HTTPException(409, "Заморозка в этом месяце уже использована")
    session.add(WeekFreeze(user_id=user.id, week_start=progress.week_start(today)))
    session.commit()
    return _progress(session, user, today)


@router.delete("/freeze", response_model=Progress)
def unfreeze_week(today: TodayQuery, session: SessionDep, user: CurrentUser):
    """Отменить заморозку текущей недели (нажал случайно)."""
    session.exec(
        delete(WeekFreeze).where(
            WeekFreeze.user_id == user.id,
            WeekFreeze.week_start == progress.week_start(today),
        )
    )
    session.commit()
    return _progress(session, user, today)
