"""Рендер демо упражнений из одной сцены Blender в MP4 и WebM.

Как устроена сцена (подробно в docs/stages/07-blender-demos.md):
- один персонаж с ригом (Armature), камера, свет и фон общие для всех демо;
- каждое упражнение = отдельный Action, названный ровно как id упражнения
  из app/backend/app/catalog.py, например `push-ups` или `barbell-bench`;
- снаряды лежат в коллекциях с именем `props:<id>,<id>`, например
  `props:barbell-bench,dumbbell-bench`: такая коллекция видна только в этих демо.

Запуск (обычно через render-demos.ps1 рядом):

    blender --background сцена.blend --python render_demos.py -- [опции]

Опции после `--`:
    --list           только показать, какие Action нашлись и к каким упражнениям подходят
    --only a,b       рендерить только эти упражнения
    --preview        быстро и маленьким размером, в art/demos-preview (не в приложение)
    --keep-last      не выкидывать последний кадр (по умолчанию он считается копией первого)
    --rig ИМЯ        какой объект-риг анимировать (по умолчанию первый Armature в сцене)
    --size 512       ширина и высота кадра в пикселях
    --out ПАПКА      куда класть готовые файлы
"""

from __future__ import annotations

import argparse
import ast
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CATALOG = REPO / "app" / "backend" / "app" / "catalog.py"
OUT_DIR = REPO / "app" / "frontend" / "public" / "animations" / "exercises"
PREVIEW_DIR = REPO / "art" / "demos-preview"
PROPS_PREFIX = "props:"
MAX_KB = 500  # ориентир из art/README.md: одно демо до 500 КБ


# ---------- части без Blender (их можно проверить обычным Python) ----------


def exercise_ids(catalog: Path = CATALOG) -> list[str]:
    """Достаёт id упражнений из catalog.py, не импортируя бэкенд."""
    tree = ast.parse(catalog.read_text(encoding="utf-8"))
    for node in tree.body:
        target = getattr(node, "target", None) or (getattr(node, "targets", None) or [None])[0]
        if isinstance(target, ast.Name) and target.id == "EXERCISES":
            return [row.elts[0].value for row in node.value.elts]  # type: ignore[union-attr]
    raise RuntimeError(f"В {catalog} не нашёл список EXERCISES")


def props_targets(collection_name: str) -> set[str] | None:
    """`props:a,b` -> {"a", "b"}; для обычной коллекции None."""
    if not collection_name.startswith(PROPS_PREFIX):
        return None
    return {x.strip() for x in collection_name[len(PROPS_PREFIX) :].split(",") if x.strip()}


def find_ffmpeg() -> str:
    found = shutil.which("ffmpeg")
    if not found:
        sys.exit(
            "Не нашёл ffmpeg. Установи его в PowerShell: winget install Gyan.FFmpeg\n"
            "и перезапусти терминал, чтобы обновился PATH."
        )
    return found


def encode(ffmpeg: str, frames: Path, fps: float, out_base: Path) -> list[Path]:
    """Кадры frames/0001.png... -> out_base.mp4 (H.264) и out_base.webm (VP9)."""
    common = ["-y", "-loglevel", "error", "-framerate", f"{fps:g}", "-i", str(frames / "%04d.png")]
    even = ["-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-pix_fmt", "yuv420p", "-an"]
    jobs = {
        ".mp4": ["-c:v", "libx264", "-preset", "slow", "-crf", "26", "-movflags", "+faststart"],
        ".webm": ["-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0", "-row-mt", "1"],
    }
    made = []
    for ext, codec in jobs.items():
        target = out_base.with_suffix(ext)
        subprocess.run([ffmpeg, *common, *even, *codec, str(target)], check=True)
        made.append(target)
    return made


def size_report(path: Path) -> str:
    kb = path.stat().st_size / 1024
    warn = f"  <- больше {MAX_KB} КБ, сократи длину или размер" if kb > MAX_KB else ""
    return f"{path.name}: {kb:.0f} КБ{warn}"


