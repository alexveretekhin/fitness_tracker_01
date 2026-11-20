// Где лежит демо упражнения. Скрипт art/blender/render_demos.py кладёт
// <id>.webm и <id>.mp4 в public/animations/exercises, поэтому достаточно знать id.
// Если в каталоге у упражнения указан свой путь (поле demo), берём его без расширения.
export const DEMO_DIR = "/animations/exercises";

export type DemoSource = { src: string; type: string };

export function demoSources(exerciseId: string, demo?: string | null): DemoSource[] {
  const base = demo ? demo.replace(/\.(mp4|webm|webp|gif)$/i, "") : `${DEMO_DIR}/${exerciseId}`;
  return [
    // WebM (VP9) меньше по весу, его берут Chrome, Firefox, Android и новые iPhone
    { src: `${base}.webm`, type: "video/webm" },
    // MP4 (H.264) открывается везде: запасной вариант
    { src: `${base}.mp4`, type: "video/mp4" },
  ];
}
