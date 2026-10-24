import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { type Avatar, useAppStore } from "../store/useAppStore";

const options: { id: Avatar; src: string; label: string }[] = [
  { id: "male", src: "/images/avatars/male.webp", label: "Мужской аватар" },
  { id: "female", src: "/images/avatars/female.webp", label: "Женский аватар" },
];

export function AvatarChoice() {
  const navigate = useNavigate();
  const choose = useAppStore((s) => s.chooseAvatar);

  return (
    <div className="flex h-full flex-col items-center px-6 pt-10">
      <h1 className="text-2xl text-accent-soft">Fitness Tracker</h1>
      <p className="mt-1 text-sm">choose your avatar</p>

      <div className="mt-8 flex flex-col gap-6">
        {options.map((o, i) => (
          <motion.button
            type="button"
            key={o.id}
            aria-label={o.label}
            onClick={() => {
              choose(o.id);
              navigate({ to: "/home" });
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * i }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="grid h-48 w-40 place-items-end overflow-hidden rounded-card border border-border bg-surface hover:border-accent"
          >
            <img src={o.src} alt="" className="h-44 object-contain" />
          </motion.button>
        ))}
      </div>

      <p className="mt-auto mb-6 text-xs text-text-faint">more avatar in settings</p>
    </div>
  );
}
