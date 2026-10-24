import type { ReactNode } from "react";
import { Icon } from "./Icon";

// Мелкие повторяющиеся элементы интерфейса из дизайн-системы.

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-border p-1.5 ${className}`}>{children}</div>;
}

type RowProps = {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  right?: ReactNode;
  upper?: boolean;
  muted?: boolean;
};

export function ListRow({ children, onClick, right, upper, muted }: RowProps) {
  return (
    <div className="mb-1.5 flex min-h-tap items-center rounded-row border border-border bg-surface transition active:scale-[0.97] active:bg-surface-strong">
      <button
        type="button"
        onClick={onClick}
        className={`min-h-tap flex-1 truncate px-3 text-left ${upper ? "uppercase" : ""} ${muted ? "text-text-muted" : ""}`}
      >
        {children}
      </button>
      {right && <div className="flex items-center pr-1.5">{right}</div>}
    </div>
  );
}

export function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-1.5 flex h-tap items-center gap-2 rounded-row border border-border bg-surface px-3 text-text">
      <Icon name="search" className="size-4 text-text-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SEARCH"
        className="w-full bg-transparent outline-none placeholder:text-text-faint"
      />
    </label>
  );
}

export function PlayButton({ onClick, active }: { onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Показать технику"
      className={`size-7 transition ${active ? "text-accent" : "text-play"}`}
    >
      <Icon name="play" className="size-7" />
    </button>
  );
}

export function EmptyState({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-full w-full place-items-center text-text-faint"
    >
      {children}
    </button>
  );
}
