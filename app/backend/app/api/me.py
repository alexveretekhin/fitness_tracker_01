"""Профиль текущего пользователя: пока только аватар."""

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.schemas import MeOut, MeUpdate

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=MeOut)
def get_me(user: CurrentUser):
    return user


@router.put("", response_model=MeOut)
def update_me(body: MeUpdate, user: CurrentUser, session: SessionDep):
    user.avatar = body.avatar
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
