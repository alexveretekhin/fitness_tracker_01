import { QueryClient, useQuery } from "@tanstack/react-query";
import {
  listMuscleGroupsOptions,
  searchExercisesOptions,
} from "./generated/@tanstack/react-query.gen";
import type { ExerciseOut } from "./generated/types.gen";

// Всё общение с бэкендом идёт через этот модуль.
//
// Функции и типы в ./generated собраны генератором из схемы бэкенда
// (pnpm api), поэтому если бэкенд поменяет поле, TypeScript сразу
// подсветит места, которые надо поправить.
//
// Адреса относительные (/api/...). В разработке Vite пересылает их
// на бэкенд http://127.0.0.1:8000 (см. proxy в vite.config.ts).

export type { ExerciseOut, MuscleGroupOut } from "./generated/types.gen";

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
