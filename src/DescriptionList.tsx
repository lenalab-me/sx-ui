import type { ReactNode } from "react";

/**
 * Terms and their values in two columns on a tinted panel, for facts the user reads but does not
 * edit (for example the values that come from STEP1).
 */
export function DescriptionList({
  items,
}: {
  items: { term: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-sx-control border border-sx-line bg-sx-subtle px-5 py-4">
      {items.map((item) => (
        <div key={item.term} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-sx-meta text-sx-muted">{item.term}</dt>
          <dd className="break-words text-sx-strong">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
