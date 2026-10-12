import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { IconButton } from "./Button";

/**
 * A floating box inside the caller's relative frame. A click outside, Esc or "閉じる" closes it.
 * On close, focus returns to `anchor` (the button that opened it); on open, the first control inside takes focus.
 * data-boundary makes the contrast audit check its border.
 */
export function Popover({
  label,
  onClose,
  children,
  anchor,
  align = "start",
  size = "sm",
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  anchor?: RefObject<HTMLElement | null>;
  align?: "start" | "end";
  /** sm is 280px wide, md is 384px. */
  size?: "sm" | "md";
}) {
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useLayoutEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    // The refs are detached by the time the cleanup runs, so keep the return target and our own box from the open.
    const anchorEl = anchor?.current;
    const boxEl = box.current;
    boxEl
      ?.querySelector<HTMLElement>("input,button,select,textarea,a[href]")
      ?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (boxEl?.contains(t) || anchorEl?.contains(t)) return;
      closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      closeRef.current();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      // When the inner element goes away, focus falls to body. If it moved to an outside element, do not take it.
      const active = document.activeElement;
      if (
        anchorEl?.isConnected &&
        (!active || active === document.body || boxEl?.contains(active))
      )
        anchorEl.focus();
    };
  }, [anchor]);
  return (
    <div
      ref={box}
      role="dialog"
      aria-label={label}
      data-boundary
      className={`absolute top-full z-30 mt-1 flex ${size === "md" ? "w-96" : "w-70"} flex-col gap-2 rounded-sx-control border border-sx-control bg-sx-surface p-3 text-left shadow-sx-overlay ${align === "end" ? "right-0" : "left-0"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sx-meta font-medium text-sx-body">{label}</p>
        <IconButton label="閉じる" icon="x" onClick={onClose} />
      </div>
      {children}
    </div>
  );
}
