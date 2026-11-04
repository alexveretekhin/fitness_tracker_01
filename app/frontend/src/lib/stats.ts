import type { ExerciseStat } from "../api/generated/types.gen";
import { addDays, dayKey, fromDayKey } from "../store/useAppStore";

// Подготовка точек для графика прогресса в истории.
//
//   Сила:  расчётный максимум на 1 раз (e1RM) по лучшему подходу: вес × (1 + повторы / 30).
//          Так 40 кг × 1 и 30 кг × 8 сравнимы (ADR 0011). Без веса: больше всего повторов в подходе
//   Объём: сумма «вес × повторы» за тренировку (без веса: все повторы за день)
//
//   Месяц: последние 30 дней, точка на каждую тренировку
//   Год:   последние 12 месяцев, точка на месяц = лучшая тренировка месяца

export type Metric = "strength" | "volume";
export type Range = "month" | "year";

export type Point = {
  x: number; // 0..1, место по горизонтали
  value: number;
  label: string; // «4 ноя» или «ноя 2026», для подсказки при тапе
};

export type Series = {
  points: Point[];
  unit: "кг" | "повт.";
  approx: boolean; // значение расчётное (e1RM), пишем «≈»
  ticks: { x: number; label: string }[]; // подписи снизу
};

const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS_NOM = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

// Сколько дней грузим с сервера: год с запасом на первый месяц
export const STATS_DAYS = 366;

function pointValue(s: ExerciseStat, metric: Metric, bodyweight: boolean): number {
  if (metric === "strength") return bodyweight ? s.max_reps : s.best_e1rm;
  return bodyweight ? s.total_reps : s.volume;
}

export function buildSeries(
  stats: ExerciseStat[],
  metric: Metric,
  range: Range,
  today: string,
): Series {
  const end = fromDayKey(today);
  // Упражнение без веса: за всё время ни одного подхода с весом
  const bodyweight = stats.every((s) => s.best_weight === 0);
  const unit = bodyweight ? "повт." : "кг";
  const approx = metric === "strength" && !bodyweight;

  if (range === "month") {
    const start = addDays(end, -29);
    const span = end.getTime() - start.getTime();
    const points = stats
      .filter((s) => s.date >= dayKey(start) && s.date <= today)
      .map((s) => {
        const d = fromDayKey(s.date);
        return {
          x: (d.getTime() - start.getTime()) / span,
          value: pointValue(s, metric, bodyweight),
          label: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        };
      });
    const ticks = [0, 10, 20, 29].map((i) => {
      const d = addDays(start, i);
      return {
        x: (d.getTime() - start.getTime()) / span,
        label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`,
      };
    });
    return { points, unit, approx, ticks };
  }

  // Год: 12 месяцев, последний = текущий
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(end.getFullYear(), end.getMonth() - 11 + i, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const best = new Map<string, number>();
  for (const s of stats) {
    const key = s.date.slice(0, 7);
    best.set(key, Math.max(best.get(key) ?? 0, pointValue(s, metric, bodyweight)));
  }
  const points: Point[] = [];
  months.forEach(({ y, m }, i) => {
    const v = best.get(`${y}-${String(m + 1).padStart(2, "0")}`);
    if (v !== undefined) points.push({ x: i / 11, value: v, label: `${MONTHS_NOM[m]} ${y}` });
  });
  const ticks = months
    .map(({ m }, i) => ({ x: i / 11, label: MONTHS_NOM[m] }))
    .filter((_, i) => i % 3 === 2); // каждый третий месяц, последний = текущий
  return { points, unit, approx, ticks };
}

// С какого дня грузить статистику, чтобы хватило на «Год»
export function since(today: string): string {
  return dayKey(addDays(fromDayKey(today), -(STATS_DAYS - 1)));
}

// 62.5 → «62,5», 1470 → «1 470»
export function formatValue(v: number): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: 1 }).replace(/ /g, " ");
}
