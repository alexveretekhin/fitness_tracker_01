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


class SetLogIn(BaseModel):
    weight: float = Field(ge=0, le=1000)
    sets: int = Field(ge=0, le=100)
    reps: int = Field(ge=0, le=1000)


class DayExerciseOut(BaseModel):
    exercise_id: str
    name: str
    weight: float | None
    sets: int | None
    reps: int | None


class DayOut(BaseModel):
    date: dt.date
    done: bool  # горит ли огонёк: записан хотя бы один подход
    exercises: list[DayExerciseOut]


class DaySummary(BaseModel):
    date: dt.date
    done: bool
    count: int


class AddExerciseIn(BaseModel):
    exercise_id: str


class MeOut(BaseModel):
    id: int
    name: str
    avatar: Avatar | None


class MeUpdate(BaseModel):
    avatar: Avatar
