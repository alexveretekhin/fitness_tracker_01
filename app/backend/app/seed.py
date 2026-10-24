"""Заполняет базу каталогом и создаёт пользователя по умолчанию.

Можно запускать сколько угодно раз: существующие записи обновятся, дубли не появятся.

    uv run python -m app.seed
"""

from sqlmodel import Session, delete, select

from app.catalog import EXERCISES, MUSCLE_GROUPS
from app.db import engine
from app.models import Exercise, ExerciseMuscle, MuscleGroup, MuscleRole, User


def seed(session: Session) -> None:
    for position, (group_id, name) in enumerate(MUSCLE_GROUPS):
        session.merge(MuscleGroup(id=group_id, name=name, position=position))

    for ex_id, name, primary, secondary, demo in EXERCISES:
        session.merge(Exercise(id=ex_id, name=name, demo=demo))
        # Связи с мышцами пересоздаём целиком, чтобы правки в catalog.py применялись
        session.exec(delete(ExerciseMuscle).where(ExerciseMuscle.exercise_id == ex_id))
        for group_id in primary:
            session.add(ExerciseMuscle(exercise_id=ex_id, muscle_group_id=group_id))
        for group_id in secondary:
            session.add(
                ExerciseMuscle(
                    exercise_id=ex_id, muscle_group_id=group_id, role=MuscleRole.secondary
                )
            )

    # До этапа 6 (аккаунты) в приложении один пользователь
    if session.exec(select(User)).first() is None:
        session.add(User())

    session.commit()


if __name__ == "__main__":
    with Session(engine) as s:
        seed(s)
    print(f"Готово: {len(MUSCLE_GROUPS)} групп мышц, {len(EXERCISES)} упражнений")
