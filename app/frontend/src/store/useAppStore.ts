import { create } from "zustand";

// Состояние интерфейса: какой день выбран в ленте и сколько упражнений
// улетело в «+» за этот заход. Сами тренировки и аватар живут на сервере
// (см. src/api), здесь только то, что нужно экрану прямо сейчас.

// Ключ дня: "2026-10-24" по местному времени пользователя
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Дата на n дней вперёд (или назад, если n < 0)
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

type AppState = {
  selectedDay: string;
  addedThisRound: number; // счётчик на кнопке «+», пока выбираем упражнения

  selectDay: (key: string) => void;
  bumpRound: () => void;
  resetRound: () => void;
};

export const useAppStore = create<AppState>()((set) => ({
  selectedDay: dayKey(new Date()),
  addedThisRound: 0,

  selectDay: (key) => set({ selectedDay: key }),
  bumpRound: () => set((s) => ({ addedThisRound: s.addedThisRound + 1 })),
  resetRound: () => set({ addedThisRound: 0 }),
}));
