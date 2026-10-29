import { useNavigate } from "@tanstack/react-router";
import { useClearDays, useMe } from "../api";
import { ListRow, Panel } from "../components/ui";

export function Settings() {
  const navigate = useNavigate();
  const avatar = useMe().data?.avatar;
  const clearDays = useClearDays();

  return (
    <Panel className="flex-1 overflow-y-auto">
      <p className="px-1 pb-1.5 text-xs text-text-muted">Account</p>
      <ListRow onClick={() => navigate({ to: "/avatar" })}>
        Avatar: <span className="text-accent">{avatar ?? "—"}</span>
      </ListRow>
      <ListRow muted>3D (скоро)</ListRow>
      <ListRow onClick={() => navigate({ to: "/history" })}>History</ListRow>
      <ListRow
        onClick={() => {
          if (confirm("Удалить все тренировки? Это нельзя отменить.")) {
            clearDays.mutate({}, { onSuccess: () => navigate({ to: "/home" }) });
          }
        }}
      >
        <span className="text-weekend">Reset data</span>
      </ListRow>
    </Panel>
  );
}
