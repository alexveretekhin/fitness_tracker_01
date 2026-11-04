"""Геймификация: XP и уровни.

Правила (решили с автором 2026-11-02, ADR 0008; серию недель и заморозку
убрали 2026-11-04, ADR 0009):

- Тренировка = день, где записан хотя бы один подход.
- XP: 50 за каждый день с тренировкой.
- Уровни: 1 с нуля, 2 с 2000 XP (~3 месяца при 3 тренировках в неделю), 3 с 5000 XP (~8 месяцев).

Всё считается на лету из подходов, в базе ничего отдельно не хранится.
Числа меняются здесь, в одном месте.
"""

import datetime as dt

from pydantic import BaseModel

XP_PER_DAY = 50
LEVELS = [0, 2000, 5000]  # с какого XP начинается уровень 1, 2, 3


class Progress(BaseModel):
    xp: int
    level: int
    level_from: int  # XP, с которого начался текущий уровень
    level_to: int | None  # XP следующего уровня; None = уровень последний
    levels: list[int]  # пороги всех уровней, для экрана аватара


def compute(workout_days: set[dt.date]) -> Progress:
    xp = XP_PER_DAY * len(workout_days)
    level = sum(1 for threshold in LEVELS if xp >= threshold)
    return Progress(
        xp=xp,
        level=level,
        level_from=LEVELS[level - 1],
        level_to=LEVELS[level] if level < len(LEVELS) else None,
        levels=LEVELS,
    )
