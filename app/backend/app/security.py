"""Пароли и токены входа.

Пароль: храним не сам пароль, а его хеш (Argon2). Из хеша пароль не восстановить,
поэтому даже если базу украдут, пароли не утекут. При входе хешируем введённый
пароль и сравниваем.

Токен (JWT): после входа сервер выдаёт строку, подписанную секретом из .env.
Фронтенд прикладывает её к каждому запросу в заголовке
`Authorization: Bearer <токен>`. Подделать подпись без секрета нельзя,
поэтому по токену сервер точно знает, кто пришёл.
"""

import datetime as dt

import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pwdlib import PasswordHash

from app.config import settings

_hasher = PasswordHash.recommended()  # Argon2 с безопасными настройками
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _hasher.verify(password, password_hash)


def create_token(user_id: int) -> str:
    expires = dt.datetime.now(dt.UTC) + dt.timedelta(days=settings.token_days)
    return jwt.encode({"sub": str(user_id), "exp": expires}, settings.jwt_secret, ALGORITHM)


def read_token(token: str) -> int | None:
    """id пользователя из токена, или None, если токен подделан или истёк."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def read_google_token(credential: str) -> dict | None:
    """Проверяет токен от кнопки Google: подпись Google, срок и что он выдан нашему приложению.

    Возвращает данные пользователя (email, name, email_verified) или None, если токен плохой.
    Ключи Google для проверки подписи библиотека скачивает сама и кэширует.
    """
    try:
        return id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        return None
