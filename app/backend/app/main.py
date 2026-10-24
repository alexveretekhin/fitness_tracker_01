"""Точка входа API.

Запуск: uv run fastapi dev
Документация API в браузере: http://127.0.0.1:8000/docs
"""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from app.api import catalog, days, me
from app.config import settings


def operation_id(route: APIRoute) -> str:
    """Короткие имена операций (get_day вместо get_day_api_days__date__get).

    Из них фронтенд генерирует функции клиента, поэтому имена должны быть читаемыми.
    """
    return route.name


app = FastAPI(
    title="Fitness Tracker API", version="0.1.0", generate_unique_id_function=operation_id
)

# CORS: разрешаем фронтенду с другого порта (Vite, 5173) обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    """Проверка, что сервер жив."""
    return {"status": "ok"}


# Все адреса данных начинаются с /api, чтобы не путать их со страницами фронтенда
api = APIRouter(prefix="/api")
api.include_router(catalog.router)
api.include_router(days.router)
api.include_router(me.router)
app.include_router(api)
