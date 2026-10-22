import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { focusRing } from "./focus";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
}

export type TabsVariant = "underline" | "segmented" | "pill";

const look: Record<
  TabsVariant,
  { list: string; tab: (on: boolean) => string }
> = {
  // Page-level sections, such as "拠点 / テンプレート" on the project overview. Every list is
  // shrink-0: below md they are scroll frames (overflow-x-auto), whose minimum height is 0, so in a
  // column that is taller than its box (the main of a screen) they would be the ones that shrink,
  // down to the padding, and their labels would hang out under the box that follows.
  underline: {
    list: "flex shrink-0 gap-6 max-md:gap-4 max-md:overflow-x-auto max-md:pb-px",
    tab: (on) =>
      `-mb-px flex items-center gap-2 border-b-3 pb-3 pt-1 text-sx-lead max-md:shrink-0 max-md:whitespace-nowrap ${on ? "border-sx-accent font-medium text-sx-strong" : "border-transparent text-sx-muted hover:text-sx-strong"}`,
  },
  // A view switch, such as "作図 / フォーム"
  segmented: {
    list: "flex shrink-0 gap-1 rounded-sx-control bg-sx-fill p-1 max-md:overflow-x-auto",
    tab: (on) =>
      `flex items-center gap-2 rounded-sx-tile px-4 py-1.5 max-md:shrink-0 max-md:whitespace-nowrap ${on ? "bg-sx-surface font-medium text-sx-strong shadow-sx-raised" : "text-sx-body hover:text-sx-strong"}`,
  },
  // Status filters and the five order tabs. Below md they scroll sideways like the other two
  // (wrapping would stack them in several rows); the padding with the negative margin leaves room
  // for the focus ring, which the scroll frame would clip.
  pill: {
    list: "flex shrink-0 flex-wrap gap-1 max-md:-m-2 max-md:flex-nowrap max-md:overflow-x-auto max-md:p-2",
    tab: (on) =>
      `flex items-center gap-2 rounded-sx-control px-4 py-2 max-md:shrink-0 max-md:whitespace-nowrap ${on ? "bg-sx-fill font-medium text-sx-strong" : "text-sx-body hover:bg-sx-subtle"}`,
  },
};

const tabId = (idPrefix: string, id: string) => `${idPrefix}-tab-${id}`;
const panelId = (idPrefix: string, id: string) => `${idPrefix}-panel-${id}`;

/**
 * A role=tablist. Left/right arrows, Home and End move focus and selection together (selection
 * follows focus). The panels are <TabPanel>s that share the same idPrefix.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
  variant = "underline",
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  idPrefix: string;
  variant?: TabsVariant;
}) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const enabled = items.filter((i) => !i.disabled);
  const onKey = (e: KeyboardEvent) => {
    const i = enabled.findIndex((t) => t.id === value);
    const to =
      e.key === "ArrowRight"
        ? enabled[(i + 1) % enabled.length]
        : e.key === "ArrowLeft"
          ? enabled[(i - 1 + enabled.length) % enabled.length]
          : e.key === "Home"
            ? enabled[0]
            : e.key === "End"
              ? enabled[enabled.length - 1]
              : undefined;
    if (!to) return;
    e.preventDefault();
    onChange(to.id);
    refs.current.get(to.id)?.focus();
  };
  const l = look[variant];
  return (
    <div role="tablist" aria-label={label} className={l.list} onKeyDown={onKey}>
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              if (el) refs.current.set(t.id, el);
              else refs.current.delete(t.id);
            }}
            type="button"
            role="tab"
            id={tabId(idPrefix, t.id)}
            aria-selected={on}
            aria-controls={panelId(idPrefix, t.id)}
            tabIndex={on ? 0 : -1}
            disabled={t.disabled}
            onClick={() => onChange(t.id)}
            className={`${l.tab(on)} disabled:cursor-not-allowed disabled:text-sx-muted ${focusRing}`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`text-sx-meta font-normal text-sx-muted tabular-nums ${variant === "underline" ? "rounded-sx-tile bg-sx-fill px-2 py-0.5" : ""}`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A tab panel; its children are stacked. With keepMounted the panel stays mounted (hidden) when
 * it is not selected, for example the drawing and the form of the physical screen.
 */
export function TabPanel({
  idPrefix,
  id,
  value,
  children,
  keepMounted = false,
}: {
  idPrefix: string;
  id: string;
  value: string;
  children: ReactNode;
  keepMounted?: boolean;
}) {
  const on = id === value;
  if (!on && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={panelId(idPrefix, id)}
      aria-labelledby={tabId(idPrefix, id)}
      hidden={!on}
      className="flex flex-col gap-4"
    >
      {children}
    </div>
  );
}
