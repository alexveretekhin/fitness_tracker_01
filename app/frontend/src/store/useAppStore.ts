import { create } from "zustand";
import { persist } from "zustand/middleware";

// Состояние приложения. Zustand хранит его в памяти, а persist
// сохраняет в localStorage браузера, поэтому после перезагрузки страницы
// всё на месте. На этапе 4 данные начнут сохраняться на бэкенде.

export type Avatar = "male" | "female";

export type SetLog = {
  weight: number;
  sets: number;
  reps: number;
};

export type DayEntry = {
  exerciseId: string;
  log: SetLog | null; // null = упражнение выбрано, но подходы ещё не записаны
};

// Ключ дня: "2026-10-24" по местному времени пользователя
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type AppState = {
  avatar: Avatar | null;
  days: Record<string, DayEntry[]>;
  selectedDay: string;
  addedThisRound: number; // счётчик на кнопке «+», пока выбираем упражнения

  chooseAvatar: (avatar: Avatar) => void;
  selectDay: (key: string) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (exerciseId: string) => void;
  saveLog: (exerciseId: string, log: SetLog) => void;
  resetRound: () => void;
  resetAll: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      avatar: null,
      days: {},
      selectedDay: dayKey(new Date()),
      addedThisRound: 0,

      chooseAvatar: (avatar) => set({ avatar }),
      selectDay: (key) => set({ selectedDay: key }),

      addExercise: (exerciseId) =>
        set((s) => {
          const list = s.days[s.selectedDay] ?? [];
          if (list.some((e) => e.exerciseId === exerciseId)) return s; // уже добавлено
          return {
            days: { ...s.days, [s.selectedDay]: [...list, { exerciseId, log: null }] },
            addedThisRound: s.addedThisRound + 1,
          };
        }),

      removeExercise: (exerciseId) =>
        set((s) => ({
          days: {
            ...s.days,
            [s.selectedDay]: (s.days[s.selectedDay] ?? []).filter(
              (e) => e.exerciseId !== exerciseId,
            ),
          },
        })),

      saveLog: (exerciseId, log) =>
        set((s) => ({
          days: {
            ...s.days,
            [s.selectedDay]: (s.days[s.selectedDay] ?? []).map((e) =>
              e.exerciseId === exerciseId ? { ...e, log } : e,
            ),
          },
        })),

      resetRound: () => set({ addedThisRound: 0 }),
      resetAll: () => set({ avatar: null, days: {}, addedThisRound: 0 }),
    }),
    {
      name: "fitness-tracker",
      // Выбранный день не сохраняем: при каждом запуске открываем сегодня
      partialize: (s) => ({ avatar: s.avatar, days: s.days }),
    },
  ),
);

// Огонёк горит, если в этот день записан хотя бы один подход
export function isDayDone(entries: DayEntry[] | undefined): boolean {
  return (entries ?? []).some((e) => e.log !== null);
}
