import { useNavigate } from "@tanstack/react-router";
import { useClearDays, useFreeze, useMe, useProgress } from "../api";
import { AvatarRing } from "../components/AvatarRing";
import { ListRow, Panel } from "../components/ui";

export function Settings() {
  const navigate = useNavigate();
  const avatar = useMe().data?.avatar;
  const p = useProgress().data;
  const freeze = useFreeze();
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
          Avatar
        </span>
      </ListRow>
      <ListRow muted>3D (скоро)</ListRow>
      <ListRow onClick={() => navigate({ to: "/history" })}>History</ListRow>

      <p className="px-1 pt-3 pb-1.5 text-xs text-text-muted">Серия</p>
      {/* Заморозка: 1 неделя в месяц не рвёт серию (болезнь, отпуск) */}
      {p?.week_frozen ? (
        <ListRow
          onClick={() => !freeze.isPending && freeze.unfreeze()}
          right={
            <button
              type="button"
              onClick={() => !freeze.isPending && freeze.unfreeze()}
              className="h-tap px-1.5 text-xs text-accent"
            >
              отменить
            </button>
          }
        >
          ❄ Неделя заморожена
        </ListRow>
      ) : (
        <ListRow
          muted={!p || p.freezes_left === 0 || p.week_workouts >= p.week_goal}
          onClick={() => {
            if (!p || freeze.isPending || p.freezes_left === 0 || p.week_workouts >= p.week_goal)
              return;
            if (
              confirm(
                "Заморозить эту неделю? Серия не сгорит, даже если тренировок будет меньше трёх.",
              )
            ) {
              freeze.freeze();
            }
          }}
          right={
            p && (
              <span className="text-xs text-text-muted">
                {p.week_workouts >= p.week_goal ? "засчитана" : `осталось: ${p.freezes_left}`}
              </span>
            )
          }
        >
          Заморозить эту неделю
        </ListRow>
      )}

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
