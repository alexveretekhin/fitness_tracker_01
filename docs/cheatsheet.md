# Шпаргалка

Все команды для PowerShell. Раздел пополняется с каждым этапом.

## Git

```powershell
git status                      # что изменилось
git pull                        # подтянуть изменения с GitHub
git checkout -b stage-1-design  # создать ветку и перейти в неё
git add .                       # подготовить все изменения к коммиту
git commit -m "feat: ..."       # сохранить снимок
git push -u origin stage-1-design  # отправить ветку на GitHub
git checkout main               # вернуться в main
```

## Если «uv» или «pnpm» not recognized

```powershell
$env:Path = "$env:USERPROFILE\.local\bin;$env:APPDATA\npm;$env:Path"  # только для этого окна
```

Насовсем помогает полный перезапуск VS Code (File → Exit) или компьютера.

## Проверить инструменты

```powershell
uv --version
node --version
pnpm --version
```

## Бэкенд

```powershell
cd app\backend
uv sync                                    # поставить зависимости, создать .venv
uv run alembic upgrade head                # применить миграции к базе (после каждого git pull!)
uv run python -m app.seed                  # залить каталог упражнений
uv run fastapi dev                         # запустить сервер, docs: http://127.0.0.1:8000/docs
uv run pytest                              # тесты
uv run ruff check . ; uv run ruff format . # проверка и форматирование кода
uv run alembic revision --autogenerate -m "что поменял"  # миграция после правки models.py
uv add <пакет>                             # добавить библиотеку
```

## Фронтенд

```powershell
cd app\frontend
pnpm install   # поставить зависимости
pnpm dev       # запустить, адрес http://localhost:5173 (бэкенд должен работать в другом окне)
pnpm dev:https # то же по https: для микрофона с телефона, https://192.168.1.11:5173
pnpm test      # тесты фронтенда (Vitest)
pnpm lint      # проверка кода Biome
pnpm format    # исправить форматирование
pnpm build     # проверка типов и сборка для продакшена
pnpm api       # после изменений API на бэкенде: обновить клиент в src/api/generated
pnpm add <пакет>  # добавить библиотеку
```

## Дизайн

```powershell
start docs\design\showcase.html          # открыть витрину
python docs\design\build_showcase.py     # пересобрать витрину после правок
```
