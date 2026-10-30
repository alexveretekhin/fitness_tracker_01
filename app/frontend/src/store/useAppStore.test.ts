import { afterEach, expect, test, vi } from "vitest";
import { dayKey, fromDayKey, syncToday, useAppStore } from "./useAppStore";

afterEach(() => {
  vi.useRealTimers();
});

test("ключ дня считается по местному времени", () => {
  expect(dayKey(new Date(2026, 9, 30, 0, 30))).toBe("2026-10-30");
  expect(dayKey(fromDayKey("2026-10-30"))).toBe("2026-10-30");
});

test("после полуночи выбранный день переезжает на сегодня", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 29, 23, 50)); // вечер 29-го
  syncToday();
  useAppStore.getState().selectDay("2026-10-27"); // смотрим старый день

  syncToday(); // в тот же день выбор не трогаем
  expect(useAppStore.getState().selectedDay).toBe("2026-10-27");

  vi.setSystemTime(new Date(2026, 9, 30, 9, 0)); // утро 30-го, вкладка та же
  syncToday();
  expect(useAppStore.getState()).toMatchObject({
    today: "2026-10-30",
    selectedDay: "2026-10-30",
  });
});
