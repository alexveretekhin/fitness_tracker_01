"""Собирает showcase.html: вставляет SVG-иконки в шаблон.

Иконки встраиваются прямо в HTML, чтобы цвет задавался через CSS (currentColor)
и страница открывалась двойным кликом, без сервера.

Запуск из корня репозитория:
    python docs/design/build_showcase.py
"""

from pathlib import Path

HERE = Path(__file__).parent
ICONS = HERE.parent.parent / "app" / "frontend" / "src" / "assets" / "icons"


def main() -> None:
    html = (HERE / "showcase.template.html").read_text(encoding="utf-8")
    for svg in sorted(ICONS.glob("*.svg")):
        html = html.replace("{{" + svg.stem + "}}", svg.read_text(encoding="utf-8").strip())
    (HERE / "showcase.html").write_text(html, encoding="utf-8")
    print("showcase.html собран")


if __name__ == "__main__":
    main()
