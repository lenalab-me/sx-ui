import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export type TagTone =
  "fill" | "accent" | "outline" | "permit" | "deny" | "implicit-deny";

const tones: Record<TagTone, { box: string; icon?: IconName }> = {
  fill: { box: "bg-sx-fill text-sx-body" },
  accent: { box: "bg-sx-accent-soft text-sx-accent-ink" },
  outline: { box: "border border-sx-line bg-sx-surface text-sx-body" },
  // The action of an access rule. Green and red carry a meaning here, so each one also has an icon and
  // its text (never color alone). The solid fills are the dark ok/error inks with white text (5.70:1 and
  // 7.10:1); the implicit deny is only an outline, so it reads as a different thing from a rule that was written.
  permit: { box: "bg-sx-ok-ink text-sx-on-solid font-medium", icon: "check" },
  deny: { box: "bg-sx-error-ink text-sx-on-solid font-medium", icon: "ban" },
  "implicit-deny": {
    box: "border border-sx-error-ink bg-sx-surface text-sx-error-ink font-medium",
    icon: "ban",
  },
};

/**
 * A tag for meta information (site number, kind, area, device count, device type). The tones `permit`,
 * `deny` and `implicit-deny` are the action of an access rule: they draw an icon (a check, or a
 * prohibition sign) before the text, and the text ("許可", "拒否") is still required.
 */
export function Tag({
  children,
  tone = "fill",
}: {
  children: ReactNode;
  tone?: TagTone;
}) {
  const t = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sx-tile px-2.5 py-0.5 text-sx-meta whitespace-nowrap ${t.box}`}
    >
      {t.icon && <Icon name={t.icon} size={14} />}
      {children}
    </span>
  );
}
