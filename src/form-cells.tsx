// Cell components for the tables of the device-settings forms. Each form passes column definitions
// to DenseTable and writes the rows and sections by hand. These components only draw: they never
// judge a value. The error text comes from the caller (the server's validation), so the rule
// lives in one place.

import { createContext, useContext, useId, type ReactNode } from "react";
import { Button } from "./Button";
import { CheckboxInput } from "./Field";
import { focusRing, focusRingInput } from "./focus";
import { Icon } from "./icons";

export interface DenseColumn {
  id: string;
  header: ReactNode;
  width?: number;
  align?: "center" | "left";
  srOnly?: boolean;
}

// The first column (the header cell and each row's first cell) stays at the left edge while the
// table scrolls sideways. A fixed cell needs a background of its own: the header is subtle, a
// row is surface, and a `subtle` DenseRow keeps its tint.
const stickyFirst =
  "[&_tr>:first-child]:sticky [&_tr>:first-child]:left-0 [&_tr>:first-child]:z-1 [&_thead_tr>:first-child]:bg-sx-subtle [&_tbody_tr>:first-child]:bg-sx-surface [&_tbody_tr[data-subtle]>:first-child]:bg-sx-subtle";

// What a row needs to know about its table: how many columns a full-width row spans, and whether
// the table is `fit` (content-width, left-aligned).
const DenseTableContext = createContext({ columnCount: 1, fit: false });

/**
 * A dense table (rows 40px high, scrolls sideways). Write the rows as <tr>s in the children. The
 * scroll frame is a region with tabIndex=0 so the keyboard can scroll it.
 * By default the table fills the width and the cells are centered. With `fit` the table stops at
 * the width of its content, sits at the left, and the headers and cells are left-aligned (the
 * columns follow the inputs, whose width comes from their `kind`). `stickyFirstColumn` fixes the
 * first column at the left edge while scrolling (for a wide table whose first column names the
 * row).
 */
