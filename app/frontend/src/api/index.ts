import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import {
  addExerciseMutation,
  addSetMutation,
  clearDaysMutation,
  getDayOptions,
  getDayQueryKey,
  getExerciseRecordOptions,
  getExerciseStatsOptions,
  getMeOptions,
  getMeQueryKey,
  getProgressOptions,
  listDaysOptions,
  listMuscleGroupsOptions,
  removeExerciseMutation,
  removeSetMutation,
  searchExercisesOptions,
  updateMeMutation,
  updateSetMutation,
} from "./generated/@tanstack/react-query.gen";
import type { DayOut, ExerciseOut } from "./generated/types.gen";

// Всё общение с бэкендом идёт через этот модуль.
//
// Функции и типы в ./generated собраны генератором из схемы бэкенда
// (pnpm api), поэтому если бэкенд поменяет поле, TypeScript сразу
// подсветит места, которые надо поправить.
//
// Адреса относительные (/api/...). В разработке Vite пересылает их
// на бэкенд http://127.0.0.1:8000 (см. proxy в vite.config.ts).

export type {
  Avatar,
  DayExerciseOut,
  DayOut,
  DaySummary,
  ExerciseOut,
  ExerciseStat,
  MuscleGroupOut,
  Progress,
  RecordOut,
  SetIn,
  SetOut,
} from "./generated/types.gen";

// TanStack Query: кэш ответов сервера. Один раз загрузил список мышц,
// и при возврате на экран он показывается сразу, без повторной загрузки.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // каталог меняется редко: 5 минут считаем свежим
      retry: 1,
    },
  },
});

// ---------- Каталог ----------

// Группы мышц по порядку, как в макете
export function useMuscleGroups() {
  return useQuery(listMuscleGroupsOptions());
}

// Весь каталог упражнений одним запросом (их всего около 40).
// Нужен, чтобы по коду упражнения ("push-ups") показать название.
export function useExerciseCatalog() {
  return useQuery({
    ...searchExercisesOptions(),
    select: (list): Record<string, ExerciseOut> => Object.fromEntries(list.map((e) => [e.id, e])),
  });
}

// ---------- Профиль ----------

export function useMe() {
  return useQuery(getMeOptions());
}

export function useSetAvatar() {
  return useMutation({
    ...updateMeMutation(),
    onSuccess: (me) => queryClient.setQueryData(getMeQueryKey(), me),
  });
}

// ---------- Дни и подходы ----------

// Упражнения и подходы одного дня. date = "2026-10-24"
export function useDay(date: string) {
  return useQuery({ ...getDayOptions({ path: { date } }), staleTime: 0 });
}

// Сводка по дням: огоньки в ленте недели и история
export function useDays(from: string, to: string) {
  return useQuery({ ...listDaysOptions({ query: { from, to } }), staleTime: 0 });
}

// После любой правки сервер присылает день целиком. Кладём его в кэш сразу
// (экран обновится без лишнего запроса), а сводку дней просим перезагрузить,
// чтобы огонёк в ленте загорелся или погас.
function onDaySaved(day: DayOut) {
  queryClient.setQueryData(getDayQueryKey({ path: { date: day.date } }), day);
  queryClient.invalidateQueries({ queryKey: [{ _id: "listDays" }] });
  // Первый подход за день добавляет XP и тренировку в неделю
  queryClient.invalidateQueries({ queryKey: [{ _id: "getProgress" }] });
  // Подход поменялся: графики в истории перерисуются
  queryClient.invalidateQueries({ queryKey: [{ _id: "getExerciseStats" }] });
  queryClient.invalidateQueries({ queryKey: [{ _id: "getExerciseRecord" }] });
}

export function useDayMutations() {
  return {
    addExercise: useMutation({ ...addExerciseMutation(), onSuccess: onDaySaved }),
    removeExercise: useMutation({ ...removeExerciseMutation(), onSuccess: onDaySaved }),
    addSet: useMutation({ ...addSetMutation(), onSuccess: onDaySaved }),
    updateSet: useMutation({ ...updateSetMutation(), onSuccess: onDaySaved }),
    removeSet: useMutation({ ...removeSetMutation(), onSuccess: onDaySaved }),
  };
}

export function useClearDays() {
  return useMutation({
    ...clearDaysMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [{ _id: "getDay" }] });
      queryClient.invalidateQueries({ queryKey: [{ _id: "listDays" }] });
      queryClient.invalidateQueries({ queryKey: [{ _id: "getProgress" }] });
    },
  });
}

// ---------- XP и уровень ----------

export function useProgress() {
  return useQuery({ ...getProgressOptions(), staleTime: 0 });
}

// ---------- Графики прогресса ----------

// Лучший вес, повторы и объём упражнения по дням, для графика в истории
export function useExerciseStats(exerciseId: string, from: string, to: string) {
  return useQuery(
    getExerciseStatsOptions({ path: { exercise_id: exerciseId }, query: { from, to } }),
  );
}

// Рекордная тренировка упражнения за всё время (строка под графиком). null = рекорда ещё нет
export function useExerciseRecord(exerciseId: string) {
  return useQuery(getExerciseRecordOptions({ path: { exercise_id: exerciseId } }));
}
