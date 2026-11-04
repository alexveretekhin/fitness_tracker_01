import { describe, expect, it } from "vitest";
import type { ExerciseStat } from "../api/generated/types.gen";
import { buildSeries, formatValue, since } from "./stats";

function stat(date: string, best_e1rm: number, volume: number, max_reps = 10, total_reps = 30) {
  const best_weight = best_e1rm; // для тестов не важно
  return {
    date,
    best_weight,
    best_e1rm,
    volume,
    max_reps,
    total_reps,
    sets: 3,
  } satisfies ExerciseStat;
}

const TODAY = "2026-11-04";

describe("buildSeries", () => {
  it("месяц: точки за последние 30 дней, место по дате", () => {
    const s = buildSeries(
      [stat("2026-09-01", 50, 500), stat("2026-10-06", 60, 600), stat("2026-11-04", 70, 700)],
      "strength",
      "month",
      TODAY,
    );
    expect(s.unit).toBe("кг");
    expect(s.approx).toBe(true);
    expect(s.points.map((p) => p.value)).toEqual([60, 70]); // сентябрь не попал
    expect(s.points[0].x).toBe(0); // 6 октября = первый из 30 дней
    expect(s.points[1].x).toBe(1);
    expect(s.points[1].label).toBe("4 ноя");
  });

  it("год: лучшая тренировка месяца", () => {
    const s = buildSeries(
      [stat("2026-10-02", 60, 900), stat("2026-10-20", 65, 600), stat("2026-11-04", 70, 700)],
      "volume",
      "year",
      TODAY,
    );
    expect(s.points.map((p) => [p.label, p.value])).toEqual([
      ["окт 2026", 900],
      ["ноя 2026", 700],
    ]);
    expect(s.points[1].x).toBe(1); // текущий месяц справа
    expect(s.ticks.at(-1)?.label).toBe("ноя");
  });

  it("без веса: повторы вместо килограммов", () => {
    const s = buildSeries([stat("2026-11-02", 0, 0, 12, 30)], "strength", "month", TODAY);
    expect(s.unit).toBe("повт.");
    expect(s.points[0].value).toBe(12);
    expect(
      buildSeries([stat("2026-11-02", 0, 0, 12, 30)], "volume", "month", TODAY).points[0].value,
    ).toBe(30);
  });
});

describe("helpers", () => {
  it("since: год назад", () => expect(since(TODAY)).toBe("2025-11-04"));
  it("formatValue", () => {
    expect(formatValue(62.5)).toBe("62,5");
    expect(formatValue(1470)).toBe("1 470");
  });
});

import { niceScale } from "../components/ProgressChart";

describe("niceScale", () => {
  it("круглые и разные подписи даже при маленьком разбросе", () => {
    const { grid } = niceScale([15, 16]);
    expect(grid.every(Number.isInteger)).toBe(true);
    expect(new Set(grid).size).toBe(grid.length);
    expect(grid[0]).toBeLessThanOrEqual(15);
    expect(grid.at(-1)).toBeGreaterThanOrEqual(16);
  });
  it("не уходит ниже нуля", () => {
    expect(niceScale([0, 2]).lo).toBe(0);
  });
  it("одна точка", () => {
    const { lo, hi } = niceScale([60]);
    expect(lo).toBeLessThan(60);
    expect(hi).toBeGreaterThan(60);
  });
});
