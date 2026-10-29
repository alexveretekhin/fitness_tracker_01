"""Формы данных, которые API принимает и отдаёт (не таблицы).

Отделены от моделей базы, чтобы наружу уходило только нужное,
а входные данные проверялись (например, вес не может быть отрицательным).
"""

import datetime as dt

from pydantic import BaseModel, Field

from app.models import Avatar


class MuscleGroupOut(BaseModel):
    id: str
    name: str


class ExerciseOut(BaseModel):
    id: str
    name: str
    demo: str | None
    primary_muscles: list[str]


class SetIn(BaseModel):
    """Один подход из карточки. Вес 0 = упражнение с собственным весом."""

    weight: float = Field(ge=0, le=1000)
    reps: int = Field(ge=1, le=1000)


class SetOut(BaseModel):
    id: int
    weight: float
    reps: int


class DayExerciseOut(BaseModel):
    exercise_id: str
    name: str
    sets: list[SetOut]  # подходы по порядку, пустой список = ещё не начинал


class DayOut(BaseModel):
    date: dt.date
    done: bool  # горит ли огонёк: записан хотя бы один подход
    exercises: list[DayExerciseOut]


class DaySummary(BaseModel):
    date: dt.date
    done: bool
    count: int  # сколько упражнений добавлено в день
    done_exercises: list[str]  # названия упражнений, где записан хотя бы один подход


class AddExerciseIn(BaseModel):
    exercise_id: str


class MeOut(BaseModel):
    id: int
    name: str
    avatar: Avatar | None


class MeUpdate(BaseModel):
    avatar: Avatar
