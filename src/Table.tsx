import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";

// Whether the table stacks its rows below md (Table's `stack`), for the parts inside it.
const Stack = createContext(false);
// Whether the columns are packed from the left and can be resized (Table's `resizable`).
const Resizable = createContext(false);

// A column of a resizable table that the screen gives no width gets this one, and none is made
// narrower than the least.
const DEFAULT_COLUMN = "16rem";
const LEAST_COLUMN = 48;

// The space right of the last column of a resizable table: it takes what the columns leave, so the
// header band and a row's hover still reach the right edge. Nothing to read or to focus, and a td
// in the header row too (a th there would be a header with no name).
function Filler() {
  const stack = useContext(Stack);
  return (
    <td
      aria-hidden="true"
      role={stack ? "presentation" : undefined}
      className={`p-0 ${stack ? "max-md:hidden" : ""}`}
    />
  );
}

// The handle on the right edge of a header cell: dragging it sets that column's width (the <col>
// of the same index). For the mouse only: the table reads the same at any width.
function ResizeHandle() {
  const stack = useContext(Stack);
  function start(e: ReactPointerEvent<HTMLSpanElement>) {
    const handle = e.currentTarget;
    const th = handle.parentElement as HTMLTableCellElement;
    const col = th
      .closest("table")
      ?.querySelector(":scope > colgroup")
      ?.querySelectorAll("col")[th.cellIndex];
    if (!col) return;
    e.preventDefault();
    const from = e.clientX;
    const width = th.getBoundingClientRect().width;
    handle.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => {
      col.style.width = `${Math.max(LEAST_COLUMN, Math.round(width + m.clientX - from))}px`;
    };
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  }
  return (
    <span
      aria-hidden="true"
      data-resize-handle
      onPointerDown={start}
      className={`absolute inset-y-2 -right-1.5 z-10 w-3 cursor-col-resize touch-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-sx-line hover:after:w-0.5 hover:after:bg-sx-accent ${stack ? "max-md:hidden" : ""}`}
    />
  );
}

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

// A cell that neither stays on one line nor cuts its text wraps it, a word with no space in it too (a long
// term or name would run into the next column otherwise; the columns of a table-fixed table do not grow).
const cellLook = ({ align, numeric, nowrap, truncate }: CellLook) =>
  [
    numeric ? "text-right tabular-nums" : align ? alignClass[align] : "",
    nowrap ? "whitespace-nowrap" : "",
    truncate ? "truncate" : "",
    nowrap || truncate ? "" : "wrap-break-word",
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
 * `resizable` packs the columns from the left, as the Azure portal's lists do: every column keeps
 * its width (a `<col>` with none gets 16rem), the space right of them stays empty, and dragging the
 * right edge of a header cell makes that column wider or narrower. A table wider than its frame
 * scrolls sideways, as one with `minWidth` does.
 */
export function Table({
  caption,
  children,
  minWidth,
  stack = false,
  resizable = false,
}: {
  caption: string;
  children: ReactNode;
  minWidth?: number;
  stack?: boolean;
  resizable?: boolean;
}) {
  const table = useRef<HTMLTableElement>(null);
  // A column the screen gave no width would take what the others leave: it gets one of its own.
  useLayoutEffect(() => {
    if (!resizable || !table.current) return;
    for (const col of table.current.querySelectorAll(":scope > colgroup > col"))
      if (
        !(col as HTMLElement).style.width &&
        ![...col.classList].some((c) => /^w-/.test(c))
      )
        (col as HTMLElement).style.width = DEFAULT_COLUMN;
  }, [resizable]);
  return (
    <Stack.Provider value={stack}>
      <Resizable.Provider value={resizable}>
        <div className="relative overflow-x-auto">
          <table
            ref={table}
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
      </Resizable.Provider>
    </Stack.Provider>
  );
}

/** The header row: <THead><Th>…</Th></THead> */
export function THead({ children }: { children: ReactNode }) {
  const stack = useContext(Stack);
  const resizable = useContext(Resizable);
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
        {resizable && <Filler />}
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
  const resizable = useContext(Resizable);
  return (
    <th
      scope="col"
      role={stack ? "columnheader" : undefined}
      // A header of a resizable table stays on one line: a column too narrow for it shows as text
      // leaving its cell (the layout audit fails), not as a header broken in two.
      className={`px-3 font-normal first:pl-7 last:pr-7 ${resizable ? "relative" : ""} ${cellLook({ align, numeric, nowrap: nowrap || resizable, truncate })}`}
      {...rest}
    >
      {children}
      {resizable && <ResizeHandle />}
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
  const resizable = useContext(Resizable);
  return (
    <tr
      role={stack ? "row" : undefined}
      aria-selected={selected || undefined}
      className={`h-14 border-b border-sx-row ${selected ? "bg-sx-accent-soft" : "hover:bg-sx-subtle"} ${stack ? "group/row max-md:flex max-md:h-auto max-md:flex-col max-md:gap-1 max-md:px-4 max-md:py-3" : ""}`}
    >
      {children}
      {resizable && <Filler />}
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
      {stack && label && truncate ? (
        // A stacked cell is a flex row below md, and a flex row draws no ellipsis for its text:
        // the value gets a box of its own that can. Only beside a label: a cell that writes its own
        // caption among its children keeps them as they are.
        <span className="max-md:min-w-0 max-md:truncate">{children}</span>
      ) : (
        children
      )}
    </td>
  );
}
