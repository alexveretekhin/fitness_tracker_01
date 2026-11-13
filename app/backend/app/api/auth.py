"""Регистрация и вход по почте и паролю (ADR 0014).

Оба адреса отвечают токеном. Фронтенд хранит его и прикладывает к запросам.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select

from app.deps import SessionDep
from app.models import User
from app.schemas import RegisterIn, TokenOut
from app.security import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _find(session: SessionDep, email: str) -> User | None:
    return session.exec(select(User).where(User.email == email.strip().lower())).first()


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(body: RegisterIn, session: SessionDep):
    """Новый аккаунт. Начинается с нуля: без тренировок и без аватара."""
    email = body.email.strip().lower()
    if _find(session, email) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Эта почта уже зарегистрирована")
    name = (body.name or "").strip() or email.split("@")[0]
    user = User(email=email, password_hash=hash_password(body.password), name=name)
    session.add(user)
    session.commit()
    session.refresh(user)
    return TokenOut(access_token=create_token(user.id))


@router.post("/login", response_model=TokenOut)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep):
    """Вход. По стандарту OAuth2 почта приходит в поле username (обычная форма, не JSON)."""
    user = _find(session, form.username)
    # Одинаковая ошибка для «нет такой почты» и «не тот пароль»: так нельзя
    # подбором узнать, кто зарегистрирован.
    if (
        user is None
        or not user.password_hash
        or not verify_password(form.password, user.password_hash)
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверная почта или пароль")
    return TokenOut(access_token=create_token(user.id))
