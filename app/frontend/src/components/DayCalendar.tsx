import { LayoutGroup, motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { useDays } from "../api";
import { monthDays, monthEnd, shiftMonth, weekColumn } from "../lib/calendar";
import { dayKey, fromDayKey, useAppStore } from "../store/useAppStore";
import { WeekStrip } from "./WeekStrip";

const WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const spring = { type: "spring", stiffness: 320, damping: 32 } as const;

type Props = {
  id: string; // своё имя на каждом экране, чтобы огоньки главной и истории не путались
  selected: string | null; // подсвеченный день
  onPick: (key: string) => void;
  anyDay?: boolean; // на главной можно выбрать любой день, в истории только дни с тренировкой
};

// Календарь на главной и в истории. Свёрнут: лента с огоньками.
// Потянул риску вниз (или тапнул по ней): лента раскрывается в целый месяц,
// огоньки перелетают на свои дни и превращаются в точки цвета огонька.
export function DayCalendar({ id, selected, onPick, anyDay = false }: Props) {
  const today = useAppStore((s) => s.today);
  const [expanded, setExpanded] = useState(false);
  const [month, setMonth] = useState(() => shiftMonth(fromDayKey(today), 0));

  // Высоту анимируем сами: меряем содержимое и плавно тянемся к его высоте
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  useLayoutEffect(() => {
    const el = content.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggle = (open: boolean) => {
    setExpanded(open);
    // Свернули: в следующий раз календарь снова откроется на текущем месяце
    if (!open) setMonth(shiftMonth(fromDayKey(today), 0));
  };

  // После свайпа браузер всё равно присылает клик. Его пропускаем,
  // иначе свайп открыл бы календарь, а клик тут же закрыл
  const panned = useRef(false);

  return (
    <LayoutGroup id={id}>
      <motion.div
        initial={false}
        animate={{ height }}
        transition={spring}
        className="overflow-hidden"
      >
        <div ref={content}>
          {expanded ? (
            <MonthView
              month={month}
              selected={selected}
              anyDay={anyDay}
              onMonth={setMonth}
              onPick={(key) => {
                onPick(key);
                // На главной выбрали день: сворачиваемся, чтобы был виден список упражнений
                if (anyDay) toggle(false);
              }}
            />
          ) : (
            <WeekStrip selected={selected} onPick={onPick} />
          )}
        </div>
      </motion.div>
      <motion.button
        type="button"
        aria-label={expanded ? "Свернуть календарь" : "Открыть календарь"}
        aria-expanded={expanded}
        onPointerDown={() => {
          panned.current = false;
        }}
        onPanStart={() => {
          panned.current = true;
        }}
        onPanEnd={(_, info) => {
          if (info.offset.y > 15) toggle(true);
          else if (info.offset.y < -15) toggle(false);
        }}
        onClick={() => {
          if (!panned.current) toggle(!expanded);
        }}
        className="flex h-6 w-full touch-none items-center justify-center"
      >
        <span className="h-1 w-10 rounded-full bg-text-muted" />
      </motion.button>
    </LayoutGroup>
  );
}

type MonthProps = {
  month: Date; // первое число показанного месяца
  selected: string | null;
  anyDay: boolean;
  onMonth: (month: Date) => void;
  onPick: (key: string) => void;
};

// Месяц целиком: стрелки, счётчик тренировок и сетка дней с точками
function MonthView({ month, selected, anyDay, onMonth, onPick }: MonthProps) {
  const today = useAppStore((s) => s.today);
  const days = useDays(dayKey(month), dayKey(monthEnd(month)));
  const doneDays = new Set(days.data?.filter((d) => d.done).map((d) => d.date));
  const isCurrent = dayKey(month) === dayKey(shiftMonth(fromDayKey(today), 0));
  const title = month.toLocaleDateString("en", { month: "long", year: "numeric" });
  const arrow = "grid size-tap place-items-center text-xl text-accent disabled:text-text-faint";

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonth(shiftMonth(month, -1))}
          aria-label="Прошлый месяц"
          className={arrow}
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm uppercase">{title}</p>
          <p className="text-xs text-text-muted">тренировок: {doneDays.size}</p>
        </div>
        <button
          type="button"
          onClick={() => onMonth(shiftMonth(month, 1))}
          disabled={isCurrent} // в будущее не листаем
          aria-label="Следующий месяц"
          className={arrow}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEK.map((name, i) => (
          <small key={name} className={`text-[9px] ${i >= 5 ? "text-weekend" : "text-text-muted"}`}>
            {name}
          </small>
        ))}
        {monthDays(month).map((d, i) => {
          const key = dayKey(d);
          const done = doneDays.has(key);
          const cell = `rounded-md py-1 ${key === selected ? "bg-surface-strong" : ""}`;
          // 1-е число встаёт в колонку своего дня недели, остальные идут следом
          const style = i === 0 ? { gridColumnStart: weekColumn(d) + 1 } : undefined;
          const content = (
            <>
              <motion.span
                layoutId={`num-${key}`}
                transition={spring}
                className={`block text-[13px] ${key === today ? "text-accent" : ""}`}
              >
                {d.getDate()}
              </motion.span>
              <motion.span
                layoutId={`mark-${key}`}
                transition={spring}
                className={`mx-auto mt-0.5 block size-1.5 rounded-full ${done ? "bg-dot" : ""}`}
              />
            </>
          );
          return done || anyDay ? (
            <button
              type="button"
              key={key}
              style={style}
              onClick={() => onPick(key)}
              aria-label={`${done ? "Тренировка" : "День"} ${d.toLocaleDateString("ru", { day: "numeric", month: "long" })}`}
              className={`${cell} active:bg-surface-strong ${done ? "" : "text-text-muted"}`}
            >
              {content}
            </button>
          ) : (
            <span key={key} style={style} className={`${cell} text-text-muted`}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
