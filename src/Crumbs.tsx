import { focusRing } from "./focus";
import { LinkText } from "./LinkText";

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumbs. The last item is the current page and is not a link. */
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="現在位置"
      className="flex min-w-0 flex-wrap items-center gap-2 text-sx-meta text-sx-muted"
    >
      {items.map((it, i) => (
        <span
          key={`${i}-${it.label}`}
          className="flex min-w-0 items-center gap-2"
        >
          {i > 0 && <span aria-hidden="true">/</span>}
          {it.href && i < items.length - 1 ? (
            <a
              href={it.href}
              className={`underline underline-offset-4 hover:text-sx-strong ${focusRing}`}
            >
              <LinkText>{it.label}</LinkText>
            </a>
          ) : (
            <span aria-current="page" className="truncate text-sx-body">
              {it.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
