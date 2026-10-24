"""Стартовый каталог: группы мышц и упражнения.

Формат упражнения: (id, название, основные мышцы, вспомогательные мышцы, демо).
Чтобы добавить упражнение, допиши строку и запусти `uv run python -m app.seed`.
"""

MUSCLE_GROUPS: list[tuple[str, str]] = [
    ("neck", "Neck"),
    ("shoulders", "Shoulders"),
    ("chest", "Chest"),
    ("back", "Back"),
    ("abs", "Abs"),
    ("biceps", "Biceps"),
    ("triceps", "Triceps"),
    ("legs", "Legs"),
    ("calves", "Calves"),
]

PUSH_UPS_DEMO = "/animations/exercises/push-ups.mp4"

EXERCISES: list[tuple[str, str, list[str], list[str], str | None]] = [
    ("neck-flexion", "Neck flexion", ["neck"], [], None),
    ("neck-extension", "Neck extension", ["neck"], [], None),
    ("shrugs", "Shrugs", ["neck"], ["back"], None),
    ("overhead-press", "Overhead press", ["shoulders"], ["triceps"], None),
    ("seated-dumbbell-press", "Seated dumbbell press", ["shoulders"], ["triceps"], None),
    ("lateral-raise", "Lateral raise", ["shoulders"], [], None),
    ("front-raise", "Front raise", ["shoulders"], [], None),
    ("face-pull", "Face pull", ["shoulders"], ["back"], None),
    ("barbell-bench", "Barbell bench", ["chest"], ["triceps", "shoulders"], None),
    ("dumbbell-bench", "Dumbbell bench", ["chest"], ["triceps", "shoulders"], None),
    ("chest-fly", "Chest fly", ["chest"], ["shoulders"], None),
    ("cable-fly", "Cable fly", ["chest"], ["shoulders"], None),
    ("pec-deck-fly", "Pec deck fly", ["chest"], [], None),
    ("dumbbell-pullover", "Dumbbell pullover", ["chest"], ["back"], None),
    ("push-ups", "Push-ups", ["chest"], ["triceps", "shoulders", "abs"], PUSH_UPS_DEMO),
    ("pull-ups", "Pull-ups", ["back"], ["biceps"], None),
    ("lat-pulldown", "Lat pulldown", ["back"], ["biceps"], None),
    ("barbell-row", "Barbell row", ["back"], ["biceps"], None),
    ("seated-cable-row", "Seated cable row", ["back"], ["biceps"], None),
    ("deadlift", "Deadlift", ["back", "legs"], ["abs"], None),
    ("crunches", "Crunches", ["abs"], [], None),
    ("plank", "Plank", ["abs"], ["shoulders"], None),
    ("hanging-leg-raise", "Hanging leg raise", ["abs"], [], None),
    ("russian-twist", "Russian twist", ["abs"], [], None),
    ("barbell-curl", "Barbell curl", ["biceps"], [], None),
    ("dumbbell-curl", "Dumbbell curl", ["biceps"], [], None),
    ("hammer-curl", "Hammer curl", ["biceps"], [], None),
    ("preacher-curl", "Preacher curl", ["biceps"], [], None),
    ("triceps-pushdown", "Triceps pushdown", ["triceps"], [], None),
    ("skull-crushers", "Skull crushers", ["triceps"], [], None),
    ("dips", "Dips", ["triceps"], ["chest", "shoulders"], None),
    ("overhead-extension", "Overhead extension", ["triceps"], [], None),
    ("squat", "Squat", ["legs"], ["abs", "back"], None),
    ("leg-press", "Leg press", ["legs"], [], None),
    ("lunges", "Lunges", ["legs"], [], None),
    ("romanian-deadlift", "Romanian deadlift", ["legs"], ["back"], None),
    ("leg-extension", "Leg extension", ["legs"], [], None),
    ("leg-curl", "Leg curl", ["legs"], [], None),
    ("standing-calf-raise", "Standing calf raise", ["calves"], [], None),
    ("seated-calf-raise", "Seated calf raise", ["calves"], [], None),
]
