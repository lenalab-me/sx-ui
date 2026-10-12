import type { ReactNode } from "react";
import { Crumbs, type Crumb } from "./Crumbs";
import { StatusLine } from "./StatusLine";

/**
 * One screen on the right of the Shell: a fixed header (breadcrumbs, meta on the right) and a scrolling main.
 * main is id="main" (the skip link's target) with tabIndex=-1. `status` is the text of the
 * role=status line at the top of main (for example "…を保存しました。"); the caller decides when to clear it.
 */
export function Page({
  crumbs,
  meta,
  status = null,
  children,
  footer,
}: {
  crumbs: Crumb[];
  meta?: ReactNode;
  status?: string | null;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <header className="flex min-h-13 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-sx-line px-10 py-3">
        <Crumbs items={crumbs} />
        {meta && (
          <div className="ml-auto flex items-center gap-3 text-sx-meta text-sx-muted">
            {meta}
          </div>
        )}
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-10 py-6 outline-none"
      >
        <StatusLine text={status} />
        {children}
      </main>
      {footer}
    </>
  );
}

/** The heading row of a screen (the h1 and the actions at the right end). */
export function PageTitle({
  title,
  children,
  after,
}: {
  title: ReactNode;
  children?: ReactNode;
  after?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <h1 className="text-sx-title leading-tight font-medium">{title}</h1>
      {after}
      {children && (
        <div className="ml-auto flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}

/** A white card. Give it `label` or `labelledBy` so the section has a name. */
export function Card({
  children,
  className = "",
  label,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-label={label}
      aria-labelledby={labelledBy}
      className={`rounded-sx-card border border-sx-line bg-sx-surface shadow-sx-card ${className}`}
    >
      {children}
    </section>
  );
}
