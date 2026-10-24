import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useMuscleGroups } from "../api";
import { listGroupExercisesOptions } from "../api/generated/@tanstack/react-query.gen";
import { useFly } from "../components/FlyToHome";
import { ListRow, Panel, PlayButton, QueryState, SearchField } from "../components/ui";
import { useAppStore } from "../store/useAppStore";

// Упражнения группы. Тап по названию: упражнение улетает на главную,
// экран при этом не меняется. Play раскрывает демо техники.
export function Exercises() {
  const { groupId } = useParams({ from: "/shell/muscles/$groupId" });
  const group = useMuscleGroups().data?.find((g) => g.id === groupId);
  const exercisesQuery = useQuery(listGroupExercisesOptions({ path: { group_id: groupId } }));
  const addExercise = useAppStore((s) => s.addExercise);
  const picked = useAppStore((s) => s.days[s.selectedDay]) ?? [];
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
        const already = picked.some((p) => p.exerciseId === e.id);
        return (
          <div key={e.id}>
            <ListRow
              muted={already}
              onClick={async (ev) => {
                if (already) return;
                const rect = ev.currentTarget.getBoundingClientRect();
                await fly(rect, e.name);
                addExercise(e.id);
              }}
              right={
                <PlayButton
                  active={demoId === e.id}
                  onClick={() => setDemoId(demoId === e.id ? null : e.id)}
                />
              }
            >
              {e.name}
              {already && " ✓"}
            </ListRow>
            <AnimatePresence>
              {demoId === e.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-1.5 overflow-hidden rounded-row border border-border"
                >
                  {e.demo ? (
                    <video src={e.demo} autoPlay muted loop playsInline className="w-full" />
                  ) : (
                    <div className="grid h-32 place-items-center bg-surface text-sm text-text-faint">
                      анимация скоро
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </Panel>
  );
}
