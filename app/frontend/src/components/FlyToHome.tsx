import { AnimatePresence, motion } from "motion/react";
import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";

// Анимация «упражнение улетает на главную».
// Экран вызывает fly(откуда, подпись), а слой рисует плашку,
// которая летит от строки к кнопке в нижнем меню (target).

type Flyer = { id: number; label: string; from: DOMRect; to: DOMRect };

type FlyApi = {
  fly: (from: DOMRect, label: string) => Promise<void>;
  targetRef: React.RefObject<HTMLButtonElement | null>;
};

const FlyContext = createContext<FlyApi | null>(null);

export function useFly(): FlyApi {
  const ctx = useContext(FlyContext);
  if (!ctx) throw new Error("useFly нужно вызывать внутри FlyProvider");
  return ctx;
}

const DURATION = 0.6;

export function FlyProvider({ children }: { children: ReactNode }) {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const targetRef = useRef<HTMLButtonElement | null>(null);
  const nextId = useRef(0);

  const fly = useCallback((from: DOMRect, label: string) => {
    const to = targetRef.current?.getBoundingClientRect();
    if (!to) return Promise.resolve();
    const id = nextId.current++;
    setFlyers((list) => [...list, { id, label, from, to }]);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setFlyers((list) => list.filter((f) => f.id !== id));
        resolve();
      }, DURATION * 1000);
    });
  }, []);

  return (
    <FlyContext.Provider value={{ fly, targetRef }}>
      {children}
      <AnimatePresence>
        {flyers.map((f) => (
          <motion.div
            key={f.id}
            className="pointer-events-none fixed z-50 rounded-row bg-accent px-3 py-1.5 text-sm font-bold text-bg"
            style={{ left: f.from.left + 12, top: f.from.top + 4 }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: f.to.left + f.to.width / 2 - (f.from.left + 12) - 20,
              y: f.to.top + f.to.height / 2 - (f.from.top + 4) - 14,
              scale: 0.2,
              opacity: 0.2,
            }}
            transition={{ duration: DURATION, ease: [0.34, 1.2, 0.64, 1] }}
          >
            {f.label}
          </motion.div>
        ))}
      </AnimatePresence>
    </FlyContext.Provider>
  );
}
