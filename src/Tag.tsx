import type { ReactNode } from "react";

export type TagTone = "fill" | "accent" | "outline";

const tones: Record<TagTone, string> = {
  fill: "bg-sx-fill text-sx-body",
  accent: "bg-sx-accent-soft text-sx-accent-ink",
  outline: "border border-sx-line bg-sx-surface text-sx-body",
};

/** A tag for meta information (site number, kind, area, device count, device type). */
export function Tag({
  children,
  tone = "fill",
}: {
  children: ReactNode;
  tone?: TagTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sx-tile px-2.5 py-0.5 text-sx-meta whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
