# Fitness Tracker

Лёгкий фитнес-трекер в стиле Duolingo с эстетикой dark fantasy: стрики с огоньком, выбор упражнений по группам мышц, анимации из Blender. Позже добавится 3D-аватар для выбора мышц.

## Стек

| Часть | Технологии |
| --- | --- |
| Бэкенд | Python, FastAPI, SQLModel, Alembic, uv |
| Фронтенд | TypeScript, React, Vite, Tailwind CSS, shadcn/ui, Motion |
| База | SQLite на старте, PostgreSQL позже |

Почему именно так, написано в [docs/decisions/0001-stack.md](docs/decisions/0001-stack.md).

## Структура

```
app/
  backend/    # API на FastAPI (этап 2)
  frontend/   # интерфейс на React (этап 3)
art/          # экспорт анимаций и моделей для приложения (исходники .blend в git не кладём)
docs/
  stages/     # что сделано на каждом этапе, по шагам
  decisions/  # почему выбрано так, а не иначе (ADR)
  glossary.md # словарь терминов
  cheatsheet.md # команды на каждый день
```

## С чего начать

1. Прочитай [docs/stages/00-setup.md](docs/stages/00-setup.md): там всё про установку инструментов.
2. Шпаргалка по командам: [docs/cheatsheet.md](docs/cheatsheet.md).
3. Непонятное слово ищи в [docs/glossary.md](docs/glossary.md).
