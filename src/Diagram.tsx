// The look of the physical diagram: the frame, the device boxes, the port cells and the mark for a
// wire that cannot be routed. These only draw. Where the ports go (the upper row, the lower row,
// the column at the right end) depends on the direction of each wire, so the caller decides it and
// passes the ports in; the wires and handles are React Flow's, and this package does not import
// it (a `Handle` goes in as the children of a DiagramPort). The colors of the wires, the grid and
// the handles are set in diagram.css.

import type { CSSProperties, ReactNode } from "react";

/**
 * The sizes of the boxes in px, in one place. The routing and the "how big is a device before it
 * has been measured" estimate depend on them, so they are not Tailwind classes scattered in the
 * markup: the components below read them, and diagram.css gets the handle's numbers through custom
 * properties set on the frame.
 */
export const diagramGeometry = {
  /** The gap between the name block, the port rows and the right column. */
  deviceGap: 10,
  deviceMinHeight: 72,
  deviceRadius: 5,
  /** The width of the name block at the left of a box. */
  titleWidth: 128,
  titlePaddingX: 10,
  titlePaddingY: 12,
  /** The space under the device name. */
  titleNameGap: 4,
  portSize: 22,
  /** The gap between two ports in a row, and between two ports in the right column. */
  portGap: 4,
  portRadius: 3,
  /** The gap between the upper row and the lower row. */
  rowGap: 10,
  /** The space after the port rows, before the right column. */
  rowsMarginEnd: 8,
  /** The padding before the right column, and the width of its left border (for the size estimate). */
  columnPaddingStart: 8,
  columnBorder: 1,
  handleSize: 9,
  handleBorder: 1.5,
  /** How far a handle sticks out of its port cell's edge. */
  handleOffset: -5,
  /** The outline of a selected device. */
  selectedOutline: 2,
  selectedOutlineOffset: 2,
  /** The height of the frame. */
  frameHeight: "clamp(30rem, 65vh, 52rem)",
} as const;

const g = diagramGeometry;

/** The frame of a diagram. React Flow (or the sample devices) goes in as `children`. */
export function DiagramFrame({
  children,
  describedBy,
  fit = false,
}: {
  children: ReactNode;
  /** The id of the help text for the diagram (how to connect and select). */
  describedBy?: string;
  /** The frame is as tall as its content, not the fixed height React Flow needs (LadderDiagram). */
  fit?: boolean;
}) {
  const vars = {
    height: fit ? undefined : g.frameHeight,
    "--diagram-handle-size": `${g.handleSize}px`,
    "--diagram-handle-border": `${g.handleBorder}px`,
    "--diagram-handle-offset": `${g.handleOffset}px`,
  } as CSSProperties;
  return (
    <div
      data-diagram
      aria-describedby={describedBy}
      style={vars}
      className="relative overflow-hidden rounded-sx-control border border-sx-line bg-sx-subtle"
    >
      {children}
    </div>
  );
}

/**
 * A device box: the name and model at the left, then the upper and lower port rows, then the
 * right column. Pass each row's ports as `DiagramPort`s with keys. `columns` is how many port
 * columns the rows reserve (a row of fewer ports keeps the box's width); it defaults to the
 * longer of the two rows.
 */
export function DiagramDevice({
  name,
  model,
  selected = false,
  upper = [],
  lower = [],
  column = [],
  columns = Math.max(upper.length, lower.length),
}: {
  name: string;
  model: string;
  selected?: boolean;
  upper?: ReactNode[];
  lower?: ReactNode[];
  column?: ReactNode[];
  columns?: number;
}) {
  const hasUpper = upper.length > 0;
  const hasLower = lower.length > 0;
  return (
    <div
      style={{
        minHeight: g.deviceMinHeight,
        gap: g.deviceGap,
        borderRadius: g.deviceRadius,
        outlineWidth: selected ? g.selectedOutline : undefined,
        outlineOffset: selected ? g.selectedOutlineOffset : undefined,
      }}
      className={`flex w-max items-stretch border border-sx-control bg-sx-surface shadow-sx-raised ${selected ? "outline-solid outline-sx-accent" : ""}`}
    >
      <div
        style={{
          width: g.titleWidth,
          padding: `${g.titlePaddingY}px ${g.titlePaddingX}px`,
          borderRadius: `${g.deviceRadius}px 0 0 ${g.deviceRadius}px`,
        }}
        className="flex shrink-0 flex-col justify-center border-r border-sx-line bg-sx-subtle"
      >
        <strong
          style={{ marginBottom: g.titleNameGap, lineHeight: 1.4 }}
          className="[overflow-wrap:anywhere] text-sx-diagram-name font-bold"
        >
          {name}
        </strong>
        <small className="[overflow-wrap:anywhere] text-sx-diagram-model text-sx-muted">
          {model}
        </small>
      </div>
      <div
        style={{
          gap: g.rowGap,
          marginRight: g.rowsMarginEnd,
          minWidth: columns * g.portSize + Math.max(columns - 1, 0) * g.portGap,
        }}
        className={`flex flex-col ${hasUpper && hasLower ? "justify-between" : hasUpper ? "justify-start" : "justify-end"}`}
      >
        {hasUpper && (
          <div style={{ gap: g.portGap }} className="flex">
            {upper}
          </div>
        )}
        {hasLower && (
          <div style={{ gap: g.portGap }} className="flex">
            {lower}
          </div>
        )}
      </div>
      {column.length > 0 && (
        <div
          style={{ gap: g.portGap, paddingLeft: g.columnPaddingStart }}
          className="flex flex-col border-l border-sx-line"
        >
          {column}
        </div>
      )}
    </div>
  );
}

/**
 * A port cell: the short port number, filled when it is used, dashed when the port is optical.
 * Put the React Flow `Handle` in as `children`. `title` is the tooltip (the full name and medium).
 */
export function DiagramPort({
  label,
  used = false,
  fiber = false,
  title,
  children,
}: {
  label: string;
  used?: boolean;
  fiber?: boolean;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div
      title={title}
      data-used={used || undefined}
      style={{
        width: g.portSize,
        height: g.portSize,
        borderRadius: g.portRadius,
        lineHeight: `${g.portSize - 2}px`,
      }}
      className={`relative border text-center text-sx-diagram-port whitespace-nowrap ${used ? "border-sx-accent bg-sx-accent-soft text-sx-accent-ink" : "border-sx-control bg-sx-surface"} ${fiber ? "border-dashed" : "border-solid"}`}
    >
      <span>{label}</span>
      {children}
    </div>
  );
}

/**
 * What an SVG layer shows where a wire could not be routed: a dot on the port it starts from and
 * the reason beside it. (x, y) is that port's position in the diagram. Draw it inside an <svg>.
 */
export function DiagramRouteError({
  x,
  y,
  message,
}: {
  x: number;
  y: number;
  message: string;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={6} className="fill-sx-error-dot" />
      <text
        x={x + 12}
        y={y - 12}
        className="fill-sx-error-ink text-sx-diagram-note"
      >
        {message}
      </text>
    </g>
  );
}
