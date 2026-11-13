"""Регистрация и вход: по почте и паролю (ADR 0014) и через Google (ADR 0015).

Оба адреса отвечают токеном. Фронтенд хранит его и прикладывает к запросам.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select

from app import security
from app.config import settings
from app.deps import SessionDep
from app.models import User
from app.schemas import AuthConfig, GoogleIn, RegisterIn, TokenOut
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


@router.get("/config", response_model=AuthConfig)
def auth_config():
    """Включён ли вход через Google (и с каким Client ID рисовать кнопку)."""
    return AuthConfig(google_client_id=settings.google_client_id or None)


@router.post("/google", response_model=TokenOut)
def login_google(body: GoogleIn, session: SessionDep):
    """Вход через Google. Нет аккаунта с этой почтой — создаём (без пароля).

    Если аккаунт с той же почтой уже есть (регистрировался паролем), входим в него:
    Google подтвердил, что почта принадлежит этому человеку.
    """
    if not settings.google_client_id:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Вход через Google не настроен")
    info = security.read_google_token(body.credential)
    if not info or not info.get("email") or not info.get("email_verified"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google не подтвердил вход")
    email = info["email"].strip().lower()
    user = _find(session, email)
    if user is None:
        name = (info.get("given_name") or info.get("name") or email.split("@")[0])[:40]
        user = User(email=email, name=name)
        session.add(user)
        session.commit()
        session.refresh(user)
    return TokenOut(access_token=create_token(user.id))
