# Frontend

Интерфейс на Vite + React + TypeScript. Подробный разбор: [docs/stages/03-frontend.md](../../docs/stages/03-frontend.md).

## Запуск (PowerShell)

Сначала запусти бэкенд в отдельном окне (`app\backend`, `uv run fastapi dev`), потом:

```powershell
cd app\frontend
pnpm install   # поставить зависимости
pnpm dev       # http://localhost:5173
```

## Структура

```
src/
  main.tsx       # точка входа
  router.tsx     # адреса экранов
  api/           # связь с бэкендом
    index.ts     #   общие запросы и кэш
    generated/   #   клиент из схемы API (pnpm api), руками не править
  screens/       # экраны
  components/    # повторяющиеся части интерфейса
  lib/           # логика без интерфейса: разбор фраз, распознавание речи (+ тесты *.test.ts)
  store/         # состояние приложения (Zustand)
  styles/        # Tailwind и токены дизайна
  assets/icons/  # SVG-иконки
public/          # картинки и анимации, отдаются как есть
openapi.json     # схема API бэкенда
```
