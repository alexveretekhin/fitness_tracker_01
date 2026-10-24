# 0001. Стек проекта

- Дата: 2026-10-24
- Статус: принято

## Контекст

Нужно лёгкое красивое веб-приложение в стиле Duolingo, с бэкендом на Python и фронтендом на TypeScript. Автор учится, поэтому стек должен быть современным, популярным и с хорошей документацией.

## Решение

| Слой | Выбор |
| --- | --- |
| Пакеты Python | uv |
| Бэкенд | FastAPI + Pydantic v2 |
| База и миграции | SQLModel (SQLAlchemy 2) + Alembic; SQLite на старте, PostgreSQL при деплое |
| Качество Python | Ruff, pytest |
| Сборка фронта | Vite |
| UI | React 19 + TypeScript |
| Стили | Tailwind CSS v4 + shadcn/ui |
| Анимации UI | Motion |
| Роутинг и данные | TanStack Router + TanStack Query |
| Типы API | @hey-api/openapi-ts (генерация из FastAPI) |
| Пакеты JS | pnpm |
| Качество JS | Biome, Vitest |
| Телефон | PWA |
| 3D (этап 9) | React Three Fiber + drei, модели в GLB |

## Альтернативы

- **Next.js вместо Vite.** Его серверная часть дублирует FastAPI, для новичка это лишний слой.
- **Django вместо FastAPI.** Мощнее, но тяжелее, а нам нужен только API.
- **pip + venv вместо uv.** Работает, но медленнее, и версиями Python приходится управлять самому.
- **Svelte/Vue вместо React.** Хорошие, но у React больше уроков, готовых компонентов и есть React Three Fiber для 3D.

## Последствия

- Типы TypeScript генерируются из Python-моделей, поэтому фронт и бэк не расходятся.
- Два языка и два менеджера пакетов (uv и pnpm), команды для каждого в [cheatsheet.md](../cheatsheet.md).
