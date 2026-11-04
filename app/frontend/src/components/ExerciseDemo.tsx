import { AnimatePresence, motion } from "motion/react";

// Демо техники под строкой упражнения: раскрывается вниз по кнопке Play.
// Пока анимации нет, показываем заглушку.
export function ExerciseDemo({ open, src }: { open: boolean; src?: string | null }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-1.5 overflow-hidden rounded-row border border-border"
        >
          {src ? (
            <video src={src} autoPlay muted loop playsInline className="w-full" />
          ) : (
            <div className="grid h-32 place-items-center bg-surface text-sm text-text-faint">
              анимация скоро
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
