import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { IconButton } from "./Button";
import { anchoredStyle, anchorNameOf, useTopLayer } from "./topLayer";

/**
 * A floating box. With `anchor` it is shown in the top layer (popover) below that element, so no
 * scroll frame or modal clips it, and above it when there is no room below; without `anchor` it is
 * placed inside the caller's relative frame. A click outside, Esc or "閉じる" closes it.
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
  const name = anchorNameOf(useId());
  const topLayer = anchor !== undefined;
  useTopLayer(box, topLayer);
  // The anchor element gets the anchor name for as long as the box is open.
  useLayoutEffect(() => {
    const el = anchor?.current;
    if (!el) return;
    el.style.setProperty("anchor-name", name);
    return () => {
      el.style.removeProperty("anchor-name");
    };
  }, [anchor, name]);
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
      // preventDefault keeps a <dialog> around the box from taking this Esc as its close request.
      e.stopPropagation();
      e.preventDefault();
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
      popover={topLayer ? "manual" : undefined}
      style={topLayer ? anchoredStyle(name, align) : undefined}
      className={`${topLayer ? "inset-auto m-0 overflow-visible text-inherit" : `absolute top-full z-30 ${align === "end" ? "right-0" : "left-0"}`} mt-1 flex ${size === "md" ? "w-96" : "w-70"} max-w-[calc(100vw-1rem)] flex-col gap-2 rounded-sx-control border border-sx-control bg-sx-surface p-3 text-left shadow-sx-overlay`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sx-meta font-medium text-sx-body">{label}</p>
        <IconButton label="閉じる" icon="x" onClick={onClose} />
      </div>
      {children}
    </div>
  );
}
