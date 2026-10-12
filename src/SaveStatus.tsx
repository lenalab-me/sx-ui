import { Check, CircleAlert, Loader, PenLine } from "lucide-react";
import type { ReactNode } from "react";

export type SaveState = "saved" | "unsaved" | "saving" | "failed";

const look: Record<SaveState, { cls: string; icon: ReactNode; label: string }> =
  {
    saved: {
      cls: "bg-sx-ok-bg text-sx-ok-ink",
      icon: <Check size={16} />,
      label: "保存済み",
    },
    unsaved: {
      cls: "bg-sx-warn-bg text-sx-warn-ink",
      icon: <PenLine size={16} />,
      label: "未保存",
    },
    saving: {
      cls: "bg-sx-neutral-bg text-sx-neutral-ink",
      icon: <Loader size={16} className="animate-spin" />,
      label: "保存中…",
    },
    failed: {
      cls: "bg-sx-error-bg text-sx-error-ink",
      icon: <CircleAlert size={16} />,
      label: "保存失敗",
    },
  };

/**
 * The save state, shown with an icon and text so color is never the only signal.
 * When two appear on one screen, make only one of them `live` (to avoid announcing twice).
 */
export function SaveStatus({
  state,
  live = false,
}: {
  state: SaveState;
  live?: boolean;
}) {
  const l = look[state];
  return (
    <span
      role={live ? "status" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sx-meta font-medium whitespace-nowrap ${l.cls}`}
    >
      <span aria-hidden="true" className="flex">
        {l.icon}
      </span>
      {l.label}
    </span>
  );
}
