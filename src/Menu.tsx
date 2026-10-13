import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { IconButton } from "./Button";
import { focusRing } from "./focus";
import { anchoredStyle, anchorNameOf, useTopLayer } from "./topLayer";

export interface MenuItem {
  label: string;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * The "…" menu at the end of a row (role=menu). Up/down arrows, Home and End move; Esc closes and
 * returns to the button. Selecting an item also returns focus to the button (a modal opened from
 * an item returns here when it closes). defaultOpen is for opening it from a URL. The list is
 * shown in the top layer (popover), so a table frame or a modal does not clip it.
 */
export function Menu({
  label,
  items,
  defaultOpen = false,
}: {
  label: string;
  items: MenuItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const anchor = anchorNameOf(id);
  useTopLayer(list, open);
  const focusAt = (i: number) => {
    const els = [
      ...(list.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ) ?? []),
    ];
    els[(i + els.length) % els.length]?.focus();
  };
  useEffect(() => {
    if (!open) return;
    focusAt(0);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!list.current?.contains(t) && !button.current?.contains(t))
        setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const els = [
      ...(list.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ) ?? []),
    ];
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") focusAt(i + 1);
    else if (e.key === "ArrowUp") focusAt(i - 1);
    else if (e.key === "Home") focusAt(0);
    else if (e.key === "End") focusAt(els.length - 1);
    else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.stopPropagation();
      close();
      return;
    } else return;
    e.preventDefault();
  };
  return (
    <div
      className="inline-flex"
      style={{ anchorName: anchor } as CSSProperties}
    >
      <IconButton
        ref={button}
        label={label}
        icon="ellipsis"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <ul
          ref={list}
          id={id}
          role="menu"
          aria-label={label}
          popover="manual"
          data-boundary
          onKeyDown={onKey}
          style={anchoredStyle(anchor, "end")}
          className="inset-auto m-0 mt-1 flex min-w-55 overflow-visible text-inherit flex-col rounded-sx-control border border-sx-control bg-sx-surface p-1 text-left shadow-sx-overlay"
        >
          {items.map((it) => {
            const cls = `flex h-10 w-full items-center rounded-sx-tile px-3 text-sx-base whitespace-nowrap ${it.disabled ? "cursor-not-allowed text-sx-muted" : it.danger ? "text-sx-error-ink hover:bg-sx-error-bg" : "text-sx-strong hover:bg-sx-fill"} ${focusRing}`;
            const select = () => {
              if (it.disabled) return;
              setOpen(false);
              button.current?.focus();
              it.onSelect?.();
            };
            return (
              <li key={it.label} role="none">
                {it.href && !it.disabled ? (
                  <a
                    role="menuitem"
                    tabIndex={-1}
                    href={it.href}
                    onClick={select}
                    className={cls}
                  >
                    {it.label}
                  </a>
                ) : (
                  <button
                    role="menuitem"
                    type="button"
                    tabIndex={-1}
                    aria-disabled={it.disabled || undefined}
                    onClick={select}
                    className={cls}
                  >
                    {it.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
