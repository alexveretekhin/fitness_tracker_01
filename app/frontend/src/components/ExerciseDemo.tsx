import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { demoSources } from "../lib/demo";

// Упражнения, у которых файла демо нет: второй раз не ждём ошибку, сразу заглушка.
const missing = new Set<string>();

// Демо техники под строкой упражнения: раскрывается вниз по кнопке Play.
// Файлы рендерит art/blender/render_demos.py; пока файла нет, показываем заглушку.
export function ExerciseDemo({
  open,
  exerciseId,
  src,
}: {
  open: boolean;
  exerciseId: string;
  src?: string | null;
}) {
  const [failed, setFailed] = useState(() => missing.has(exerciseId));
  const sources = demoSources(exerciseId, src);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-1.5 overflow-hidden rounded-row border border-border"
        >
          {failed ? (
            <div className="grid h-32 place-items-center bg-surface text-sm text-text-faint">
              анимация скоро
            </div>
          ) : (
            <video autoPlay muted loop playsInline className="w-full bg-surface">
              {sources.map((s, i) => (
                <source
                  key={s.src}
                  src={s.src}
                  type={s.type}
                  // Браузер пробует источники по очереди; ошибка последнего = файла нет
                  onError={
                    i === sources.length - 1
                      ? () => {
                          missing.add(exerciseId);
                          setFailed(true);
                        }
                      : undefined
                  }
                />
              ))}
            </video>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
