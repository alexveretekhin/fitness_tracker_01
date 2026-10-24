import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useAppStore } from "../store/useAppStore";
import { useFly } from "./FlyToHome";
import { Icon } from "./Icon";

const round =
  "grid size-12 place-items-center rounded-full bg-accent text-bg transition-transform active:scale-90";

// Нижнее меню: История, «+», Настройки.
// Средняя кнопка на главной ведёт к выбору мышц, а на других экранах
// возвращает на главную. В неё же «прилетают» выбранные упражнения.
export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const count = useAppStore((s) => s.addedThisRound);
  const resetRound = useAppStore((s) => s.resetRound);
  const { targetRef } = useFly();

  const onHome = path === "/home";

  const onMiddle = () => {
    if (onHome) {
      navigate({ to: "/muscles" });
    } else {
      resetRound();
      navigate({ to: "/home" });
    }
  };

  return (
    <nav className="flex h-nav shrink-0 items-center justify-around">
      <Link to="/history" className={round} aria-label="История">
        <Icon name="history" className="size-6" />
      </Link>

      <button
        ref={targetRef}
        type="button"
        onClick={onMiddle}
        className={`${round} relative`}
        aria-label={onHome ? "Добавить упражнения" : "На главную"}
      >
        <Icon name="plus" className="size-6" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-text px-1 text-xs font-bold text-bg"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <Link to="/settings" className={round} aria-label="Настройки">
        <Icon name="settings" className="size-6" />
      </Link>
    </nav>
  );
}
