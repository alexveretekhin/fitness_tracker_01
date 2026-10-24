import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useAppStore } from "../store/useAppStore";

// Заставка: белый череп заливается красным снизу вверх, потом переход дальше.
// Тап по экрану пропускает заставку.
export function Splash() {
  const navigate = useNavigate();
  const avatar = useAppStore((s) => s.avatar);
  const next = () => navigate({ to: avatar ? "/home" : "/avatar", replace: true });

  return (
    <button type="button" onClick={next} className="relative h-full w-full overflow-hidden">
      <img
        src="/images/splash/skull-white.webp"
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <motion.img
        src="/images/splash/skull-red.webp"
        alt=""
        className="absolute inset-0 size-full object-cover"
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        animate={{ clipPath: "inset(0% 0 0 0)" }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
        onAnimationComplete={() => setTimeout(next, 400)}
      />
    </button>
  );
}
