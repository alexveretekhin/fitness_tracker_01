import { motion } from "motion/react";
import type { Avatar } from "../api";

export const avatarSrc = (avatar: Avatar | null | undefined) =>
  `/images/avatars/${avatar ?? "male"}.webp`;

type Props = {
  avatar: Avatar | null | undefined;
  share: number; // сколько кольца закрашено: 0…1, прогресс до следующего уровня
  size: number; // px
  locked?: boolean; // закрытый аватар: тёмный силуэт
};

// Аватар в кольце XP. Кольцо = SVG-окружность, у которой видна только
// часть обводки (strokeDasharray): чем больше XP, тем длиннее дуга.
export function AvatarRing({ avatar, share, size, locked = false }: Props) {
  const stroke = Math.max(2, size / 30);
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-flame-off"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          initial={{ strokeDashoffset: length }}
          animate={{ strokeDashoffset: length * (1 - share) }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
          className="stroke-dot"
        />
      </svg>
      <img
        src={avatarSrc(avatar)}
        alt=""
        className={`absolute inset-[12%] size-[76%] object-contain ${locked ? "opacity-60 brightness-0" : ""}`}
      />
    </div>
  );
}
