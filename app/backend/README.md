# Backend

API фитнес-трекера на FastAPI. Подробный разбор: [docs/stages/02-backend.md](../../docs/stages/02-backend.md).

## Запуск (PowerShell)

```powershell
cd app\backend
uv sync                       # поставить Python 3.13 и зависимости в .venv
uv run alembic upgrade head   # создать таблицы в fitness.db
uv run python -m app.seed     # заполнить каталог упражнений
uv run fastapi dev            # запустить сервер с автоперезагрузкой
```

Открой http://127.0.0.1:8000/docs: там все адреса API, их можно вызывать прямо из браузера.

## Структура

```
app/
  main.py      # создаёт приложение, подключает роутеры
  config.py    # настройки из .env
  db.py        # подключение к базе
  models.py    # таблицы
  schemas.py   # что API принимает и отдаёт
  deps.py      # общие зависимости: сессия базы, текущий пользователь
  catalog.py   # стартовый список мышц и упражнений
  seed.py      # заливает каталог в базу
  progress.py  # правила XP и уровней (числа меняются здесь)
  api/
    catalog.py # /api/muscle-groups, /api/exercises
    days.py    # /api/days: упражнения дня, подходы, огоньки
    me.py      # /api/me: аватар
    progress.py # /api/me/progress: XP и уровень
    stats.py   # /api/exercises/{id}/stats: данные для графиков в истории
migrations/    # история изменений схемы базы (Alembic)
tests/         # тесты (uv run pytest)
```

## Адреса API

| Метод | Адрес | Что делает |
| --- | --- | --- |
| GET | `/health` | Сервер жив |
| GET | `/api/muscle-groups` | Группы мышц по порядку |
| GET | `/api/muscle-groups/{id}/exercises` | Упражнения, где группа основная |
| GET | `/api/exercises?q=bench` | Поиск упражнений |
| GET | `/api/days?from=…&to=…` | Сводка по дням: огоньки для ленты недели и история |
| GET | `/api/days/{date}` | Упражнения дня |
| POST | `/api/days/{date}/exercises` | Добавить упражнение в день |
| DELETE | `/api/days/{date}/exercises/{id}` | Убрать упражнение из дня вместе с подходами |
| POST | `/api/days/{date}/exercises/{id}/sets` | Записать подход: вес и повторы |
| PUT | `/api/days/{date}/exercises/{id}/sets/{set_id}` | Исправить подход |
| DELETE | `/api/days/{date}/exercises/{id}/sets/{set_id}` | Удалить подход |
| DELETE | `/api/days` | Удалить все тренировки (Reset data) |
| GET/PUT | `/api/me` | Профиль и аватар |
| GET | `/api/me/progress` | XP и уровень |
| GET | `/api/exercises/{id}/stats?from=…&to=…` | Сила (e1RM), лучший вес, повторы и объём упражнения по дням (графики) |

## Схема API для фронтенда

После изменения API обнови клиент фронтенда: в `app\frontend` выполни `pnpm api`. Команда вызывает `uv run python -m app.export_openapi` и перегенерирует `src/api/generated`.
