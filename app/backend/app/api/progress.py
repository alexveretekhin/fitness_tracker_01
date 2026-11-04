"""XP и уровень пользователя."""

from fastapi import APIRouter
from sqlmodel import select

from app import progress
from app.deps import CurrentUser, SessionDep
from app.models import DayExercise, WorkoutDay, WorkoutSet
from app.progress import Progress

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/progress", response_model=Progress)
def get_progress(session: SessionDep, user: CurrentUser):
    # Дни, где есть хотя бы один подход
    days = session.exec(
        select(WorkoutDay.date)
        .join(DayExercise, DayExercise.day_id == WorkoutDay.id)
        .join(WorkoutSet, WorkoutSet.day_exercise_id == DayExercise.id)
        .where(WorkoutDay.user_id == user.id)
        .distinct()
    ).all()
    return progress.compute(set(days))
