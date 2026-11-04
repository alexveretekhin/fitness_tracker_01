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
    record: bool = False  # лучший подход дня, который побил все прошлые дни (кубок)


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
    records: int = 0  # сколько рекордных подходов в этот день


class AddExerciseIn(BaseModel):
    exercise_id: str


class MeOut(BaseModel):
    id: int
    name: str
    avatar: Avatar | None


class MeUpdate(BaseModel):
    avatar: Avatar


class ExerciseStat(BaseModel):
    """Итог одного упражнения за один день, точка на графике в истории."""

    date: dt.date
    best_weight: float  # самый тяжёлый подход за день, кг
    best_e1rm: float  # расчётный максимум на 1 раз по лучшему подходу (формула Эпли), кг
    max_reps: int  # больше всего повторов в одном подходе (для упражнений без веса)
    volume: float  # объём: сумма «вес × повторы» по всем подходам
    total_reps: int  # все повторы за день (объём для упражнений без веса)
    sets: int


class RepRecord(BaseModel):
    """Строка таблицы рекордов: лучший вес на столько повторов и когда он был."""

    reps: int
    weight: float  # 0 = рекорд повторов без веса
    date: dt.date


class ExerciseRecords(BaseModel):
    by_reps: list[RepRecord]  # строки 1, 3, 5, 8, 10 повторов; без подходов строки нет
    bodyweight: RepRecord | None  # больше всего повторов без веса
