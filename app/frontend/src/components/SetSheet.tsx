import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { SetLog } from "../store/useAppStore";

type Props = {
  title: string | null; // null = карточка закрыта
  initial: SetLog | null;
  onSave: (log: SetLog) => void;
  onRemove: () => void;
  onClose: () => void;
};

const fields: { key: keyof SetLog; label: string; mode: "decimal" | "numeric" }[] = [
  { key: "weight", label: "Вес, кг", mode: "decimal" },
  { key: "sets", label: "Подходы", mode: "numeric" },
  { key: "reps", label: "Повторы", mode: "numeric" },
];

// Карточка подходов: выезжает снизу при тапе на упражнение на главной
export function SetSheet({ title, initial, onSave, onRemove, onClose }: Props) {
  const [values, setValues] = useState({ weight: "", sets: "3", reps: "10" });

  useEffect(() => {
    if (title) {
      setValues({
        weight: initial ? String(initial.weight) : "",
        sets: String(initial?.sets ?? 3),
        reps: String(initial?.reps ?? 10),
      });
    }
  }, [title, initial]);

  const save = () => {
    onSave({
      weight: Number(values.weight.replace(",", ".")) || 0,
      sets: Number(values.sets) || 0,
      reps: Number(values.reps) || 0,
    });
  };

  return (
    <AnimatePresence>
      {title && (
        <>
          <motion.button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 z-10 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 z-20 rounded-t-[20px] border-t border-border bg-surface p-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            <h3 className="mb-3 text-lg">{title}</h3>
            <div className="grid grid-cols-3 gap-2">
              {fields.map((f) => (
                <label key={f.key} className="text-xs text-text-muted">
                  {f.label}
                  <input
                    inputMode={f.mode}
                    value={values[f.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="mt-1 h-tap w-full rounded-row border border-border bg-bg text-center text-base text-text outline-none focus:border-accent"
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={save}
              className="mt-3 h-11 w-full rounded-row bg-accent font-bold text-bg active:scale-[0.98]"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="mt-2 h-9 w-full text-sm text-text-muted"
            >
              Убрать упражнение
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
