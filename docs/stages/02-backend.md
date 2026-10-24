# Этап 2. Скелет бэкенда

## Цель

Работающий API на FastAPI с базой данных: каталог мышц и упражнений, дни тренировок, подходы и огоньки. Фронтенд (этап 3) будет брать данные отсюда.

## Что сделали

- Проект на uv: [pyproject.toml](../../app/backend/pyproject.toml), зависимости зафиксированы в `uv.lock`, версия Python в `.python-version` (3.13).
- Таблицы: [models.py](../../app/backend/app/models.py). Пользователь, группы мышц, упражнения, связь «упражнение ↔ мышцы» (основная/вспомогательная), день тренировки, упражнение дня с весом, подходами и повторами.
- API: [app/api](../../app/backend/app/api). Каталог, дни, профиль. Список адресов в [README бэкенда](../../app/backend/README.md).
- Миграции Alembic: [migrations/versions](../../app/backend/migrations/versions). Первая создаёт все таблицы.
- Каталог: 9 групп мышц и 40 упражнений в [catalog.py](../../app/backend/app/catalog.py), заливаются командой seed.
- 11 тестов: [tests/test_api.py](../../app/backend/tests/test_api.py).
- Проверка на GitHub: [.github/workflows/backend.yml](../../.github/workflows/backend.yml). На каждый PR запускаются Ruff и тесты.
- Решения о модели данных: [ADR 0003](../decisions/0003-data-model.md).

## Новые технологии

| Что | Простыми словами |
| --- | --- |
| FastAPI | Фреймворк для API. Пишешь функцию с типами, он сам проверяет входные данные и рисует документацию на `/docs` |
| Эндпоинт | Один адрес API + метод: `GET /api/muscle-groups` |
| GET / POST / PUT / DELETE | Получить / создать / заменить / удалить |
| Pydantic | Проверяет данные по типам. Отрицательный вес вернёт ошибку 422 ещё до нашего кода |
| SQLModel | ORM: таблица описывается классом Python, строки базы становятся объектами |
| SQLite | База в одном файле `fitness.db`. Для разработки идеально, для продакшена сменим на PostgreSQL |
| Alembic | Миграции: история изменений структуры базы. Поменял модель → сгенерировал миграцию → применил |
| Seed | Скрипт, который заполняет базу стартовыми данными |
| Depends | Механизм FastAPI: функция объявляет, что ей нужно (сессия базы, пользователь), и FastAPI это подставляет |
| CORS | Правило браузера: сайт с одного адреса не может ходить в API на другом, пока API не разрешит |
| pytest | Тесты: маленькие функции, которые вызывают API и проверяют ответ |
| GitHub Actions | Робот на GitHub, который на каждый PR запускает проверки |

## Как запустить и проверить

```powershell
cd D:\fitness_tracker_01\fitness_tracker
git checkout main
git pull
cd app\backend
uv sync
uv run alembic upgrade head
uv run python -m app.seed
uv run fastapi dev
```

Открой http://127.0.0.1:8000/docs, раскрой `GET /api/muscle-groups/{group_id}/exercises`, нажми **Try it out**, впиши `chest` и **Execute**.

Тесты и проверка кода:

```powershell
uv run pytest
uv run ruff check .
```

## На что обратить внимание

- **Один пользователь.** Аккаунтов пока нет (этап 6), все данные пишутся первому пользователю.
- **Дата дня приходит от фронтенда.** Календарный день берём с телефона пользователя, поэтому тренировка в 23:30 не уедет на завтра из-за часовых поясов. Время создания записи храним в UTC.
- **Огонёк горит**, когда в дне записан хотя бы один подход. Просто добавленное упражнение огонёк не зажигает.
- **Менял модель → делай миграцию:** `uv run alembic revision --autogenerate -m "что поменял"`, проверь файл в `migrations/versions`, потом `uv run alembic upgrade head`.
- **`fitness.db` не в git.** У каждого своя локальная база. Сломалась? Удали файл и повтори `alembic upgrade head` и `seed`.
- **Старый `.venv` в корне** больше не нужен, uv создал свой в `app\backend\.venv`. В VS Code выбери интерпретатор из него: Ctrl+Shift+P → Python: Select Interpreter.

## Задание для тебя

1. Добавь своё упражнение в [catalog.py](../../app/backend/app/catalog.py) (например, `("incline-bench", "Incline bench", ["chest"], ["shoulders"], None)`), запусти `uv run python -m app.seed` и найди его на `/docs` через `GET /api/exercises?q=incline`.
2. Через `/docs` добавь упражнение в сегодняшний день (`POST /api/days/{date}/exercises`), запиши подходы (`PUT`) и посмотри, как в `GET /api/days` появился `"done": true`.
