import { useNavigate } from "@tanstack/react-router";
import { useExerciseCatalog } from "../api";
import { ListRow, Panel } from "../components/ui";
import { isDayDone, useAppStore } from "../store/useAppStore";

// История: все дни с тренировками, новые сверху. Тап открывает день на главной.
export function History() {
  const navigate = useNavigate();
  const exerciseById = useExerciseCatalog().data ?? {};
  const days = useAppStore((s) => s.days);
  const selectDay = useAppStore((s) => s.selectDay);

  const list = Object.entries(days)
    .filter(([, entries]) => isDayDone(entries))
    .sort(([a], [b]) => b.localeCompare(a));

  return (
    <Panel className="flex-1 overflow-y-auto">
      {list.length === 0 ? (
        <div className="grid h-full place-items-center text-text-faint">HISTORY</div>
      ) : (
        list.map(([day, entries]) => (
          <ListRow
            key={day}
            onClick={() => {
              selectDay(day);
              navigate({ to: "/home" });
            }}
          >
            <span className="text-accent">{day.slice(5).replace("-", ".")}</span>{" "}
            <span className="text-text-muted">
              {entries
                .filter((e) => e.log)
                .map((e) => exerciseById[e.exerciseId]?.name)
                .join(", ")}
            </span>
          </ListRow>
        ))
      )}
    </Panel>
  );
}
