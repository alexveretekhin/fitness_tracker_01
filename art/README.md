# Art

Готовые экспорты для приложения: анимации (MP4/WebM), модели (GLB), иконки (SVG).
Исходники .blend/.fbx/.ztl сюда не кладём (они игнорируются git), храним вне репозитория.

Правила для рендеров анимаций: 512x512, 24 кадра/с, 1-3 секунды, до 500 КБ.
Демо упражнений: один риг и одна сцена с одинаковой камерой и светом, меняется только анимация.

## blender/

- `render_demos.py` — рендерит каждый Action, названный как id упражнения, в `app/frontend/public/animations/exercises/<id>.mp4` и `.webm`.
- `render-demos.ps1` — запуск из PowerShell: `.\art\blender\render-demos.ps1 -Blend D:\fitness_tracker_01\demos.blend -List`.

Как подготовить сцену: [docs/stages/07-blender-demos.md](../docs/stages/07-blender-demos.md).
