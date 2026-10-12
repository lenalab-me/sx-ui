import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

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
 */
export function Table({
  caption,
  children,
  minWidth,
}: {
  caption: string;
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="relative overflow-x-auto">
      <table
        style={{ minWidth }}
        className="w-full table-fixed border-collapse text-left"
      >
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

/** The header row: <THead><Th>…</Th></THead> */
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-sx-subtle text-sx-muted">
      <tr className="h-11 border-y border-sx-row">{children}</tr>
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
  return (
    <th
      scope="col"
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
  return (
    <tr
      aria-selected={selected || undefined}
      className={`h-14 border-b border-sx-row ${selected ? "bg-sx-accent-soft" : "hover:bg-sx-subtle"}`}
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
  return (
    <th
      scope="row"
      className={`px-3 text-left font-medium first:pl-7 ${cellLook({ align, numeric, nowrap, truncate })}`}
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
  ...rest
}: CellProps<TdHTMLAttributes<HTMLTableCellElement>>) {
  return (
    <td
      className={`px-3 first:pl-7 last:pr-7 ${cellLook({ align, numeric, nowrap, truncate })}`}
      {...rest}
    >
      {children}
    </td>
  );
}
