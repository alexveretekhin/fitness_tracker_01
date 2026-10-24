import { useNavigate } from "@tanstack/react-router";
import { ListRow, Panel } from "../components/ui";
import { useAppStore } from "../store/useAppStore";

export function Settings() {
  const navigate = useNavigate();
  const avatar = useAppStore((s) => s.avatar);
  const resetAll = useAppStore((s) => s.resetAll);

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
          if (confirm("Удалить все тренировки и аватар?")) {
            resetAll();
            navigate({ to: "/" });
          }
        }}
      >
        <span className="text-weekend">Reset data</span>
      </ListRow>
    </Panel>
  );
}
