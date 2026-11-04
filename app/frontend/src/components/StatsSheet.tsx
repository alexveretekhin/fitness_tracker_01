import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { type RecordOut, useDay, useExerciseRecord, useExerciseStats } from "../api";
import { buildSeries, formatValue, type Metric, type Range, since } from "../lib/stats";
import { fromDayKey, useAppStore } from "../store/useAppStore";
import { Icon } from "./Icon";
import { ProgressChart } from "./ProgressChart";

// Окно с графиком: выезжает снизу по иконке графика на дне в истории.
// Сверху упражнения этого дня, ниже переключатели «Сила / Объём» и «Месяц / Год».
export function StatsSheet({ date, onClose }: { date: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {date && (
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
            <DayStats key={date} date={date} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DayStats({ date }: { date: string }) {
  const exercises = (useDay(date).data?.exercises ?? []).filter((e) => e.sets.length > 0);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("strength");
  const [range, setRange] = useState<Range>("month");
  const current = exercises.find((e) => e.exercise_id === pickedId) ?? exercises[0];

  return (
    <>
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {exercises.map((e) => (
          <button
            type="button"
            key={e.exercise_id}
            onClick={() => setPickedId(e.exercise_id)}
            className={`shrink-0 rounded-row border px-3 py-1.5 text-sm ${
              e === current ? "border-accent text-accent" : "border-border text-text-muted"
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      <div className="mb-3 flex justify-between gap-2">
        <Toggle
          value={metric}
          onChange={setMetric}
          options={[
            ["strength", "Сила"],
            ["volume", "Объём"],
          ]}
        />
        <Toggle
          value={range}
          onChange={setRange}
          options={[
            ["month", "Месяц"],
            ["year", "Год"],
          ]}
        />
      </div>

      {current && <ExerciseChart exerciseId={current.exercise_id} metric={metric} range={range} />}
    </>
  );
}

function ExerciseChart({
  exerciseId,
  metric,
  range,
}: {
  exerciseId: string;
  metric: Metric;
  range: Range;
}) {
  const today = useAppStore((s) => s.today);
  const stats = useExerciseStats(exerciseId, since(today), today);
  // Рекордная тренировка: на графике «Сила» над её точкой кубок
  const record = useExerciseRecord(exerciseId).data ?? null;
  if (!stats.data) return <div className="h-56" />;

  const series = buildSeries(stats.data, metric, range, today, record?.date ?? null);
  const first = series.points[0];
  const last = series.points.at(-1);
  const delta = first && last ? last.value - first.value : 0;

  return (
    <>
      {/* key: выбранная точка сбрасывается на последнюю при смене режима */}
      <ProgressChart
        key={`${exerciseId}-${metric}-${range}`}
        series={series}
        recordCard={
          metric === "strength" && record ? (
            <RecordCard exerciseId={exerciseId} record={record} />
          ) : undefined
        }
      />
      {first && last && series.points.length > 1 && (
        <p className="mt-2 text-center text-sm text-text-muted">
          было {formatValue(first.value)} → стало {formatValue(last.value)} {series.unit}{" "}
          <span className={delta > 0 ? "text-accent" : ""}>
            ({delta > 0 ? "+" : ""}
            {formatValue(delta)})
          </span>
        </p>
      )}
      <p className="mt-3 text-center text-[11px] text-text-faint">
        {metric === "strength"
          ? series.unit === "кг"
            ? "Сила: сколько поднял бы на 1 раз, по лучшему подходу. Вес × (1 + повторы / 30)"
            : "Больше всего повторов в подходе"
          : series.unit === "кг"
            ? "Объём: сумма «вес × повторы» за тренировку"
            : "Все повторы за тренировку"}
        {range === "year" && ", лучшая тренировка месяца"}
      </p>
    </>
  );
}

// "2026-06-06" → "6 июня 2026"
function longDate(date: string): string {
  return fromDayKey(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Окошко по тапу на кубок: когда была рекордная тренировка и все подходы
// этого упражнения в тот день, рекордный подход с кубком
function RecordCard({ exerciseId, record }: { exerciseId: string; record: RecordOut }) {
  const day = useDay(record.date).data;
  const sets = day?.exercises.find((e) => e.exercise_id === exerciseId)?.sets ?? [];

  return (
    <>
      <p className="flex items-center gap-1.5 pr-6 text-sm text-accent">
        <Icon name="trophy" className="size-4" />
        Рекордная тренировка
      </p>
      <p className="mt-0.5 text-xs text-text-muted">{longDate(record.date)}</p>
      <ol className="mt-2 text-sm">
        {sets.map((s, i) => (
          <li key={s.id} className={`flex items-center gap-2 ${s.record ? "text-accent" : ""}`}>
            <span className="w-4 text-text-faint">{i + 1}</span>
            {s.weight > 0 ? `${formatValue(s.weight)} кг × ${s.reps}` : `${s.reps} повт.`}
            {s.record && <Icon name="trophy" className="size-3.5" />}
          </li>
        ))}
      </ol>
      {record.weight > 0 && (
        <p className="mt-2 text-xs text-text-faint">
          Сила лучшего подхода ≈ {formatValue(record.strength)} кг
        </p>
      )}
    </>
  );
}

type ToggleProps<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
};

// Переключатель из двух кнопок, выбранная оранжевая
function Toggle<T extends string>({ value, onChange, options }: ToggleProps<T>) {
  return (
    <div className="flex rounded-row border border-border p-0.5">
      {options.map(([v, label]) => (
        <button
          type="button"
          key={v}
          aria-pressed={v === value}
          onClick={() => onChange(v)}
          className={`rounded-[6px] px-3 py-1 text-xs ${
            v === value ? "bg-surface-strong text-accent" : "text-text-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
