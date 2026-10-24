"""Сохраняет схему API (OpenAPI) в файл. По ней фронтенд генерирует свой клиент.

Запуск: uv run python -m app.export_openapi ../frontend/openapi.json
"""

import json
import sys
from pathlib import Path

from app.main import app

if __name__ == "__main__":
    target = Path(sys.argv[1] if len(sys.argv) > 1 else "openapi.json")
    schema = json.dumps(app.openapi(), ensure_ascii=False, indent=2)
    target.write_text(schema + "\n", encoding="utf-8")
    print(f"Схема API сохранена в {target}")
