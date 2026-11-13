"""Зависимости (Depends): то, что FastAPI сам подставляет в эндпоинты."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.db import get_session
from app.models import User
from app.security import read_token

SessionDep = Annotated[Session, Depends(get_session)]

# Достаёт токен из заголовка Authorization: Bearer <токен>.
# tokenUrl нужен для кнопки Authorize в документации /docs.
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
# То же, но без ошибки, если токена нет (для регистрации: гость или новичок)
oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def _user_by_token(session: Session, token: str | None) -> User | None:
    user_id = read_token(token) if token else None
    user = session.get(User, user_id) if user_id is not None else None
    # Без почты можно войти только гостю: старый пользователь по умолчанию закрыт
    if user is None or (user.email is None and not user.is_guest):
        return None
    return user


def get_current_user(session: SessionDep, token: Annotated[str, Depends(oauth2)]) -> User:
    """Пользователь по токену. Нет токена или он плохой — ответ 401 «войдите заново»."""
    user = _user_by_token(session, token)
    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Нужно войти заново",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_guest(session: SessionDep, token: Annotated[str | None, Depends(oauth2_optional)]):
    """Гость, который сейчас вошёл, или None.

    Нужен, чтобы при регистрации гостя сохранить его тренировки.
    """
    user = _user_by_token(session, token)
    return user if user is not None and user.is_guest else None


CurrentGuest = Annotated[User | None, Depends(get_guest)]
