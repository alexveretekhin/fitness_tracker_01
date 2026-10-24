import { motion } from "motion/react";
import { dayKey, isDayDone, useAppStore } from "../store/useAppStore";
import { Icon } from "./Icon";

const NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// 9 дней как в макете: 4 дня назад, сегодня, 4 дня вперёд
function visibleDays(): Date[] {
  const today = new Date();
  return Array.from({ length: 9 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 4);
    return d;
  });
}

export function WeekStrip() {
  const days = useAppStore((s) => s.days);
  const selected = useAppStore((s) => s.selectedDay);
  const selectDay = useAppStore((s) => s.selectDay);
  const today = dayKey(new Date());

  return (
    <div className="grid grid-cols-9 text-center">
      {visibleDays().map((d) => {
        const key = dayKey(d);
        const weekend = d.getDay() === 0 || d.getDay() === 6;
        const done = isDayDone(days[key]);
        return (
          <button
            type="button"
            key={key}
            onClick={() => selectDay(key)}
            className={`rounded-md py-1 ${key === selected ? "bg-surface-strong" : ""}`}
          >
            <small className={`block text-[9px] ${weekend ? "text-weekend" : "text-text"}`}>
              {NAMES[d.getDay()]}
            </small>
            <b className={`block text-[13px] font-normal ${key === today ? "text-accent" : ""}`}>
              {d.getDate()}
            </b>
            <motion.span
              key={done ? "on" : "off"}
              initial={done ? { scale: 1.8 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="mx-auto mt-0.5 block h-4 w-3.5"
            >
              <Icon
                name="flame"
                className={`size-full ${done ? "text-flame-on" : "text-flame-off"}`}
              />
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
