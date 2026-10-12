import type { ReactNode } from "react";

export type PillTone = "ok" | "warn" | "neutral" | "error" | "accent";

const tones: Record<PillTone, { box: string; dot: string }> = {
  ok: { box: "bg-sx-ok-bg text-sx-ok-ink", dot: "bg-sx-ok-dot" },
  warn: { box: "bg-sx-warn-bg text-sx-warn-ink", dot: "bg-sx-warn-dot" },
  neutral: {
    box: "bg-sx-neutral-bg text-sx-neutral-ink",
    dot: "bg-sx-neutral-dot",
  },
  error: { box: "bg-sx-error-bg text-sx-error-ink", dot: "bg-sx-error-dot" },
  accent: { box: "bg-sx-accent-soft text-sx-accent-ink", dot: "bg-sx-accent" },
};

/** A status pill (dot + text). The state is readable from the text, so color is never the only signal. */
export function Pill({
  tone,
  children,
  size = "md",
}: {
  tone: PillTone;
  children: ReactNode;
  size?: "sm" | "md";
}) {
  const t = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-0.5 font-medium whitespace-nowrap ${size === "sm" ? "text-sx-meta" : "text-sx-base"} ${t.box}`}
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${t.dot}`}
      />
      {children}
    </span>
  );
}
