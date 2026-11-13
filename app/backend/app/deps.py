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


def get_current_user(session: SessionDep, token: Annotated[str, Depends(oauth2)]) -> User:
    """Пользователь по токену. Нет токена или он плохой — ответ 401 «войдите заново»."""
    user_id = read_token(token)
    user = session.get(User, user_id) if user_id is not None else None
    if user is None or user.email is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Нужно войти заново",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
