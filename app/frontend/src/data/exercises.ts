// Каталог групп мышц и упражнений.
// Пока это просто файл: на этапе 2 эти данные переедут в базу на бэкенде,
// а фронтенд будет получать их через API. Коды (id) останутся теми же,
// по ним же потом будут называться мышцы на 3D-модели.

export type MuscleGroup = {
  id: string;
  name: string;
};

export type Exercise = {
  id: string;
  name: string;
  groupId: string;
  // Путь к демо-анимации в public/. Пока есть только отжимания.
  demo?: string;
};

export const muscleGroups: MuscleGroup[] = [
  { id: "neck", name: "Neck" },
  { id: "shoulders", name: "Shoulders" },
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "abs", name: "Abs" },
  { id: "biceps", name: "Biceps" },
  { id: "triceps", name: "Triceps" },
  { id: "legs", name: "Legs" },
  { id: "calves", name: "Calves" },
];

export const exercises: Exercise[] = [
  { id: "neck-flexion", name: "Neck flexion", groupId: "neck" },
  { id: "neck-extension", name: "Neck extension", groupId: "neck" },
  { id: "shrugs", name: "Shrugs", groupId: "neck" },

  { id: "overhead-press", name: "Overhead press", groupId: "shoulders" },
  { id: "dumbbell-press-seated", name: "Seated dumbbell press", groupId: "shoulders" },
  { id: "lateral-raise", name: "Lateral raise", groupId: "shoulders" },
  { id: "front-raise", name: "Front raise", groupId: "shoulders" },
  { id: "face-pull", name: "Face pull", groupId: "shoulders" },

  { id: "barbell-bench", name: "Barbell bench", groupId: "chest" },
  { id: "dumbbell-bench", name: "Dumbbell bench", groupId: "chest" },
  { id: "chest-fly", name: "Chest fly", groupId: "chest" },
  { id: "cable-fly", name: "Cable fly", groupId: "chest" },
  { id: "pec-deck-fly", name: "Pec deck fly", groupId: "chest" },
  { id: "dumbbell-pullover", name: "Dumbbell pullover", groupId: "chest" },
  {
    id: "push-ups",
    name: "Push-ups",
    groupId: "chest",
    demo: "/animations/exercises/push-ups.mp4",
  },

  { id: "pull-ups", name: "Pull-ups", groupId: "back" },
  { id: "lat-pulldown", name: "Lat pulldown", groupId: "back" },
  { id: "barbell-row", name: "Barbell row", groupId: "back" },
  { id: "seated-cable-row", name: "Seated cable row", groupId: "back" },
  { id: "deadlift", name: "Deadlift", groupId: "back" },

  { id: "crunches", name: "Crunches", groupId: "abs" },
  { id: "plank", name: "Plank", groupId: "abs" },
  { id: "hanging-leg-raise", name: "Hanging leg raise", groupId: "abs" },
  { id: "russian-twist", name: "Russian twist", groupId: "abs" },

  { id: "barbell-curl", name: "Barbell curl", groupId: "biceps" },
  { id: "dumbbell-curl", name: "Dumbbell curl", groupId: "biceps" },
  { id: "hammer-curl", name: "Hammer curl", groupId: "biceps" },
  { id: "preacher-curl", name: "Preacher curl", groupId: "biceps" },

  { id: "triceps-pushdown", name: "Triceps pushdown", groupId: "triceps" },
  { id: "skull-crushers", name: "Skull crushers", groupId: "triceps" },
  { id: "dips", name: "Dips", groupId: "triceps" },
  { id: "overhead-extension", name: "Overhead extension", groupId: "triceps" },

  { id: "squat", name: "Squat", groupId: "legs" },
  { id: "leg-press", name: "Leg press", groupId: "legs" },
  { id: "lunges", name: "Lunges", groupId: "legs" },
  { id: "romanian-deadlift", name: "Romanian deadlift", groupId: "legs" },
  { id: "leg-extension", name: "Leg extension", groupId: "legs" },
  { id: "leg-curl", name: "Leg curl", groupId: "legs" },

  { id: "standing-calf-raise", name: "Standing calf raise", groupId: "calves" },
  { id: "seated-calf-raise", name: "Seated calf raise", groupId: "calves" },
];

export const exerciseById = Object.fromEntries(exercises.map((e) => [e.id, e]));
