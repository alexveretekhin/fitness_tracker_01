import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { type DaySummary, useDay, useDays } from "../api";
import { DayCalendar } from "../components/DayCalendar";
import { Icon } from "../components/Icon";
import { StatsSheet } from "../components/StatsSheet";
import { ListRow, Panel, QueryState } from "../components/ui";
import { addDays, dayKey, fromDayKey, useAppStore } from "../store/useAppStore";

// "2026-10-29" → "29.10"
function formatDate(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}`;
}

// История: сверху календарь (лента с огоньками, раскрывается в месяц с точками),
// ниже дни с тренировками за год, новые сверху. Тап по дню раскрывает под ним
// упражнения с подходами и весом. Иконка графика справа открывает прогресс.
// Оранжевый кубок = в этот день побит рекорд (ADR 0012).
export function History() {
  const today = fromDayKey(useAppStore((s) => s.today));
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [statsDate, setStatsDate] = useState<string | null>(null);
  const days = useDays(dayKey(addDays(today, -365)), dayKey(addDays(today, 7)));

  const list = (days.data ?? []).filter((d) => d.done);

  return (
    <>
      <Panel>
        <DayCalendar
          id="history-calendar"
          selected={openDate}
          onPick={(date) => {
            // День без тренировки в календаре ничего не раскрывает
            if (list.some((d) => d.date === date)) setOpenDate(date);
          }}
        />
      </Panel>

      <Panel className="mt-2.5 flex-1 overflow-y-auto">
        <QueryState isPending={days.isPending} isError={days.isError} />
        {days.isSuccess && list.length === 0 ? (
          <div className="grid h-full place-items-center text-text-faint">HISTORY</div>
        ) : (
          list.map((d) => (
            <DayGroup
              key={d.date}
              day={d}
              open={d.date === openDate}
              onToggle={() => setOpenDate(d.date === openDate ? null : d.date)}
              onStats={() => setStatsDate(d.date)}
            />
          ))
        )}
      </Panel>

      <StatsSheet date={statsDate} onClose={() => setStatsDate(null)} />
    </>
  );
}

type GroupProps = {
  day: DaySummary;
  open: boolean;
  onToggle: () => void;
  onStats: () => void;
};

// Строка дня. Раскрывается вниз так же, как демо техники в списке упражнений.
function DayGroup({ day, open, onToggle, onStats }: GroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <ListRow
        onClick={onToggle}
        right={
          <>
            {(day.records ?? 0) > 0 && (
              <span
                className="mr-2 flex items-center gap-0.5 text-xs text-accent"
                title="Рекорды в этот день"
              >
                <Icon name="trophy" className="size-4" />
                {(day.records ?? 0) > 1 && day.records}
              </span>
            )}
            <span className="text-xs text-text-muted">{day.done_exercises.length} упр.</span>
            <button
              type="button"
              onClick={onStats}
              aria-label={`График прогресса за ${formatDate(day.date)}`}
              className="grid size-tap place-items-center text-text-muted active:text-accent"
            >
              <Icon name="chart" className="size-5" />
            </button>
          </>
        }
      >
        <span className="text-accent">{formatDate(day.date)}</span>
      </ListRow>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            variants={{ closed: { height: 0, opacity: 0 }, open: { height: "auto", opacity: 1 } }}
            initial="closed"
            animate="open"
            exit="closed"
            // Раскрылся: подкручиваем список, чтобы день было видно целиком
            onAnimationComplete={(name) =>
              name === "open" &&
              ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
            }
            className="mb-1.5 overflow-hidden rounded-row border border-border"
          >
            <DayDetails date={day.date} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Что было в этот день: список упражнений. Подходы упражнения раскрываются по тапу.
function DayDetails({ date }: { date: string }) {
  const day = useDay(date);
  const exercises = (day.data?.exercises ?? []).filter((e) => e.sets.length > 0);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="bg-surface px-3 py-1">
      <QueryState isPending={day.isPending} isError={day.isError} />
      {exercises.map((e) => {
        const open = e.exercise_id === openId;
        return (
          <div key={e.exercise_id}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : e.exercise_id)}
              className="flex min-h-tap w-full items-center gap-2 text-left"
            >
              <span className={`text-text-muted transition ${open ? "rotate-90" : ""}`}>›</span>
              <span className="flex-1">{e.name}</span>
              {e.sets.some((s) => s.record) && (
                <Icon name="trophy" className="size-4 text-accent" />
              )}
              <span className="text-xs text-text-muted">{e.sets.length} подх.</span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.ol
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-2 ml-1 overflow-hidden border-l-2 border-dot pl-2 text-sm text-text-muted"
                >
                  {e.sets.map((s, i) => (
                    <li
                      key={s.id}
                      className="relative before:absolute before:top-1/2 before:-left-2 before:h-0.5 before:w-1.5 before:bg-dot"
                    >
                      <span className="inline-block w-5">{i + 1}</span>
                      {/* В истории вес пишем всегда, даже 0, чтобы было видно, с чем делал */}
                      {s.weight} кг × {s.reps} повт.
                      {s.record && (
                        <Icon name="trophy" className="ml-1.5 size-3.5 align-[-2px] text-accent" />
                      )}
                    </li>
                  ))}
                </motion.ol>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
