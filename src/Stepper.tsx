import type { CSSProperties, MouseEvent } from "react";
import { focusRing } from "./focus";

export interface Step {
  id: string;
  label: string;
  hint: string;
  href: string;
}

/**
 * The workflow stepper at the top of a site screen (nav aria-label="工程"). The current step is
 * aria-current="step"; the others are links. onNavigate can stop a navigation (preventDefault).
 */
export function Stepper({
  steps,
  current,
  onNavigate,
}: {
  steps: Step[];
  current: string;
  onNavigate?: (e: MouseEvent<HTMLAnchorElement>, step: Step) => void;
}) {
  return (
    <nav
      aria-label="工程"
      className="shrink-0 rounded-sx-card border border-sx-line bg-sx-surface px-4 py-3 shadow-sx-card md:px-6"
    >
      {/* Side by side from md; one under the other below it (the steps' names do not fit a phone in a row). */}
      <ol
        className="grid grid-cols-1 gap-2 md:grid-cols-(--sx-step-columns)"
        style={
          {
            "--sx-step-columns": `repeat(${steps.length}, minmax(0, 1fr))`,
          } as CSSProperties
        }
      >
        {steps.map((s, i) => {
          const cur = s.id === current;
          return (
            <li key={s.id}>
              <a
                href={s.href}
                onClick={(e) => (cur ? e.preventDefault() : onNavigate?.(e, s))}
                aria-current={cur ? "step" : undefined}
                className={`flex items-center gap-3 rounded-sx-control px-3 py-2 ${focusRing} ${cur ? "bg-sx-accent-soft" : "hover:bg-sx-subtle"}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sx-meta font-semibold ${
                    cur
                      ? "border-sx-accent bg-sx-accent text-sx-on-solid"
                      : "border-sx-control bg-sx-surface text-sx-body"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex min-w-0 flex-col leading-snug">
                  <span
                    className={`font-medium ${cur ? "text-sx-accent-ink" : "text-sx-strong"}`}
                  >
                    <span className="sr-only">{`工程${i + 1}：`}</span>
                    {s.label}
                  </span>
                  <span
                    className={`truncate text-sx-meta ${cur ? "text-sx-accent-ink" : "text-sx-muted"}`}
                  >
                    {cur ? "現在の画面" : s.hint}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
