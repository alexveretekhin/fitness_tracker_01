import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useExerciseCatalog } from "../api";
import { SetSheet } from "../components/SetSheet";
import { EmptyState, ListRow, Panel } from "../components/ui";
import { WeekStrip } from "../components/WeekStrip";
import { useAppStore } from "../store/useAppStore";

// Главная: лента недели с огоньками и упражнения выбранного дня
export function Home() {
  const navigate = useNavigate();
  const exerciseById = useExerciseCatalog().data ?? {};
  const selectedDay = useAppStore((s) => s.selectedDay);
  const entries = useAppStore((s) => s.days[s.selectedDay]) ?? [];
  const saveLog = useAppStore((s) => s.saveLog);
  const removeExercise = useAppStore((s) => s.removeExercise);
  const [openId, setOpenId] = useState<string | null>(null);

  const open = entries.find((e) => e.exerciseId === openId) ?? null;

  return (
    <>
      <Panel>
        <WeekStrip />
      </Panel>

      <Panel className="mt-2.5 flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <EmptyState onClick={() => navigate({ to: "/muscles" })}>Add Exercises</EmptyState>
        ) : (
          entries.map((e) => (
            <ListRow
              key={e.exerciseId}
              onClick={() => setOpenId(e.exerciseId)}
              right={
                e.log ? (
                  <span className="pr-1.5 text-xs text-text-muted">
                    {e.log.weight}×{e.log.reps}×{e.log.sets}
                  </span>
                ) : null
              }
            >
              {exerciseById[e.exerciseId]?.name ?? e.exerciseId}
            </ListRow>
          ))
        )}
      </Panel>

      <SetSheet
        key={selectedDay}
        title={open ? (exerciseById[open.exerciseId]?.name ?? open.exerciseId) : null}
        initial={open?.log ?? null}
        onSave={(log) => {
          if (openId) saveLog(openId, log);
          setOpenId(null);
        }}
        onRemove={() => {
          if (openId) removeExercise(openId);
          setOpenId(null);
        }}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
