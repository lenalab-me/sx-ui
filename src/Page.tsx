import type { ReactNode } from "react";
import { Crumbs, type Crumb } from "./Crumbs";
import { StatusLine } from "./StatusLine";

/**
 * One screen on the right of the Shell: a fixed header (breadcrumbs, meta on the right) and a scrolling main.
 * main is id="main" (the skip link's target) with tabIndex=-1. `status` is the text of the
 * role=status line at the top of main (for example "…を保存しました。"); the caller decides when to clear it.
 * `footer` is a band under main (outside it, so it does not scroll): put the buttons that move
 * between steps in it, the first at the left end and the last at the right end.
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
      <header className="flex min-h-13 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-sx-line px-4 py-3 md:px-10">
        <Crumbs items={crumbs} />
        {meta && (
          <div className="ml-auto flex items-center gap-3 text-sx-meta text-sx-muted max-md:flex-wrap">
            {meta}
          </div>
        )}
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 outline-none md:gap-5 md:px-10 md:py-6"
      >
        <StatusLine text={status} />
        {children}
      </main>
      {footer && (
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-sx-line bg-sx-surface px-4 py-3 max-md:flex-wrap md:px-10">
          {footer}
        </footer>
      )}
    </>
  );
}

/** The heading row of a screen (the h1 and the actions at the right end). */
export function PageTitle({
  title,
  subtitle,
  children,
  after,
}: {
  title: ReactNode;
  /** A line at the right of the h1, for what the screen is about (for example the project's name). */
  subtitle?: ReactNode;
  children?: ReactNode;
  after?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <h1 className="text-sx-heading leading-tight font-medium md:text-sx-title">
        {title}
      </h1>
      {subtitle && <p className="text-sx-lead text-sx-body">{subtitle}</p>}
      {after}
      {children && (
        <div className="flex flex-wrap items-center gap-2 md:ml-auto md:flex-nowrap">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * A white card. Give it `label` or `labelledBy` so the section has a name. A card has no padding
 * of its own (the caller adds it with `className`). `flush` is for a Table (or a CardHead and then
 * a Table) that runs edge to edge: the content is clipped to the rounded corners, so the header
 * band does not stick out of them, and a Table placed first drops its top border and the last
 * row its bottom border (the card's border is already there). Do not add padding to a flush card.
 */
export function Card({
  children,
  className = "",
  label,
  labelledBy,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  labelledBy?: string;
  flush?: boolean;
}) {
  return (
    <section
      aria-label={label}
      aria-labelledby={labelledBy}
      className={`rounded-sx-card border border-sx-line bg-sx-surface shadow-sx-card ${flush ? "overflow-clip [&>div:first-child_thead_tr]:border-t-0 [&_tbody_tr:last-child]:border-b-0" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * The top edge of a Card that holds tabs: `children` (an underline Tabs) at the left on a bottom
 * rule, and an optional `note` at the right (a sentence about what the card lists).
 */
export function CardHead({
  children,
  note,
}: {
  children: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="flex items-end gap-6 border-b border-sx-row px-4 pt-5 max-md:flex-col max-md:items-stretch max-md:gap-3 md:px-7">
      {children}
      {note && (
        <p className="ml-auto max-w-160 pb-3 text-sx-meta text-sx-muted">
          {note}
        </p>
      )}
    </div>
  );
}
