import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

/** What to show in place of an empty list or table (for example "まだ拠点がありません。…"). */
export function EmptyState({
  children,
  action,
  icon,
}: {
  children: ReactNode;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-7 py-10 text-center text-sx-muted">
      {icon && (
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-sx-fill"
        >
          <Icon name={icon} size={20} />
        </span>
      )}
      <p>{children}</p>
      {action}
    </div>
  );
}
