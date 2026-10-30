import { useNavigate } from "@tanstack/react-router";
import { useDays } from "../api";
import { ListRow, Panel, QueryState } from "../components/ui";
import { addDays, dayKey, fromDayKey, useAppStore } from "../store/useAppStore";

// "2026-10-29" → "29.10"
function formatDate(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}`;
}

// История: дни с тренировками за последний год, новые сверху.
// Тап открывает день на главной.
export function History() {
  const navigate = useNavigate();
  const selectDay = useAppStore((s) => s.selectDay);
  const today = fromDayKey(useAppStore((s) => s.today));
  const days = useDays(dayKey(addDays(today, -365)), dayKey(addDays(today, 7)));

  const list = (days.data ?? []).filter((d) => d.done);

  return (
    <Panel className="flex-1 overflow-y-auto">
      <QueryState isPending={days.isPending} isError={days.isError} />
      {days.isSuccess && list.length === 0 ? (
        <div className="grid h-full place-items-center text-text-faint">HISTORY</div>
      ) : (
        list.map((d) => (
          <ListRow
            key={d.date}
            onClick={() => {
              selectDay(d.date);
              navigate({ to: "/home" });
            }}
          >
            <span className="text-accent">{formatDate(d.date)}</span>{" "}
            <span className="text-text-muted">{d.done_exercises.join(", ")}</span>
          </ListRow>
        ))
      )}
    </Panel>
  );
}
