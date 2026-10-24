"""Дни тренировок: упражнения дня, подходы и огоньки для ленты недели.

Дата приходит от фронтенда как календарная дата пользователя (2026-10-24),
поэтому огонёк не «перескочит» на другой день из-за часовых поясов.
"""

import datetime as dt
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import col, func, select

from app.deps import CurrentUser, SessionDep
from app.models import DayExercise, Exercise, WorkoutDay
from app.schemas import AddExerciseIn, DayExerciseOut, DayOut, DaySummary, SetLogIn

router = APIRouter(prefix="/days", tags=["days"])


def _get_day(session: SessionDep, user_id: int, date: dt.date) -> WorkoutDay | None:
    return session.exec(
        select(WorkoutDay).where(WorkoutDay.user_id == user_id, WorkoutDay.date == date)
    ).first()


def _day_out(session: SessionDep, date: dt.date, day: WorkoutDay | None) -> DayOut:
    if day is None:
        return DayOut(date=date, done=False, exercises=[])
    rows = session.exec(
        select(DayExercise, Exercise)
        .join(Exercise)
        .where(DayExercise.day_id == day.id)
        .order_by(DayExercise.position)
    ).all()
    items = [
        DayExerciseOut(
            exercise_id=de.exercise_id, name=ex.name, weight=de.weight, sets=de.sets, reps=de.reps
        )
        for de, ex in rows
    ]
    return DayOut(date=date, done=any(i.sets is not None for i in items), exercises=items)


def _get_entry(session: SessionDep, user: CurrentUser, date: dt.date, exercise_id: str):
    day = _get_day(session, user.id, date)
    entry = (
        session.exec(
            select(DayExercise).where(
                DayExercise.day_id == day.id, DayExercise.exercise_id == exercise_id
            )
        ).first()
        if day
        else None
    )
    if entry is None:
        raise HTTPException(404, "Этого упражнения нет в этом дне")
    return day, entry


@router.get("", response_model=list[DaySummary])
def list_days(
    session: SessionDep,
    user: CurrentUser,
    date_from: Annotated[dt.date, Query(alias="from")],
    date_to: Annotated[dt.date, Query(alias="to")],
):
    """Сводка по дням для ленты недели и истории: /days?from=2026-10-20&to=2026-10-28"""
    logged = func.count(col(DayExercise.sets))  # считает только записанные подходы
    rows = session.exec(
        select(WorkoutDay.date, func.count(col(DayExercise.id)), logged)
        .join(DayExercise, isouter=True)
        .where(
            WorkoutDay.user_id == user.id,
            WorkoutDay.date >= date_from,
            WorkoutDay.date <= date_to,
        )
        .group_by(WorkoutDay.date)
        .order_by(col(WorkoutDay.date).desc())
    ).all()
    return [DaySummary(date=d, count=c, done=n > 0) for d, c, n in rows if c > 0]


@router.get("/{date}", response_model=DayOut)
def get_day(date: dt.date, session: SessionDep, user: CurrentUser):
    return _day_out(session, date, _get_day(session, user.id, date))


@router.post("/{date}/exercises", response_model=DayOut, status_code=status.HTTP_201_CREATED)
def add_exercise(date: dt.date, body: AddExerciseIn, session: SessionDep, user: CurrentUser):
    """Добавить упражнение в день (то самое «улетает на главную»)."""
    if session.get(Exercise, body.exercise_id) is None:
        raise HTTPException(404, f"Нет упражнения '{body.exercise_id}'")
    day = _get_day(session, user.id, date)
    if day is None:
        day = WorkoutDay(user_id=user.id, date=date)
        session.add(day)
        session.flush()  # чтобы у дня появился id
    exists = session.exec(
        select(DayExercise).where(
            DayExercise.day_id == day.id, DayExercise.exercise_id == body.exercise_id
        )
    ).first()
    if exists is None:
        count = session.exec(
            select(func.count()).select_from(DayExercise).where(DayExercise.day_id == day.id)
        ).one()
        session.add(DayExercise(day_id=day.id, exercise_id=body.exercise_id, position=count))
    session.commit()
    return _day_out(session, date, day)


@router.put("/{date}/exercises/{exercise_id}", response_model=DayOut)
def save_log(
    date: dt.date, exercise_id: str, body: SetLogIn, session: SessionDep, user: CurrentUser
):
    """Сохранить вес, подходы и повторы из карточки."""
    day, entry = _get_entry(session, user, date, exercise_id)
    entry.weight, entry.sets, entry.reps = body.weight, body.sets, body.reps
    session.add(entry)
    session.commit()
    return _day_out(session, date, day)


@router.delete("/{date}/exercises/{exercise_id}", response_model=DayOut)
def remove_exercise(date: dt.date, exercise_id: str, session: SessionDep, user: CurrentUser):
    day, entry = _get_entry(session, user, date, exercise_id)
    session.delete(entry)
    session.commit()
    return _day_out(session, date, day)
