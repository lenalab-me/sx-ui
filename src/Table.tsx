import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";

// Whether the table stacks its rows below md (Table's `stack`), for the parts inside it.
const Stack = createContext(false);

/** How a cell lays out its text. `numeric` right-aligns with tabular figures. */
interface CellLook {
  align?: "left" | "center" | "right";
  numeric?: boolean;
  nowrap?: boolean;
  truncate?: boolean;
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const cellLook = ({ align, numeric, nowrap, truncate }: CellLook) =>
  [
    numeric ? "text-right tabular-nums" : align ? alignClass[align] : "",
    nowrap ? "whitespace-nowrap" : "",
    truncate ? "truncate" : "",
  ].join(" ");

type CellProps<E> = Omit<E, "className" | "style" | "scope"> & CellLook;

/**
 * A list table (rows 56px high, one line per record). The caption is sr-only. The scroll frame is
 * relative. Column widths come from a <colgroup> placed first in the children.
 * `stack` is for a phone: below md each row becomes a block of its own (the cells one under the
 * other, the header row hidden) and each `Td` shows its `label` before the value, so the table
 * needs no sideways scrolling. From md up it is the same table as without `stack`. A stacked
 * table sets the table roles (table, rowgroup, row, columnheader, rowheader, cell) itself: with
 * display: block some browsers drop the table's meaning, and the roles say the same thing the
 * elements already do from md up.
 */
export function Table({
  caption,
  children,
  minWidth,
  stack = false,
}: {
  caption: string;
  children: ReactNode;
  minWidth?: number;
  stack?: boolean;
}) {
  return (
    <Stack.Provider value={stack}>
      <div className="relative overflow-x-auto">
        <table
          // A stacked table has no minimum width below md (it would bring the scrolling back).
          style={
            stack
              ? ({ "--sx-table-min": `${minWidth ?? 0}px` } as CSSProperties)
              : { minWidth }
          }
          role={stack ? "table" : undefined}
          className={`w-full table-fixed border-collapse text-left ${stack ? "md:min-w-(--sx-table-min) max-md:block max-md:[&_tbody]:block" : ""}`}
        >
          <caption className="sr-only">{caption}</caption>
          {children}
        </table>
      </div>
    </Stack.Provider>
  );
}

/** The header row: <THead><Th>…</Th></THead> */
export function THead({ children }: { children: ReactNode }) {
  const stack = useContext(Stack);
  return (
    <thead
      role={stack ? "rowgroup" : undefined}
      className={`bg-sx-subtle text-sx-muted ${stack ? "max-md:sr-only" : ""}`}
    >
      <tr
        role={stack ? "row" : undefined}
        className="h-11 border-y border-sx-row"
      >
        {children}
      </tr>
    </thead>
  );
}

export function Th({
  children,
  align,
  numeric,
  nowrap,
  truncate,
  ...rest
}: CellProps<ThHTMLAttributes<HTMLTableCellElement>>) {
  const stack = useContext(Stack);
  return (
    <th
      scope="col"
      role={stack ? "columnheader" : undefined}
      className={`px-3 font-normal first:pl-7 last:pr-7 ${cellLook({ align, numeric, nowrap, truncate })}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  selected = false,
}: {
  children: ReactNode;
  selected?: boolean;
}) {
  const stack = useContext(Stack);
  return (
    <tr
      role={stack ? "row" : undefined}
      aria-selected={selected || undefined}
      className={`h-14 border-b border-sx-row ${selected ? "bg-sx-accent-soft" : "hover:bg-sx-subtle"} ${stack ? "group/row max-md:flex max-md:h-auto max-md:flex-col max-md:gap-1 max-md:px-4 max-md:py-3" : ""}`}
    >
      {children}
    </tr>
  );
}

/** A row header (th scope=row). */
export function RowHead({
  children,
  align,
  numeric,
  nowrap,
  truncate,
  ...rest
}: CellProps<ThHTMLAttributes<HTMLTableCellElement>>) {
  const stack = useContext(Stack);
  return (
    <th
      scope="row"
      role={stack ? "rowheader" : undefined}
      className={`px-3 text-left font-medium first:pl-7 ${cellLook({ align, numeric, nowrap, truncate })} ${stack ? "max-md:px-0 max-md:first:pl-0" : ""}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align,
  numeric,
  nowrap,
  truncate,
  label,
  ...rest
}: CellProps<TdHTMLAttributes<HTMLTableCellElement>> & {
  /** The column's name, shown before the value in a stacked table (below md). */
  label?: string;
}) {
  const stack = useContext(Stack);
  return (
    <td
      role={stack ? "cell" : undefined}
      className={`px-3 first:pl-7 last:pr-7 ${cellLook({ align, numeric, nowrap, truncate })} ${stack ? "max-md:flex max-md:items-center max-md:gap-3 max-md:px-0 max-md:text-left max-md:first:pl-0 max-md:last:pr-0" : ""}`}
      {...rest}
    >
      {stack && label && (
        <span className="w-24 shrink-0 text-sx-meta text-sx-muted group-aria-selected/row:text-sx-body md:hidden">
          {label}
        </span>
      )}
      {children}
    </td>
  );
}
