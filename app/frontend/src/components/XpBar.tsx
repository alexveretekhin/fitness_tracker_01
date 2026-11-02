import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "../api";
import { Icon } from "./Icon";

// Под календарём на главной: недельная серия и тонкая полоска XP.
//
//   🔥 4 нед. ●●○                 ур. 1 · 650/2000
//   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Когда XP вырос (первый подход за день), полоска плавно доливается
// и над ней всплывает «+50».
export function XpBar() {
  const progress = useProgress().data;
  const [gain, setGain] = useState<number | null>(null);
  const prevXp = useRef<number | null>(null);

  useEffect(() => {
    if (!progress) return;
    const prev = prevXp.current;
    prevXp.current = progress.xp;
    if (prev === null || progress.xp <= prev) return;
    setGain(progress.xp - prev);
    const timer = setTimeout(() => setGain(null), 1500);
    return () => clearTimeout(timer);
  }, [progress]);

  if (!progress) return <div className="h-7" />;

  const { xp, level, level_from, level_to, streak_weeks, week_workouts, week_goal, week_frozen } =
    progress;
  const share = level_to === null ? 1 : (xp - level_from) / (level_to - level_from);

  return (
    <div className="relative px-1.5 pt-1 pb-0.5">
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <Icon
            name="flame"
            className={`size-3.5 ${streak_weeks > 0 ? "text-flame-on" : "text-flame-off"}`}
          />
          <span className={streak_weeks > 0 ? "text-text" : ""}>{streak_weeks} нед.</span>
          {/* Тренировки этой недели: ●●○ = 2 из 3 */}
          <span title={`На этой неделе ${week_workouts} из ${week_goal}`} className="flex gap-0.5">
            {Array.from({ length: week_goal }, (_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: точек всегда три, порядок не меняется
                key={i}
                className={`size-1.5 rounded-full ${i < week_workouts ? "bg-dot" : "bg-flame-off"}`}
              />
            ))}
          </span>
          {week_frozen && <span title="Неделя заморожена">❄</span>}
        </span>
        <span>
          ур. {level} · {level_to === null ? `${xp} XP` : `${xp}/${level_to}`}
        </span>
      </div>

      <div className="mt-1 h-1 overflow-hidden rounded-full bg-flame-off">
        <motion.div
          className="h-full rounded-full bg-dot"
          initial={false}
          animate={{ width: `${Math.round(share * 100)}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <AnimatePresence>
        {gain !== null && (
          <motion.span
            key={xp}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -18 }}
            className="absolute right-2 -top-1 text-xs font-bold text-accent"
          >
            +{gain} XP
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
