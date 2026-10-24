"""Таблицы базы данных.

Каждый класс с table=True — это таблица. Поля класса — колонки.
Схема:

    User 1──* WorkoutDay 1──* DayExercise *──1 Exercise *──* MuscleGroup
                                                        (через ExerciseMuscle)
"""

import datetime as dt
from enum import StrEnum

from sqlmodel import Field, SQLModel, UniqueConstraint


class Avatar(StrEnum):
    male = "male"
    female = "female"


class MuscleRole(StrEnum):
    primary = "primary"  # основная нагрузка
    secondary = "secondary"  # помогает


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = "athlete"
    avatar: Avatar | None = None


class MuscleGroup(SQLModel, table=True):
    # Код группы: "chest", "biceps". Тот же код будет у мышцы на 3D-модели.
    id: str = Field(primary_key=True)
    name: str
    position: int = 0  # порядок в списке


class Exercise(SQLModel, table=True):
    id: str = Field(primary_key=True)  # "barbell-bench"
    name: str
    demo: str | None = None  # путь к анимации во фронтенде, например /animations/...


class ExerciseMuscle(SQLModel, table=True):
    """Связь «многие ко многим»: какое упражнение какие мышцы нагружает."""

    exercise_id: str = Field(foreign_key="exercise.id", primary_key=True)
    muscle_group_id: str = Field(foreign_key="musclegroup.id", primary_key=True)
    role: MuscleRole = MuscleRole.primary


class WorkoutDay(SQLModel, table=True):
    """День тренировки пользователя. Дата — календарная дата у пользователя."""

    __table_args__ = (UniqueConstraint("user_id", "date"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    date: dt.date = Field(index=True)


class DayExercise(SQLModel, table=True):
    """Упражнение, добавленное в день. Вес/подходы/повторы пусты, пока их не записали."""

    __table_args__ = (UniqueConstraint("day_id", "exercise_id"),)

    id: int | None = Field(default=None, primary_key=True)
    day_id: int = Field(foreign_key="workoutday.id", index=True)
    exercise_id: str = Field(foreign_key="exercise.id")
    position: int = 0
    weight: float | None = None
    sets: int | None = None
    reps: int | None = None
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.UTC))
