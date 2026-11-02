"""Геймификация: XP, уровни и недельная серия.

Правила (решили с автором 2026-11-02, ADR 0008):

- Тренировка = день, где записан хотя бы один подход.
- XP: 50 за каждый день с тренировкой.
- Уровни: 1 с нуля, 2 с 2000 XP (~3 месяца при 3 тренировках в неделю), 3 с 5000 XP (~8 месяцев).
- Неделя (пн–вс) засчитана, если в ней 3 тренировки или больше.
- Серия = сколько засчитанных недель подряд. Текущая неделя серию не рвёт, пока не кончилась.
- Заморозка: 1 неделя в месяц. Замороженная неделя серию не рвёт, но и не прибавляет.

Всё считается на лету из подходов, отдельно хранятся только заморозки.
Числа меняются здесь, в одном месте.
"""

import datetime as dt

from pydantic import BaseModel

XP_PER_DAY = 50
LEVELS = [0, 2000, 5000]  # с какого XP начинается уровень 1, 2, 3
WEEK_GOAL = 3
FREEZES_PER_MONTH = 1


class Progress(BaseModel):
    xp: int
    level: int
    level_from: int  # XP, с которого начался текущий уровень
    level_to: int | None  # XP следующего уровня; None = уровень последний
    levels: list[int]  # пороги всех уровней, для экрана аватара
    streak_weeks: int
    week_workouts: int  # тренировок на этой неделе
    week_goal: int
    week_frozen: bool
    freezes_left: int  # сколько заморозок ещё можно в этом месяце


def week_start(day: dt.date) -> dt.date:
    """Понедельник недели, в которую попадает day."""
    return day - dt.timedelta(days=day.weekday())


def freezes_left(frozen: set[dt.date], today: dt.date) -> int:
    this_week = week_start(today)
    used = sum(1 for w in frozen if (w.year, w.month) == (this_week.year, this_week.month))
    return max(0, FREEZES_PER_MONTH - used)


def compute(workout_days: set[dt.date], frozen: set[dt.date], today: dt.date) -> Progress:
    xp = XP_PER_DAY * len(workout_days)
    level = sum(1 for threshold in LEVELS if xp >= threshold)

    def workouts(week: dt.date) -> int:
        return sum(1 for d in workout_days if week <= d < week + dt.timedelta(days=7))

    this_week = week_start(today)
    streak = 0
    # Идём назад от прошлой недели, пока недели засчитаны или заморожены
    week = this_week - dt.timedelta(days=7)
    first = min(workout_days, default=today)
    while week >= week_start(first):
        if workouts(week) >= WEEK_GOAL:
            streak += 1
        elif week not in frozen:
            break
        week -= dt.timedelta(days=7)
    # Текущая неделя прибавляет, только когда цель уже набрана
    if workouts(this_week) >= WEEK_GOAL:
        streak += 1

    return Progress(
        xp=xp,
        level=level,
        level_from=LEVELS[level - 1],
        level_to=LEVELS[level] if level < len(LEVELS) else None,
        levels=LEVELS,
        streak_weeks=streak,
        week_workouts=workouts(this_week),
        week_goal=WEEK_GOAL,
        week_frozen=this_week in frozen,
        freezes_left=freezes_left(frozen, today),
    )
