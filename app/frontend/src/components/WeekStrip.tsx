import { motion } from "motion/react";
import { useDays } from "../api";
import { addDays, dayKey, fromDayKey, useAppStore } from "../store/useAppStore";
import { Icon } from "./Icon";

const NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const HALF = 4; // 9 дней как в макете: 4 дня назад, сегодня, 4 дня вперёд

// Если выбран далёкий день (например, из истории), лента встаёт вокруг него,
// иначе его не было бы видно
function visibleDays(today: string, selected: string | null): Date[] {
  const far =
    selected !== null &&
    Math.abs(fromDayKey(selected).getTime() - fromDayKey(today).getTime()) > HALF * 86_400_000;
  const center = fromDayKey(far ? selected : today);
  return Array.from({ length: HALF * 2 + 1 }, (_, i) => addDays(center, i - HALF));
}

type Props = {
  selected: string | null; // подсвеченный день
  onPick: (key: string) => void;
};

// Лента дней с огоньками. На главной выбирает день, в истории раскрывает день в списке.
// layoutId у числа и огонька нужны календарю истории: при раскрытии
// они перелетают на свои места в сетке месяца (см. HistoryCalendar).
export function WeekStrip({ selected, onPick }: Props) {
  const today = useAppStore((s) => s.today);
  const visible = visibleDays(today, selected);
  // Одним запросом узнаём, в какие из видимых дней была тренировка
  const summary = useDays(dayKey(visible[0]), dayKey(visible[visible.length - 1]));
  const doneDays = new Set(summary.data?.filter((d) => d.done).map((d) => d.date));

  return (
    <div className="grid grid-cols-9 text-center">
      {visible.map((d) => {
        const key = dayKey(d);
        const weekend = d.getDay() === 0 || d.getDay() === 6;
        const done = doneDays.has(key);
        return (
          <button
            type="button"
            key={key}
            onClick={() => onPick(key)}
            className={`rounded-md py-1 ${key === selected ? "bg-surface-strong" : ""}`}
          >
            <small className={`block text-[9px] ${weekend ? "text-weekend" : "text-text"}`}>
              {NAMES[d.getDay()]}
            </small>
            <motion.b
              layoutId={`num-${key}`}
              className={`block text-[13px] font-normal ${key === today ? "text-accent" : ""}`}
            >
              {d.getDate()}
            </motion.b>
            <motion.span layoutId={`mark-${key}`} className="mx-auto mt-0.5 block h-4 w-3.5">
              <motion.span
                key={done ? "on" : "off"}
                initial={done ? { scale: 1.8 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="block size-full"
              >
                <Icon
                  name="flame"
                  className={`size-full ${done ? "text-flame-on" : "text-flame-off"}`}
                />
              </motion.span>
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
