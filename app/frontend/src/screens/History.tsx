import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { type DaySummary, useDay, useDays, useExerciseCatalog } from "../api";
import { HistoryCalendar } from "../components/HistoryCalendar";
import { formatSet } from "../components/SetSheet";
import { ListRow, Panel, QueryState } from "../components/ui";
import { addDays, dayKey, fromDayKey, useAppStore } from "../store/useAppStore";

// "2026-10-29" → "29.10"
function formatDate(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}`;
}

// История: сверху календарь (лента с огоньками, раскрывается в месяц с точками),
// ниже дни с тренировками за год, новые сверху. Тап по дню раскрывает под ним
// упражнения с подходами и весом.
export function History() {
  const today = fromDayKey(useAppStore((s) => s.today));
  const [openDate, setOpenDate] = useState<string | null>(null);
  const days = useDays(dayKey(addDays(today, -365)), dayKey(addDays(today, 7)));

  const list = (days.data ?? []).filter((d) => d.done);

  return (
    <>
      <Panel>
        <HistoryCalendar
          openDate={openDate}
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
            />
          ))
        )}
      </Panel>
    </>
  );
}

type GroupProps = { day: DaySummary; open: boolean; onToggle: () => void };

// Строка дня. Раскрывается вниз так же, как демо техники в списке упражнений.
function DayGroup({ day, open, onToggle }: GroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <ListRow
        onClick={onToggle}
        right={<span className="text-xs text-text-muted">{day.done_exercises.length} упр.</span>}
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

// Что было в этот день: упражнения и их подходы. Данные грузятся при раскрытии.
function DayDetails({ date }: { date: string }) {
  const day = useDay(date);
  const catalog = useExerciseCatalog().data; // отсюда берём демо-анимацию упражнения
  const exercises = (day.data?.exercises ?? []).filter((e) => e.sets.length > 0);

  return (
    <div className="bg-surface px-3 py-2">
      <QueryState isPending={day.isPending} isError={day.isError} />
      {exercises.map((e) => {
        const demo = catalog?.[e.exercise_id]?.demo;
        return (
          <div key={e.exercise_id} className="mb-3">
            <p className="mb-1.5">{e.name}</p>
            <div className="flex items-start gap-3">
              {/* Превью техники слева, пока анимаций нет, тут заглушка */}
              <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-md bg-black text-[10px] text-text-faint">
                {demo ? (
                  <video
                    src={demo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="size-full object-cover"
                  />
                ) : (
                  "анимация скоро"
                )}
              </div>
              {/* Подходы справа, собраны оранжевой скобкой */}
              <ol className="border-l-2 border-dot pl-2 text-sm text-text-muted">
                {e.sets.map((s, i) => (
                  <li
                    key={s.id}
                    className="relative before:absolute before:top-1/2 before:-left-2 before:h-0.5 before:w-1.5 before:bg-dot"
                  >
                    <span className="inline-block w-5">{i + 1}</span>
                    {formatSet(s)}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );
      })}
    </div>
  );
}
