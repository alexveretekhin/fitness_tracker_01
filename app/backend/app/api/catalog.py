"""Каталог: группы мышц и упражнения (только чтение)."""

from fastapi import APIRouter, HTTPException
from sqlmodel import col, select

from app.deps import SessionDep
from app.models import Exercise, ExerciseMuscle, MuscleGroup, MuscleRole
from app.schemas import ExerciseOut, MuscleGroupOut

router = APIRouter(tags=["catalog"])


def _to_out(session: SessionDep, exercises: list[Exercise]) -> list[ExerciseOut]:
    ids = [e.id for e in exercises]
    links = session.exec(
        select(ExerciseMuscle).where(
            col(ExerciseMuscle.exercise_id).in_(ids),
            ExerciseMuscle.role == MuscleRole.primary,
        )
    ).all()
    primary: dict[str, list[str]] = {}
    for link in links:
        primary.setdefault(link.exercise_id, []).append(link.muscle_group_id)
    return [
        ExerciseOut(id=e.id, name=e.name, demo=e.demo, primary_muscles=primary.get(e.id, []))
        for e in exercises
    ]


@router.get("/muscle-groups", response_model=list[MuscleGroupOut])
def list_muscle_groups(session: SessionDep):
    return session.exec(select(MuscleGroup).order_by(MuscleGroup.position)).all()


@router.get("/muscle-groups/{group_id}/exercises", response_model=list[ExerciseOut])
def list_group_exercises(group_id: str, session: SessionDep):
    """Упражнения, где эта группа — основная. Это же будет звать 3D-аватар."""
    if session.get(MuscleGroup, group_id) is None:
        raise HTTPException(404, f"Нет группы мышц '{group_id}'")
    exercises = session.exec(
        select(Exercise)
        .join(ExerciseMuscle)
        .where(
            ExerciseMuscle.muscle_group_id == group_id,
            ExerciseMuscle.role == MuscleRole.primary,
        )
        .order_by(Exercise.name)
    ).all()
    return _to_out(session, list(exercises))


@router.get("/exercises", response_model=list[ExerciseOut])
def search_exercises(session: SessionDep, q: str = ""):
    """Поиск упражнений по названию: /exercises?q=bench"""
    query = select(Exercise).order_by(Exercise.name)
    if q.strip():
        query = query.where(col(Exercise.name).icontains(q.strip()))
    return _to_out(session, list(session.exec(query).all()))
