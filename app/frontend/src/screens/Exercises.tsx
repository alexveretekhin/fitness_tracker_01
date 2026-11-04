import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useDay, useDayMutations, useMuscleGroups } from "../api";
import { listGroupExercisesOptions } from "../api/generated/@tanstack/react-query.gen";
import { ExerciseDemo } from "../components/ExerciseDemo";
import { useFly } from "../components/FlyToHome";
import { ListRow, Panel, PlayButton, QueryState, SearchField } from "../components/ui";
import { useAppStore } from "../store/useAppStore";

// Упражнения группы. Тап по названию: упражнение улетает на главную,
// экран при этом не меняется. Выбранное помечено оранжевой галочкой,
// крестик × справа убирает его из дня. Play раскрывает демо техники.
export function Exercises() {
  const { groupId } = useParams({ from: "/shell/muscles/$groupId" });
  const group = useMuscleGroups().data?.find((g) => g.id === groupId);
  const exercisesQuery = useQuery(listGroupExercisesOptions({ path: { group_id: groupId } }));
  const date = useAppStore((s) => s.selectedDay);
  const bumpRound = useAppStore((s) => s.bumpRound);
  const unbumpRound = useAppStore((s) => s.unbumpRound);
  const picked = useDay(date).data?.exercises ?? [];
  const { addExercise, removeExercise } = useDayMutations();
  // Упражнения, которые уже летят к «+»: второй тап по ним ничего не делает
  const [flying, setFlying] = useState<Set<string>>(new Set());
  const { fly } = useFly();
  const [q, setQ] = useState("");
  const [demoId, setDemoId] = useState<string | null>(null);

  const list = (exercisesQuery.data ?? []).filter((e) =>
    e.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <Panel className="flex-1 overflow-y-auto">
      <p className="px-1 pb-1.5 text-xs uppercase text-text-muted">{group?.name}</p>
      <SearchField value={q} onChange={setQ} />
      <QueryState isPending={exercisesQuery.isPending} isError={exercisesQuery.isError} />
      {list.map((e) => {
        const entry = picked.find((p) => p.exercise_id === e.id);
        const already = flying.has(e.id) || entry !== undefined;
        return (
          <div key={e.id}>
            <ListRow
              muted={already}
              onClick={async (ev) => {
                if (already) return;
                setFlying((f) => new Set(f).add(e.id));
                const rect = ev.currentTarget.getBoundingClientRect();
                await fly(rect, e.name);
                bumpRound(); // счётчик на «+» растёт, когда упражнение долетело
                addExercise.mutate(
                  { path: { date }, body: { exercise_id: e.id } },
                  {
                    onSettled: () =>
                      setFlying((f) => {
                        const next = new Set(f);
                        next.delete(e.id);
                        return next;
                      }),
                  },
                );
              }}
              right={
                <>
                  {/* Крестик только у уже добавленного, пока оно летит, отменять нечего */}
                  {entry && !flying.has(e.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        // Подходы удалятся вместе с упражнением, поэтому переспрашиваем
                        const n = entry.sets.length;
                        if (n > 0 && !confirm(`Убрать «${e.name}» вместе с подходами (${n})?`))
                          return;
                        removeExercise.mutate(
                          { path: { date, exercise_id: e.id } },
                          { onSuccess: unbumpRound },
                        );
                      }}
                      disabled={removeExercise.isPending}
                      aria-label={`Убрать ${e.name}`}
                      className="grid size-tap place-items-center text-xl text-text-muted active:text-accent"
                    >
                      ×
                    </button>
                  )}
                  <PlayButton
                    active={demoId === e.id}
                    onClick={() => setDemoId(demoId === e.id ? null : e.id)}
                  />
                </>
              }
            >
              {e.name}
              {already && <span className="text-accent"> ✓</span>}
            </ListRow>
            <ExerciseDemo open={demoId === e.id} src={e.demo} />
          </div>
        );
      })}
    </Panel>
  );
}
