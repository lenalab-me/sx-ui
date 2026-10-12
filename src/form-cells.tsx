// Cell components for the tables of the device-settings forms. Each form passes column definitions
// to DenseTable and writes the rows and sections by hand. These components only draw: they never
// judge a value. The error text comes from the caller (the server's validation), so the rule
// lives in one place.

import { useId, type ReactNode } from "react";
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

/**
 * A dense table (rows 40px high, centered, scrolls sideways). Write the rows as <tr>s in the
 * children. The scroll frame is a region with tabIndex=0 so the keyboard can scroll it.
 */
export function DenseTable({
  label,
  columns,
  children,
  minWidth,
  empty,
}: {
  label: string;
  columns: DenseColumn[];
  children: ReactNode;
  minWidth?: number;
  empty?: ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`relative overflow-x-auto rounded-sx-control border border-sx-line ${focusRing}`}
    >
      <table
        style={{ minWidth }}
        className="w-full border-collapse text-center text-sx-meta"
      >
        <caption className="sr-only">{label}</caption>
        <colgroup>
          {columns.map((c) => (
            <col key={c.id} style={c.width ? { width: c.width } : undefined} />
          ))}
        </colgroup>
        <thead className="bg-sx-subtle text-sx-muted">
          <tr className="h-10 border-b border-sx-row">
            {columns.map((c) => (
              <th
                key={c.id}
                scope="col"
                className={`px-2 font-normal whitespace-nowrap ${c.align === "left" ? "text-left" : ""}`}
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
        <tbody>
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
      className={`h-10 border-b border-sx-row last:border-b-0 ${subtle ? "bg-sx-subtle" : ""}`}
    >
      {children}
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
  return (
    <th
      scope="row"
      rowSpan={rowSpan}
      className="px-2 text-sx-meta font-medium whitespace-nowrap text-sx-strong"
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

const cellWidth: Record<CellKind, string> = {
  text: "w-50",
  ip: "w-34",
  interface: "w-41",
  network: "w-41",
  vlan: "w-18",
  vrid: "w-16",
};

const cellControl =
  "h-9 rounded-sx-tile border border-sx-control bg-sx-surface px-2 text-sx-meta text-sx-strong tabular-nums disabled:cursor-not-allowed disabled:bg-sx-fill disabled:text-sx-muted aria-invalid:border-2 aria-invalid:border-sx-error-dot";

/**
 * An input in a table cell. With `error` it is aria-invalid and shows the message under the input.
 * The message is the server's; the cell does not check the value itself.
 */
export function CellInput({
  label,
  value,
  onChange,
  kind = "text",
  disabled = false,
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
  error?: string | null;
  maxLength?: number;
  type?: "text" | "password";
  autoComplete?: string;
}) {
  const id = useId();
  const numeric = kind === "vlan" || kind === "vrid";
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <input
        data-boundary
        aria-label={label}
        value={value}
        type={type}
        autoComplete={autoComplete}
        disabled={disabled}
        maxLength={maxLength}
        inputMode={numeric ? "numeric" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? id : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${cellControl} ${cellWidth[kind]} ${focusRingInput}`}
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

/** A select in a table cell. With allowEmpty the first option is "未指定". */
export function Pick<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
  allowEmpty = true,
  emptyValue = "" as T,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyValue?: T;
}) {
  return (
    <select
      data-boundary
      aria-label={label}
      value={value}
      disabled={disabled}
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
