import { expect, test } from "vitest";
import { dayKey } from "../store/useAppStore";
import { monthDays, monthEnd, shiftMonth, weekColumn } from "./calendar";

test("октябрь 2026: 31 день, 1-е в четверг, 31-е в субботу", () => {
  const days = monthDays(new Date(2026, 9, 1));
  expect(days).toHaveLength(31);
  expect(weekColumn(days[0])).toBe(3); // пн 0, вт 1, ср 2, чт 3
  expect(weekColumn(days[30])).toBe(5);
});

test("воскресенье в последней колонке", () => {
  expect(weekColumn(new Date(2026, 10, 1))).toBe(6); // 1 ноября 2026 — воскресенье
  expect(weekColumn(new Date(2026, 5, 1))).toBe(0); // 1 июня 2026 — понедельник
});

test("февраль: 28 и 29 дней", () => {
  expect(monthDays(new Date(2026, 1, 1))).toHaveLength(28);
  expect(monthDays(new Date(2028, 1, 1))).toHaveLength(29);
});

test("сдвиг месяца и конец месяца, в том числе через Новый год", () => {
  expect(dayKey(shiftMonth(new Date(2026, 9, 30), -1))).toBe("2026-09-01");
  expect(dayKey(shiftMonth(new Date(2026, 11, 15), 1))).toBe("2027-01-01");
  expect(dayKey(monthEnd(new Date(2026, 9, 1)))).toBe("2026-10-31");
});
