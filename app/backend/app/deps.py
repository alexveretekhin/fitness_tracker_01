"""Зависимости (Depends): то, что FastAPI сам подставляет в эндпоинты."""

from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, select

from app.db import get_session
from app.models import User

SessionDep = Annotated[Session, Depends(get_session)]


def get_current_user(session: SessionDep) -> User:
    """Пока аккаунтов нет (этап 6), всегда возвращаем единственного пользователя."""
    user = session.exec(select(User).order_by(User.id)).first()
    if user is None:
        user = User()
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
