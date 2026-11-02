"""Дни тренировок: упражнения дня, подходы и огоньки для ленты недели.

Дата приходит от фронтенда как календарная дата пользователя (2026-10-24),
поэтому огонёк не «перескочит» на другой день из-за часовых поясов.
"""

import datetime as dt
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlmodel import col, delete, func, select

from app.deps import CurrentUser, SessionDep
from app.models import DayExercise, Exercise, WeekFreeze, WorkoutDay, WorkoutSet
from app.schemas import AddExerciseIn, DayExerciseOut, DayOut, DaySummary, SetIn, SetOut

router = APIRouter(prefix="/days", tags=["days"])


def _get_day(session: SessionDep, user_id: int, date: dt.date) -> WorkoutDay | None:
    return session.exec(
        select(WorkoutDay).where(WorkoutDay.user_id == user_id, WorkoutDay.date == date)
    ).first()


def _sets_of(session: SessionDep, entry_ids: list[int]) -> dict[int, list[SetOut]]:
    """Подходы для нескольких упражнений дня одним запросом."""
    rows = session.exec(
        select(WorkoutSet)
        .where(col(WorkoutSet.day_exercise_id).in_(entry_ids))
        .order_by(WorkoutSet.position, WorkoutSet.id)
    ).all()
    result: dict[int, list[SetOut]] = {}
    for s in rows:
        result.setdefault(s.day_exercise_id, []).append(
            SetOut(id=s.id, weight=s.weight, reps=s.reps)
        )
    return result


def _day_out(session: SessionDep, date: dt.date, day: WorkoutDay | None) -> DayOut:
    if day is None:
        return DayOut(date=date, done=False, exercises=[])
    rows = session.exec(
        select(DayExercise, Exercise)
        .join(Exercise)
        .where(DayExercise.day_id == day.id)
        .order_by(DayExercise.position)
    ).all()
    sets = _sets_of(session, [de.id for de, _ in rows])
    items = [
        DayExerciseOut(exercise_id=de.exercise_id, name=ex.name, sets=sets.get(de.id, []))
        for de, ex in rows
    ]
    return DayOut(date=date, done=any(i.sets for i in items), exercises=items)


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


def _get_set(session: SessionDep, entry: DayExercise, set_id: int) -> WorkoutSet:
    s = session.get(WorkoutSet, set_id)
    if s is None or s.day_exercise_id != entry.id:
        raise HTTPException(404, "Нет такого подхода")
    return s


@router.get("", response_model=list[DaySummary])
def list_days(
    session: SessionDep,
    user: CurrentUser,
    date_from: Annotated[dt.date, Query(alias="from")],
    date_to: Annotated[dt.date, Query(alias="to")],
):
    """Сводка по дням для ленты недели и истории: /days?from=2026-10-20&to=2026-10-28"""
    # Одна строка = одно упражнение дня и число его подходов
    rows = session.exec(
        select(WorkoutDay.date, Exercise.name, func.count(col(WorkoutSet.id)))
        .join(DayExercise, col(DayExercise.day_id) == WorkoutDay.id)
        .join(Exercise)
        .join(WorkoutSet, isouter=True)
        .where(
            WorkoutDay.user_id == user.id,
            WorkoutDay.date >= date_from,
            WorkoutDay.date <= date_to,
        )
        .group_by(DayExercise.id, WorkoutDay.date, Exercise.name, DayExercise.position)
        .order_by(col(WorkoutDay.date).desc(), DayExercise.position)
    ).all()
    days: dict[dt.date, DaySummary] = {}
    for date, name, n_sets in rows:
        day = days.setdefault(date, DaySummary(date=date, done=False, count=0, done_exercises=[]))
        day.count += 1
        if n_sets:
            day.done = True
            day.done_exercises.append(name)
    return list(days.values())


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_days(session: SessionDep, user: CurrentUser):
    """Удалить все тренировки и заморозки пользователя (кнопка Reset data в настройках)."""
    day_ids = select(WorkoutDay.id).where(WorkoutDay.user_id == user.id)
    entry_ids = select(DayExercise.id).where(col(DayExercise.day_id).in_(day_ids))
    session.exec(delete(WorkoutSet).where(col(WorkoutSet.day_exercise_id).in_(entry_ids)))
    session.exec(delete(DayExercise).where(col(DayExercise.day_id).in_(day_ids)))
    session.exec(delete(WorkoutDay).where(WorkoutDay.user_id == user.id))
    session.exec(delete(WeekFreeze).where(WeekFreeze.user_id == user.id))
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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


@router.delete("/{date}/exercises/{exercise_id}", response_model=DayOut)
def remove_exercise(date: dt.date, exercise_id: str, session: SessionDep, user: CurrentUser):
    """Убрать упражнение из дня вместе с его подходами."""
    day, entry = _get_entry(session, user, date, exercise_id)
    session.exec(delete(WorkoutSet).where(WorkoutSet.day_exercise_id == entry.id))
    session.delete(entry)
    session.commit()
    return _day_out(session, date, day)


@router.post(
    "/{date}/exercises/{exercise_id}/sets",
    response_model=DayOut,
    status_code=status.HTTP_201_CREATED,
)
def add_set(date: dt.date, exercise_id: str, body: SetIn, session: SessionDep, user: CurrentUser):
    """Записать подход (кнопка «+ подход» в карточке)."""
    day, entry = _get_entry(session, user, date, exercise_id)
    count = session.exec(
        select(func.count()).select_from(WorkoutSet).where(WorkoutSet.day_exercise_id == entry.id)
    ).one()
    session.add(
        WorkoutSet(day_exercise_id=entry.id, position=count, weight=body.weight, reps=body.reps)
    )
    session.commit()
    return _day_out(session, date, day)


@router.put("/{date}/exercises/{exercise_id}/sets/{set_id}", response_model=DayOut)
def update_set(
    date: dt.date,
    exercise_id: str,
    set_id: int,
    body: SetIn,
    session: SessionDep,
    user: CurrentUser,
):
    """Исправить вес или повторы в уже записанном подходе."""
    day, entry = _get_entry(session, user, date, exercise_id)
    s = _get_set(session, entry, set_id)
    s.weight, s.reps = body.weight, body.reps
    session.add(s)
    session.commit()
    return _day_out(session, date, day)


@router.delete("/{date}/exercises/{exercise_id}/sets/{set_id}", response_model=DayOut)
def remove_set(
    date: dt.date, exercise_id: str, set_id: int, session: SessionDep, user: CurrentUser
):
    day, entry = _get_entry(session, user, date, exercise_id)
    session.delete(_get_set(session, entry, set_id))
    session.commit()
    return _day_out(session, date, day)