def parse_args(argv: list[str]) -> argparse.Namespace:
    argv = argv[argv.index("--") + 1 :] if "--" in argv else []
    p = argparse.ArgumentParser(prog="render_demos.py")
    p.add_argument("--list", action="store_true")
    p.add_argument("--only", default="")
    p.add_argument("--preview", action="store_true")
    p.add_argument("--keep-last", action="store_true")
    p.add_argument("--rig", default="")
    p.add_argument("--size", type=int, default=512)
    p.add_argument("--out", default="")
    return p.parse_args(argv)


# ---------- работа внутри Blender ----------


def main() -> None:
    import bpy  # есть только внутри Blender

    args = parse_args(sys.argv)
    scene = bpy.context.scene
    ids = exercise_ids()

    # Риг, который анимируем
    if args.rig:
        rig = bpy.data.objects.get(args.rig)
        if rig is None:
            sys.exit(f"Нет объекта «{args.rig}» в сцене")
    else:
        rig = next((o for o in scene.objects if o.type == "ARMATURE"), None)
        if rig is None:
            sys.exit("В сцене нет ни одного Armature. Укажи риг: --rig ИМЯ")

    # Какие Action подходят к упражнениям
    actions = {a.name: a for a in bpy.data.actions}
    ready = [i for i in ids if i in actions]
    strangers = sorted(set(actions) - set(ids))
    print(f"\nРиг: {rig.name}. Упражнений в каталоге: {len(ids)}, с анимацией: {len(ready)}")
    for name in strangers:
        print(f"  ? Action «{name}» не совпадает ни с одним id упражнения (опечатка?)")
    if args.list:
        for i in ids:
            print(f"  {'+' if i in actions else '-'} {i}")
        return

    if args.only:
        wanted = [x.strip() for x in args.only.split(",") if x.strip()]
        missing = [x for x in wanted if x not in actions]
        if missing:
            sys.exit(f"Нет Action с именами: {', '.join(missing)}")
        ready = wanted
    if not ready:
        sys.exit("Нечего рендерить: назови Action как id упражнения, список: --list")

    ffmpeg = find_ffmpeg()
    out_dir = Path(args.out) if args.out else (PREVIEW_DIR if args.preview else OUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Общие настройки кадра. Сам .blend не сохраняем, всё меняется только на время рендера.
    render = scene.render
    render.resolution_x = render.resolution_y = args.size
    render.resolution_percentage = 50 if args.preview else 100
    settings = render.image_settings
    if hasattr(settings, "media_type"):  # Blender 5: сначала тип «картинка», потом формат
        settings.media_type = "IMAGE"
    settings.file_format = "PNG"
    settings.color_mode = "RGB"
    if args.preview and hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = 8
    fps = render.fps / render.fps_base
    if round(fps) != 24:
        print(f"  ! В сцене {fps:g} кадров/с, договорились о 24 (art/README.md)")

    anim = rig.animation_data or rig.animation_data_create()
    nla_mute = [(t, t.mute) for t in anim.nla_tracks]
    for track, _ in nla_mute:
        track.mute = True  # NLA-дорожки подмешали бы чужие движения
    props = [(c, props_targets(c.name)) for c in bpy.data.collections]
    props = [(c, targets) for c, targets in props if targets is not None]

    for ex_id in ready:
        action = actions[ex_id]
        anim.action = action
        if hasattr(anim, "action_slot") and anim.action_slot is None and len(action.slots):
            anim.action_slot = action.slots[0]  # Blender 4.4+: у Action есть «слоты»
        for coll, targets in props:
            coll.hide_render = ex_id not in targets

        start, end = (int(round(f)) for f in action.frame_range)
        if not args.keep_last and end > start:
            end -= 1  # последний кадр = первый, иначе на стыке петли будет рывок
        print(f"\n{ex_id}: кадры {start}-{end} ({(end - start + 1) / fps:.1f} с)")

        with tempfile.TemporaryDirectory(prefix=f"demo-{ex_id}-") as tmp:
            frames = Path(tmp)
            for n, frame in enumerate(range(start, end + 1), start=1):
                scene.frame_set(frame)
                render.filepath = str(frames / f"{n:04d}.png")
                bpy.ops.render.render(write_still=True)
            for made in encode(ffmpeg, frames, fps, out_dir / ex_id):
                print("  " + size_report(made))

    for track, was in nla_mute:
        track.mute = was
    print(f"\nГотово: {len(ready)} демо в {out_dir}")


if __name__ == "__main__":
    main()
