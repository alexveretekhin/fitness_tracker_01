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

## Проверить инструменты

```powershell
uv --version
node --version
pnpm --version
```

## Бэкенд (появится на этапе 2)

```powershell
cd app\backend
uv sync                          # поставить зависимости, создать .venv
uv run fastapi dev app/main.py   # запустить сервер
uv run pytest                    # тесты
uv run ruff check .              # проверка кода
```

## Фронтенд (появится на этапе 3)

```powershell
cd app\frontend
pnpm install   # поставить зависимости
pnpm dev       # запустить в режиме разработки
pnpm build     # собрать для продакшена
```
