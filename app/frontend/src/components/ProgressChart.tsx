import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useId, useState } from "react";
import { formatValue, type Series } from "../lib/stats";
import { Icon } from "./Icon";

// Линейный график прогресса, нарисован на SVG вручную (ADR 0010).
//
//   ≈ 72,5 кг · 4 ноя        ← выбранная точка (по умолчанию последняя)
//   ┊ 75 ─────────────────
//   ┊ 65 ──────●──────●───   оранжевая линия, под ней прозрачная заливка
//   ┊ 55 ──●──────────────   серые линии сетки и подписи
//      06.10   16.10   26.10
//
// Тап по точке показывает её дату и значение.
// Над точкой рекордной тренировки всегда стоит кубок. Тап по кубку выбирает
// этот день и открывает поверх графика окошко с рекордной тренировкой (ADR 0013).

const W = 320;
const H = 170;
const PAD = { left: 34, right: 10, top: 12, bottom: 22 };

type Props = {
  series: Series;
  recordCard?: ReactNode; // что показать в окошке по тапу на кубок
};

export function ProgressChart({ series, recordCard }: Props) {
  const { points, unit, approx, ticks } = series;
  const gradient = useId();
  const [picked, setPicked] = useState<number | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const selected = points[picked ?? points.length - 1];

  if (points.length === 0) {
    return (
      <div className="grid h-44 place-items-center text-sm text-text-muted">
        За этот период тренировок нет
      </div>
    );
  }

  const { lo, hi, grid } = niceScale(points.map((p) => p.value));

  const px = (x: number) => PAD.left + x * (W - PAD.left - PAD.right);
  const py = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const bottom = H - PAD.bottom;

  const line = points.map((p, i) => `${i ? "L" : "M"}${px(p.x)},${py(p.value)}`).join(" ");
  const area = `${line} L${px(points.at(-1)?.x ?? 0)},${bottom} L${px(points[0].x)},${bottom} Z`;
  // При смене упражнения или режима линия рисуется заново
  const drawKey = points.map((p) => `${p.x}:${p.value}`).join("|");

  return (
    <div>
      <p className="mb-1 h-6 text-sm">
        <span className="text-lg text-accent">
          {approx && "≈ "}
          {formatValue(selected.value)}
        </span>{" "}
        <span className="text-text-muted">
          {unit} · {selected.label}
        </span>
        {selected.record && (
          <span className="ml-1.5 text-accent">
            <Icon name="trophy" className="size-3.5 align-[-2px]" /> рекорд
          </span>
        )}
      </p>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {grid.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={py(v)}
                y2={py(v)}
                stroke="var(--color-flame-off)"
                strokeDasharray="2 4"
              />
              <text
                x={PAD.left - 6}
                y={py(v) + 3}
                textAnchor="end"
                fontSize="9"
                fill="var(--color-text-muted)"
              >
                {formatValue(v)}
              </text>
            </g>
          ))}
          {ticks.map((t) => (
            <text
              key={t.label}
              x={px(t.x)}
              y={H - 6}
              textAnchor="middle"
              fontSize="9"
              fill="var(--color-text-muted)"
            >
              {t.label}
            </text>
          ))}

          {/* Вертикальная пунктирная линия к выбранной точке */}
          <line
            x1={px(selected.x)}
            x2={px(selected.x)}
            y1={py(selected.value)}
            y2={bottom}
            stroke="var(--color-text-muted)"
            strokeDasharray="2 3"
          />

          <motion.path
            key={`area-${drawKey}`}
            d={area}
            fill={`url(#${gradient})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
          <motion.path
            key={`line-${drawKey}`}
            d={line}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          {points.map((p, i) => (
            <motion.circle
              key={`${drawKey}-${p.x}`}
              cx={px(p.x)}
              cy={py(p.value)}
              r={p === selected ? 4.5 : 3}
              fill={p === selected ? "var(--color-accent)" : "var(--color-surface)"}
              stroke="var(--color-accent)"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 + (0.55 * i) / points.length }}
            />
          ))}
        </svg>

        {/* Невидимые кнопки поверх точек: в них удобно попасть пальцем */}
        {points.map((p, i) => (
          <button
            type="button"
            key={`${p.x}-${p.label}`}
            aria-label={`${p.label}: ${formatValue(p.value)} ${unit}${p.record ? ", рекорд" : ""}`}
            onClick={() => {
              setPicked(i);
              setCardOpen(false);
            }}
            className="absolute size-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${(px(p.x) / W) * 100}%`, top: `${(py(p.value) / H) * 100}%` }}
          />
        ))}

        {/* Кубок над рекордной точкой: виден всегда, тап открывает окошко рекорда */}
        {points.map((p, i) =>
          p.record ? (
            <motion.button
              type="button"
              key={`trophy-${drawKey}`}
              aria-label="Рекордная тренировка"
              aria-expanded={cardOpen}
              onClick={() => {
                setPicked(i);
                setCardOpen((open) => !open);
              }}
              className="absolute grid size-8 -translate-x-1/2 place-items-center text-accent"
              style={{
                left: `${(px(p.x) / W) * 100}%`,
                top: `calc(${(py(p.value) / H) * 100}% - 34px)`,
              }}
              initial={{ opacity: 0, y: 6, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 400, damping: 18 }}
            >
              <Icon name="trophy" className="size-4" />
            </motion.button>
          ) : null,
        )}

        <AnimatePresence>
          {cardOpen && recordCard && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute inset-x-1 top-1 z-10 rounded-row border border-accent bg-surface-strong p-3 shadow-lg shadow-black/50"
            >
              <button
                type="button"
                aria-label="Закрыть рекорд"
                onClick={() => setCardOpen(false)}
                className="absolute top-1 right-1 grid size-8 place-items-center text-text-muted"
              >
                ×
              </button>
              {recordCard}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Шкала по вертикали: «круглый» шаг (1, 2, 2,5, 5, 10…), 2–4 линии сетки
// и запас сверху и снизу, чтобы линия не липла к краям
export function niceScale(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const raw = (max - min) / 2 || Math.max(1, max * 0.1);
  const pow = 10 ** Math.floor(Math.log10(raw));
  let step = ([1, 2, 2.5, 5, 10].find((m) => m * pow >= raw) ?? 10) * pow;
  // Повторы целые: подписи «15,5 повт.» не нужны
  if (values.every(Number.isInteger)) step = Math.max(1, step);
  const lo = Math.max(0, Math.floor((min - step * 0.3) / step) * step);
  const hi = Math.ceil((max + step * 0.3) / step) * step;
  const grid: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) grid.push(Math.round(v * 100) / 100);
  return { lo, hi, grid };
}
