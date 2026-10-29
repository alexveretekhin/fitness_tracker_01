import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { DayExerciseOut, SetIn, SetOut } from "../api";

type Props = {
  exercise: DayExerciseOut | null; // null = карточка закрыта
  busy: boolean; // идёт запрос к серверу: кнопки ждут
  onAdd: (set: SetIn) => void;
  onUpdate: (setId: number, set: SetIn) => void;
  onDelete: (setId: number) => void;
  onRemove: () => void;
  onClose: () => void;
};

// Карточка упражнения: выезжает снизу при тапе на упражнение на главной.
// Сделал подход, нажал «+ подход», он записался. Следующий подход
// предлагается с тем же весом и повторами, их можно поправить кнопками − / +.
export function SetSheet({ exercise, onClose, ...actions }: Props) {
  return (
    <AnimatePresence>
      {exercise && (
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
            className="absolute inset-x-0 bottom-0 z-20 max-h-[85%] overflow-y-auto rounded-t-[20px] border-t border-border bg-surface p-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            {/* key: для каждого упражнения своё состояние полей */}
            <SetEditor key={exercise.exercise_id} exercise={exercise} {...actions} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type Draft = { weight: string; reps: string };

function draftFrom(set: SetOut | undefined): Draft {
  return { weight: String(set?.weight ?? 0), reps: String(set?.reps ?? 10) };
}

// Строки из полей ввода в числа. Запятую тоже принимаем: «62,5»
function parse(draft: Draft): SetIn | null {
  const weight = Number(draft.weight.replace(",", "."));
  const reps = Number(draft.reps);
  if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(reps) || reps < 1) return null;
  return { weight, reps };
}

export function formatSet(set: SetIn): string {
  return set.weight > 0 ? `${set.weight} кг × ${set.reps}` : `${set.reps} повт.`;
}

function SetEditor({
  exercise,
  busy,
  onAdd,
  onUpdate,
  onDelete,
  onRemove,
}: Omit<Props, "exercise" | "onClose"> & { exercise: DayExerciseOut }) {
  const sets = exercise.sets;
  // Поля сразу заполнены последним подходом, чтобы не вводить одно и то же
  const [draft, setDraft] = useState<Draft>(() => draftFrom(sets.at(-1)));
  const [editingId, setEditingId] = useState<number | null>(null);

  const value = parse(draft);

  const submit = () => {
    if (!value) return;
    if (editingId === null) {
      onAdd(value);
    } else {
      onUpdate(editingId, value);
      setEditingId(null);
      setDraft(draftFrom(sets.at(-1)));
    }
  };

  const startEdit = (set: SetOut) => {
    setEditingId(set.id);
    setDraft(draftFrom(set));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(draftFrom(sets.at(-1)));
  };

  return (
    <>
      <h3 className="mb-3 text-lg">{exercise.name}</h3>

      {sets.length > 0 && (
        <ol className="mb-3">
          {sets.map((s, i) => (
            <li
              key={s.id}
              className={`mb-1.5 flex min-h-tap items-center rounded-row border bg-bg ${
                s.id === editingId ? "border-accent" : "border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => startEdit(s)}
                className="flex min-h-tap flex-1 items-center gap-3 px-3 text-left"
              >
                <span className="w-5 text-text-muted">{i + 1}</span>
                <span>{formatSet(s)}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (s.id === editingId) cancelEdit();
                  onDelete(s.id);
                }}
                disabled={busy}
                aria-label={`Удалить подход ${i + 1}`}
                className="grid size-tap place-items-center text-text-muted"
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      )}

      <p className="mb-1 text-xs text-text-muted">
        {editingId === null
          ? `Подход ${sets.length + 1}`
          : `Правим подход ${sets.findIndex((s) => s.id === editingId) + 1}`}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Stepper
          label="Вес, кг"
          value={draft.weight}
          step={2.5}
          min={0}
          mode="decimal"
          onChange={(weight) => setDraft((d) => ({ ...d, weight }))}
        />
        <Stepper
          label="Повторы"
          value={draft.reps}
          step={1}
          min={1}
          mode="numeric"
          onChange={(reps) => setDraft((d) => ({ ...d, reps }))}
        />
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!value || busy}
        className="mt-3 h-11 w-full rounded-row bg-accent font-bold text-bg active:scale-[0.98] disabled:opacity-50"
      >
        {editingId === null ? "+ подход" : "Сохранить подход"}
      </button>
      {editingId !== null && (
        <button
          type="button"
          onClick={cancelEdit}
          className="mt-2 h-9 w-full text-sm text-text-muted"
        >
          Отмена
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        className="mt-2 h-9 w-full text-sm text-text-muted"
      >
        Убрать упражнение
      </button>
    </>
  );
}

type StepperProps = {
  label: string;
  value: string;
  step: number;
  min: number;
  mode: "decimal" | "numeric";
  onChange: (value: string) => void;
};

// Поле с кнопками − и +. Число можно и просто вписать с клавиатуры.
function Stepper({ label, value, step, min, mode, onChange }: StepperProps) {
  const shift = (delta: number) => {
    const current = Number(value.replace(",", ".")) || 0;
    // Округляем до сотых, чтобы 0.1 + 0.2 не превратилось в 0.30000000000000004
    const next = Math.max(min, Math.round((current + delta) * 100) / 100);
    onChange(String(next));
  };

  const button = "grid size-tap shrink-0 place-items-center text-xl text-accent active:scale-90";

  return (
    // div, а не label: внутри label клик по подписи «нажимал» бы кнопку −
    <div className="text-xs text-text-muted">
      {label}
      <div className="mt-1 flex h-tap items-center rounded-row border border-border bg-bg focus-within:border-accent">
        <button type="button" onClick={() => shift(-step)} className={button} aria-label="Меньше">
          −
        </button>
        <input
          aria-label={label}
          inputMode={mode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-center text-base text-text outline-none"
        />
        <button type="button" onClick={() => shift(step)} className={button} aria-label="Больше">
          +
        </button>
      </div>
    </div>
  );
}
