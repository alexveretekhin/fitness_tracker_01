"""Формы данных, которые API принимает и отдаёт (не таблицы).

Отделены от моделей базы, чтобы наружу уходило только нужное,
а входные данные проверялись (например, вес не может быть отрицательным).
"""

import datetime as dt

from pydantic import BaseModel, EmailStr, Field

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
    record: bool = False  # рекордный подход упражнения за всё время (кубок)


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
    records: int = 0  # сколько упражнений поставили рекорд в этот день


class AddExerciseIn(BaseModel):
    exercise_id: str


class RegisterIn(BaseModel):
    """Регистрация: почта и пароль. Имя необязательно, по умолчанию часть почты до @."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = Field(default=None, max_length=40)


class GoogleIn(BaseModel):
    """Ответ кнопки Google: подписанный Google токен с почтой и именем (ID token)."""

    credential: str


class AuthConfig(BaseModel):
    """Какие способы входа включены. Фронтенд по нему решает, показывать ли кнопку Google."""

    google_client_id: str | None


class TokenOut(BaseModel):
    """Ответ на вход и регистрацию. Такой вид требует стандарт OAuth2."""

    access_token: str
    token_type: str = "bearer"


class MeOut(BaseModel):
    id: int
    name: str
    email: str | None
    avatar: Avatar | None
    is_guest: bool = False  # вошёл без регистрации: тренировки только на этом устройстве


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


class RecordOut(BaseModel):
    """Рекорд упражнения: лучший подход за всё время и день, когда он сделан."""

    date: dt.date  # рекордная тренировка
    weight: float  # 0 = упражнение без веса
    reps: int
    strength: float  # сила подхода: e1RM в кг, а без веса число повторов
