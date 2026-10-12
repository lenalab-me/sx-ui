import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export type NoticeTone = "warn" | "error" | "info" | "ok";

const tones: Record<NoticeTone, { box: string; icon: ReactNode }> = {
  warn: {
    box: "border-l-sx-warn-dot bg-sx-warn-bg text-sx-warn-ink",
    icon: <TriangleAlert size={20} />,
  },
  error: {
    box: "border-l-sx-error-dot bg-sx-error-bg text-sx-error-ink",
    icon: <CircleAlert size={20} />,
  },
  info: {
    box: "border-l-sx-accent bg-sx-accent-soft text-sx-accent-ink",
    icon: <Info size={20} />,
  },
  ok: {
    box: "border-l-sx-ok-dot bg-sx-ok-bg text-sx-ok-ink",
    icon: <CircleCheck size={20} />,
  },
};

/**
 * A banner: a 4px left band, an icon, the text and the actions.
 * No role by default; pass role="alert" or "status" only when it must be announced the moment it appears.
 */
export function Notice({
  tone,
  title,
  children,
  actions,
  role,
}: {
  tone: NoticeTone;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  role?: "alert" | "status";
}) {
  const t = tones[tone];
  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-sx-control border border-l-4 border-sx-line px-5 py-3 ${t.box}`}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {t.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium">{title}</p>
        {children && <div className="text-sx-base">{children}</div>}
      </div>
      {actions && (
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2 self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
