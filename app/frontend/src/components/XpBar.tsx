import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "../api";

// Под календарём на главной: уровень и тонкая полоска XP.
//
//   ур. 1                                 650/2000 XP
//   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  const { xp, level, level_from, level_to } = progress;
  const share = level_to === null ? 1 : (xp - level_from) / (level_to - level_from);

  return (
    <div className="relative px-1.5 pt-1 pb-0.5">
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span className="text-text">ур. {level}</span>
        <span>{level_to === null ? `${xp} XP` : `${xp}/${level_to} XP`}</span>
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