export function DenseTable({
  label,
  columns,
  children,
  minWidth,
  empty,
  stickyFirstColumn = false,
  fit = false,
}: {
  label: string;
  columns: DenseColumn[];
  children: ReactNode;
  minWidth?: number;
  empty?: ReactNode;
  stickyFirstColumn?: boolean;
  fit?: boolean;
}) {
  return (
    <DenseTableContext.Provider value={{ columnCount: columns.length, fit }}>
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        className={`relative overflow-x-auto rounded-sx-control border border-sx-line ${fit ? "w-fit max-w-full" : ""} ${stickyFirstColumn ? stickyFirst : ""} ${focusRing}`}
      >
        <table
          style={{ minWidth }}
          className={`border-collapse text-sx-meta ${fit ? "w-auto text-left" : "w-full text-center"}`}
        >
          <caption className="sr-only">{label}</caption>
          <colgroup>
            {columns.map((c) => (
              <col
                key={c.id}
                style={c.width ? { width: c.width } : undefined}
              />
            ))}
          </colgroup>
          <thead className="bg-sx-subtle text-sx-muted">
            <tr className="h-10 border-b border-sx-row">
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`px-2 font-normal whitespace-nowrap ${fit || c.align === "left" ? "text-left" : ""}`}
                >
                  {c.srOnly ? (
                    <span className="sr-only">{c.header}</span>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:has(+[data-row-messages])]:border-b-0">
            {children}
            {empty && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-sx-base text-sx-muted"
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DenseTableContext.Provider>
  );
}

/** One row of a DenseTable. The cells are <DenseCell>; the row header is <DenseRowHead>. */
export function DenseRow({
  children,
  subtle = false,
}: {
  children: ReactNode;
  /** A tinted row, to mark rows that belong together. */
  subtle?: boolean;
}) {
  return (
    <tr
      data-subtle={subtle || undefined}
      className={`h-10 border-b border-sx-row last:border-b-0 ${subtle ? "bg-sx-subtle" : ""}`}
    >
      {children}
    </tr>
  );
}

/** One finding on a row: the name of the field it is about, and the message (the server's). */
export type RowMessage = string | { field: string; message: string };

/**
 * The findings of the row above, in a row of their own under it: one line each, across the whole
 * table width, wrapping there (a long message never widens a column). A message with a `field` is
 * written "name：message" so the reader can tell which input it is about; the same text is shown
 * once. Pair it with `invalid` on the inputs (red frame only). Put it right after the DenseRow it
 * belongs to; that row's bottom rule is dropped so the two read as one. Nothing is drawn for an
 * empty list. `subtle` must match the DenseRow above. `id` is for the inputs' `describedBy`.
 */
export function DenseRowMessages({
  messages,
  subtle = false,
  id,
}: {
  messages: RowMessage[];
  subtle?: boolean;
  id?: string;
}) {
  const { columnCount } = useContext(DenseTableContext);
  const lines = [
    ...new Set(
      messages.map((m) =>
        typeof m === "string" ? m : `${m.field}：${m.message}`,
      ),
    ),
  ];
  if (lines.length === 0) return null;
  return (
    <tr
      data-row-messages
      data-subtle={subtle || undefined}
      className={`border-b border-sx-row last:border-b-0 ${subtle ? "bg-sx-subtle" : ""}`}
    >
      <td colSpan={columnCount} className="px-2 pt-0 pb-2 text-left">
        {/* w-0 + min-w-full: the cell takes the width of the table, and does not widen it. */}
        <ul id={id} className="m-0 flex w-0 min-w-full flex-col gap-0.5">
          {lines.map((line) => (
            <li
              key={line}
              className="flex items-start gap-1 text-sx-meta font-medium text-sx-error-ink"
            >
              <span className="flex h-5 shrink-0 items-center">
                <Icon name="circle-alert" size={14} />
              </span>
              {line}
            </li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

export function DenseRowHead({
  children,
  rowSpan,
}: {
  children: ReactNode;
  rowSpan?: number;
}) {
  const { fit } = useContext(DenseTableContext);
  return (
    <th
      scope="row"
      rowSpan={rowSpan}
      className={`px-2 text-sx-meta font-medium whitespace-nowrap text-sx-strong ${fit ? "text-left" : ""}`}
    >
      {children}
    </th>
  );
}
export function DenseCell({
  children,
  rowSpan,
  colSpan,
  align,
  nowrap = false,
  tone = "default",
  divided = false,
}: {
  children?: ReactNode;
  rowSpan?: number;
  colSpan?: number;
  align?: "left";
  nowrap?: boolean;
  /** body is the secondary text color, strong the primary one. */
  tone?: "default" | "body" | "strong";
  /** Vertical rules on both sides, for a cell that spans a pair of rows. */
  divided?: boolean;
}) {
  const toneClass = {
    default: "",
    body: "text-sx-body",
    strong: "text-sx-strong",
  }[tone];
  return (
    <td
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={`px-1.5 py-1 align-middle ${align === "left" ? "text-left" : ""} ${nowrap ? "whitespace-nowrap" : ""} ${toneClass} ${divided ? "border-x border-sx-row" : ""}`}
    >
      {children ?? <span className="text-sx-muted">—</span>}
    </td>
  );
}

/** What the value is, which decides the width of the input (and the numeric keyboard). */
export type CellKind =
  "text" | "ip" | "interface" | "network" | "vlan" | "vrid";

// The one table of how much each kind of value holds: `chars` is how many characters the input is
// wide enough to show (the width is that many characters plus the padding, the thick border of
// an invalid input and a little room), `max` is the most it accepts (maxLength). Every form takes both from here.
// `text` shows 20 characters (a name) and accepts up to 500.
const cellKinds: Record<CellKind, { chars: number; max: number }> = {
  text: { chars: 20, max: 500 },
  ip: { chars: 15, max: 15 },
  interface: { chars: 18, max: 18 },
  network: { chars: 18, max: 18 },
  vlan: { chars: 4, max: 4 },
  vrid: { chars: 3, max: 3 },
};

const cellControl =
  "h-9 rounded-sx-tile border border-sx-control bg-sx-surface px-2 text-sx-meta text-sx-strong tabular-nums disabled:cursor-not-allowed disabled:bg-sx-fill disabled:text-sx-muted aria-invalid:border-2 aria-invalid:border-sx-error-dot";

/**
 * An input in a table cell. Its width is set by `kind` (see the table above); maxLength defaults
 * to what the kind accepts (`null` means no limit, for a password). `invalid` draws the red frame
 * only (aria-invalid): write the message with DenseRowMessages under the row, and pass that
 * list's `id` as `describedBy`. `error` (deprecated: it will go once every form has moved to
 * `invalid` and DenseRowMessages) also shows the message under the input, which widens the
 * column to the length of the message. Either way the message is the server's; the cell does
 * not check the value itself.
 */
export function CellInput({
  label,
  value,
  onChange,
  kind = "text",
  disabled = false,
  invalid = false,
  describedBy,
  error = null,
  maxLength,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  kind?: CellKind;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** @deprecated Use `invalid` and DenseRowMessages. */
  error?: string | null;
  maxLength?: number | null;
  type?: "text" | "password";
  autoComplete?: string;
}) {
  const id = useId();
  const numeric = kind === "vlan" || kind === "vrid";
  const { chars, max } = cellKinds[kind];
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <input
        data-boundary
        aria-label={label}
        value={value}
        type={type}
        autoComplete={autoComplete}
        disabled={disabled}
        maxLength={maxLength === null ? undefined : (maxLength ?? max)}
        inputMode={numeric ? "numeric" : undefined}
        aria-invalid={invalid || error ? true : undefined}
        aria-describedby={error ? id : describedBy}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: `calc(${chars}ch + 1.5rem)` }}
        className={`${cellControl} ${focusRingInput}`}
      />
      {error && (
        <span
          id={id}
          className="flex items-center gap-1 text-sx-meta font-medium whitespace-nowrap text-sx-error-ink"
        >
          <Icon name="circle-alert" size={14} />
          {error}
        </span>
      )}
    </span>
  );
}

/**
 * A select in a table cell. With allowEmpty the first option is "未指定". Its width follows the
 * longest option. `invalid` draws the red frame only (aria-invalid), as on CellInput.
 */
export function Pick<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
  invalid = false,
  describedBy,
  allowEmpty = true,
  emptyValue = "" as T,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  allowEmpty?: boolean;
  emptyValue?: T;
}) {
  return (
    <select
      data-boundary
      aria-label={label}
      value={value}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(e) => onChange(e.target.value as T)}
      className={`${cellControl} pr-6 ${focusRingInput}`}
    >
      {allowEmpty && <option value={emptyValue}>未指定</option>}
      {options.map(([v, t]) => (
        <option key={v} value={v}>
          {t}
        </option>
      ))}
    </select>
  );
}

/** The small checkbox inside a table. It has no visible label, so `label` (the aria-label) is required. */
export function Check({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <CheckboxInput
      size="sm"
      aria-label={label}
      checked={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

/**
 * A section heading with an "add" button on the right ("…を追加（n / 上限）"). At the limit the
 * button is disabled. `id` goes on the heading, for a section's aria-labelledby.
 */
export function SectionHeader({
  title,
  id,
  add,
  children,
  level = 3,
}: {
  title: ReactNode;
  id?: string;
  add?: {
    label: string;
    count: number;
    max?: number;
    onClick: () => void;
    disabled?: boolean;
  };
  children?: ReactNode;
  level?: 2 | 3 | 4;
}) {
  const H = `h${level}` as "h2" | "h3" | "h4";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <H id={id} className="text-sx-lead font-medium">
        {title}
      </H>
      {children}
      {add && (
        <Button
          size="sm"
          icon="plus"
          className="ml-auto"
          onClick={add.onClick}
          disabled={
            add.disabled || (add.max !== undefined && add.count >= add.max)
          }
        >
          {add.max !== undefined
            ? `${add.label}（${add.count} / ${add.max}）`
            : add.label}
        </Button>
      )}
    </div>
  );
}
