import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PALETTE } from "../lib/catalog";

/* ---------------- Toasts ---------------- */

interface Toast {
  id: number;
  text: string;
}
const ToastContext = createContext<(text: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.text}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ---------------- Modal ---------------- */

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div ref={ref} className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Colour picker ---------------- */

export function ColorPicker({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  return (
    <div className="color-picker" role="group" aria-label={label}>
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch ${value.toLowerCase() === c ? "on" : ""}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={`Colour ${c}`}
          aria-pressed={value.toLowerCase() === c}
        />
      ))}
      <label className="swatch custom" title="Custom colour">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Custom ${label.toLowerCase()}`} />
        <span style={{ background: value }} />
      </label>
    </div>
  );
}

/* ---------------- Chips (multi-select) ---------------- */

export function ChipSelect<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T[]; onChange: (v: T[]) => void; label: string }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" className={`chip ${on ? "on" : ""}`} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Icons (inline SVG) ---------------- */

const PATHS: Record<string, string> = {
  studio: "M12 3a3 3 0 0 1 3 3c0 1.3-.9 2-1.8 2.6-.7.4-1.2.9-1.2 1.6v.3l8.1 4.8c1 .6.6 2.2-.6 2.2H4.5c-1.2 0-1.6-1.6-.6-2.2L12 10.5",
  wardrobe: "M5 3h14v18H5zM12 3v18M9.5 11v2M14.5 11v2",
  outfits: "M8 3l-4 3 2 4 2-1v12h8V9l2 1 2-4-4-3c-.5 1.7-2.2 3-4 3S8.5 4.7 8 3z",
  avatar: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7",
  insights: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  undo: "M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  redo: "M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3",
  shuffle: "M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
  save: "M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  heart: "M12 20s-7-4.4-9-9c-1.2-2.8.6-6 3.8-6 2 0 3.2 1.1 4.2 2.5C12 6.1 13.2 5 15.2 5c3.2 0 5 3.2 3.8 6-2 4.6-7 9-7 9z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  calendar: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  eraser: "M4 20h16M7 17l-3-3 9-9 6 6-6 6H7z",
};

export function Icon({ name, size = 18, filled = false }: { name: keyof typeof PATHS | string; size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
