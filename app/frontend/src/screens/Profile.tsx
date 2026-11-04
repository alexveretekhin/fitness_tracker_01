import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useMe, useProgress } from "../api";
import { AvatarRing } from "../components/AvatarRing";
import { Panel, QueryState } from "../components/ui";

// Страница аватара: аватар в кольце XP, уровень и сколько осталось до следующего.
// Тап по аватару выдвигает снизу все уровни: открытые и тёмные закрытые.
export function Profile() {
  const navigate = useNavigate();
  const avatar = useMe().data?.avatar;
  const query = useProgress();
  const p = query.data;
  const [sheet, setSheet] = useState(false);

  return (
    <>
      <Panel className="flex flex-1 flex-col items-center overflow-y-auto pt-6">
        <QueryState isPending={query.isPending} isError={query.isError} />
        {p && (
          <>
            <button
              type="button"
              onClick={() => setSheet(true)}
              aria-label="Показать уровни аватара"
              className="active:scale-95"
            >
              <AvatarRing
                avatar={avatar}
                size={200}
                share={
                  p.level_to === null ? 1 : (p.xp - p.level_from) / (p.level_to - p.level_from)
                }
              />
            </button>
            <p className="mt-4 text-xl">Уровень {p.level}</p>
            <p className="text-sm text-text-muted">{p.xp} XP</p>
            <p className="mt-1 text-xs text-text-muted">
              {p.level_to === null
                ? "максимальный уровень"
                : `до уровня ${p.level + 1}: ${p.level_to - p.xp} XP`}
            </p>
            <p className="mt-6 px-6 text-center text-[11px] text-text-faint">
              50 XP за каждый день с тренировкой.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/avatar" })}
              className="mt-auto mb-3 h-9 text-sm text-text-muted"
            >
              Сменить аватар
            </button>
          </>
        )}
      </Panel>

      <AnimatePresence>
        {sheet && p && (
          <>
            <motion.button
              type="button"
              aria-label="Закрыть"
              className="absolute inset-0 z-10 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheet(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 z-20 rounded-t-[20px] border-t border-border bg-surface p-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            >
              <h3 className="mb-4 text-lg">Аватары</h3>
              <div className="flex justify-around">
                {p.levels.map((threshold, i) => {
                  const level = i + 1;
                  const open = p.level >= level;
                  return (
                    <div key={level} className="flex flex-col items-center">
                      <AvatarRing
                        avatar={avatar}
                        size={88}
                        share={open ? 1 : Math.min(1, p.xp / threshold)}
                        locked={!open}
                      />
                      <p className={`mt-2 text-sm ${open ? "" : "text-text-muted"}`}>
                        {open ? "" : "🔒 "}ур. {level}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {open ? "открыт" : `${threshold} XP`}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-[11px] text-text-faint">
                Новые аватары появятся с артами, пока это силуэты
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
