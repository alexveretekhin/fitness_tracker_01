import { useNavigate } from "@tanstack/react-router";
import { logoutWithConfirm, useClearDays, useMe, useProgress } from "../api";
import { AvatarRing } from "../components/AvatarRing";
import { ListRow, Panel } from "../components/ui";

export function Settings() {
  const navigate = useNavigate();
  const me = useMe().data;
  const avatar = me?.avatar;
  const p = useProgress().data;
  const clearDays = useClearDays();

  const share = !p
    ? 0
    : p.level_to === null
      ? 1
      : (p.xp - p.level_from) / (p.level_to - p.level_from);

  return (
    <Panel className="flex-1 overflow-y-auto">
      <p className="px-1 pb-1.5 text-xs text-text-muted">Account</p>
      <ListRow
        onClick={() => navigate({ to: "/me" })}
        right={p && <span className="text-xs text-text-muted">ур. {p.level}</span>}
      >
        <span className="flex items-center gap-3 py-1">
          <AvatarRing avatar={avatar} size={36} share={share} />
          <span className="min-w-0">
            <span className="block truncate">{me?.name ?? "Avatar"}</span>
            <span className="block truncate text-[11px] text-text-faint">
              {me?.is_guest ? "гость: тренировки только здесь" : me?.email}
            </span>
          </span>
        </span>
      </ListRow>
      {me?.is_guest && (
        <ListRow onClick={() => navigate({ to: "/login" })}>
          <span className="text-accent">Создать аккаунт</span>
        </ListRow>
      )}
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

      <ListRow
        onClick={() => {
          if (logoutWithConfirm(me?.is_guest === true)) navigate({ to: "/login", replace: true });
        }}
      >
        <span className="text-text-muted">Выйти</span>
      </ListRow>
    </Panel>
  );
}
