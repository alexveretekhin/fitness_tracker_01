import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import type { RecordOut } from "../api";
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
// Кубок слева над графиком: тап выбирает рекордный день, над его точкой
// появляется кубок, а под строкой значения сам рекорд (ADR 0013).

const W = 320;
const H = 170;
const PAD = { left: 34, right: 10, top: 12, bottom: 22 };

type Props = {
  series: Series;
  record?: RecordOut | null; // рекорд упражнения: есть = слева кнопка-кубок
};

export function ProgressChart({ series, record }: Props) {
  const { points, unit, approx, ticks } = series;
  const gradient = useId();
  const [picked, setPicked] = useState<number | null>(null);
  const [showRecord, setShowRecord] = useState(false);
  const selected = points[picked ?? points.length - 1];
  const recordIndex = points.findIndex((p) => p.record);

  const toggleRecord = () => {
    const next = !showRecord;
    setShowRecord(next);
    if (next && recordIndex >= 0) setPicked(recordIndex);
  };

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
      <div className="mb-1 flex min-h-8 items-center gap-2 text-sm">
        {record && (
          <button
            type="button"
            onClick={toggleRecord}
            aria-pressed={showRecord}
            aria-label="Показать рекорд"
            className={`grid size-8 shrink-0 place-items-center rounded-full border transition active:scale-90 ${
              showRecord ? "border-accent text-accent" : "border-border text-text-muted"
            }`}
          >
            <Icon name="trophy" className="size-4" />
          </button>
        )}
        <p>
          <span className="text-lg text-accent">
            {approx && "≈ "}
            {formatValue(selected.value)}
          </span>{" "}
          <span className="text-text-muted">
            {unit} · {selected.label}
          </span>
        </p>
      </div>

      <AnimatePresence initial={false}>
        {record && showRecord && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden text-xs text-text-muted"
          >
            <span className="block pb-1">
              Рекорд:{" "}
              <span className="text-accent">
                {record.weight > 0
                  ? `${formatValue(record.weight)} кг × ${record.reps}`
                  : `${record.reps} повт.`}
              </span>
              {record.weight > 0 && ` (сила ≈ ${formatValue(record.strength)} кг)`} ·{" "}
              {formatDate(record.date)}
              {recordIndex < 0 && " · на этом графике его нет, посмотри «Год»"}
            </span>
          </motion.p>
        )}
      </AnimatePresence>

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

        {/* Кубок над рекордной точкой: появляется по кнопке-кубку слева */}
        {points
          .filter((p) => p.record && showRecord)
          .map((p) => (
            <motion.span
              key={`trophy-${drawKey}`}
              aria-hidden
              className="pointer-events-none absolute -translate-x-1/2 text-accent"
              style={{
                left: `${(px(p.x) / W) * 100}%`,
                top: `calc(${(py(p.value) / H) * 100}% - 26px)`,
              }}
              initial={{ opacity: 0, y: 6, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <Icon name="trophy" className="size-4" />
            </motion.span>
          ))}

        {/* Невидимые кнопки поверх точек: в них удобно попасть пальцем */}
        {points.map((p, i) => (
          <button
            type="button"
            key={`${p.x}-${p.label}`}
            aria-label={`${p.label}: ${formatValue(p.value)} ${unit}${p.record ? ", рекорд" : ""}`}
            onClick={() => setPicked(i)}
            className="absolute size-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${(px(p.x) / W) * 100}%`, top: `${(py(p.value) / H) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// "2026-06-06" → "06.06.26"
function formatDate(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(2, 4)}`;
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
