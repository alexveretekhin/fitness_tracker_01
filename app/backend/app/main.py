"""Точка входа API.

Запуск: uv run fastapi dev
Документация API в браузере: http://127.0.0.1:8000/docs
"""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import catalog, days, me
from app.config import settings

app = FastAPI(title="Fitness Tracker API", version="0.1.0")

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
