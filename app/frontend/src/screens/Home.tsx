import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useDay, useDayMutations } from "../api";
import { SetSheet } from "../components/SetSheet";
import { EmptyState, ListRow, Panel, QueryState } from "../components/ui";
import { WeekStrip } from "../components/WeekStrip";
import { useAppStore } from "../store/useAppStore";

// Главная: лента недели с огоньками и упражнения выбранного дня
export function Home() {
  const navigate = useNavigate();
  const date = useAppStore((s) => s.selectedDay);
  const day = useDay(date);
  const m = useDayMutations();
  const [openId, setOpenId] = useState<string | null>(null);

  const entries = day.data?.exercises ?? [];
  const open = entries.find((e) => e.exercise_id === openId) ?? null;
  const busy = Object.values(m).some((mutation) => mutation.isPending);

  return (
    <>
      <Panel>
        <WeekStrip />
      </Panel>

      <Panel className="mt-2.5 flex-1 overflow-y-auto">
        <QueryState isPending={day.isPending} isError={day.isError} />
        {day.isSuccess && entries.length === 0 && (
          <EmptyState onClick={() => navigate({ to: "/muscles" })}>Add Exercises</EmptyState>
        )}
        {entries.map((e) => (
          <ListRow
            key={e.exercise_id}
            onClick={() => setOpenId(e.exercise_id)}
            right={
              <>
                {e.sets.length > 0 && (
                  <span className="text-xs text-text-muted">{e.sets.length} подх.</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    // Если подходы уже записаны, переспрашиваем: они удалятся вместе с упражнением
                    const n = e.sets.length;
                    if (n > 0 && !confirm(`Убрать «${e.name}» вместе с подходами (${n})?`)) return;
                    m.removeExercise.mutate({ path: { date, exercise_id: e.exercise_id } });
                  }}
                  disabled={busy}
                  aria-label={`Убрать ${e.name}`}
                  className="-mr-1.5 grid size-tap place-items-center text-lg text-text-muted active:text-accent"
                >
                  ×
                </button>
              </>
            }
          >
            {e.name}
          </ListRow>
        ))}
      </Panel>

      <SetSheet
        exercise={open}
        busy={busy}
        onAdd={(set) =>
          open && m.addSet.mutate({ path: { date, exercise_id: open.exercise_id }, body: set })
        }
        onUpdate={(setId, set) =>
          open &&
          m.updateSet.mutate({
            path: { date, exercise_id: open.exercise_id, set_id: setId },
            body: set,
          })
        }
        onDelete={(setId) =>
          open &&
          m.removeSet.mutate({ path: { date, exercise_id: open.exercise_id, set_id: setId } })
        }
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
