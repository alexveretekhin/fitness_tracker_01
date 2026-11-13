"""Таблицы базы данных.

Каждый класс с table=True — это таблица. Поля класса — колонки.
Схема:

    User 1──* WorkoutDay 1──* DayExercise *──1 Exercise *──* MuscleGroup
                                   │                    (через ExerciseMuscle)
                                   1
                                   │
                                   * WorkoutSet (один подход: вес × повторы)
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


def _now() -> dt.datetime:
    return dt.datetime.now(dt.UTC)


class User(SQLModel, table=True):
    """Аккаунт. Пароль хранится только в виде хеша (необратимого «отпечатка»).

    У старого пользователя по умолчанию (до этапа 6) почты нет: войти в него нельзя.
    Гость (is_guest) тоже без почты: вошёл без регистрации, позже может сохранить
    аккаунт, указав почту, и тренировки останутся с ним.
    """

    id: int | None = Field(default=None, primary_key=True)
    name: str = "athlete"
    avatar: Avatar | None = None
    email: str | None = Field(default=None, unique=True, index=True)
    password_hash: str | None = None
    is_guest: bool = Field(default=False, sa_column_kwargs={"server_default": "0"})
    created_at: dt.datetime | None = Field(default_factory=_now)


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
    """Упражнение, добавленное в день. Подходы к нему лежат в WorkoutSet."""

    __table_args__ = (UniqueConstraint("day_id", "exercise_id"),)

    id: int | None = Field(default=None, primary_key=True)
    day_id: int = Field(foreign_key="workoutday.id", index=True)
    exercise_id: str = Field(foreign_key="exercise.id")
    position: int = 0
    created_at: dt.datetime = Field(default_factory=_now)


class WorkoutSet(SQLModel, table=True):
    """Один подход: сделал, нажал «+ подход», записался вес и повторы."""

    id: int | None = Field(default=None, primary_key=True)
    day_exercise_id: int = Field(foreign_key="dayexercise.id", index=True)
    position: int = 0  # порядок подходов: 0, 1, 2...
    weight: float = 0
    reps: int = 0
    created_at: dt.datetime = Field(default_factory=_now)
