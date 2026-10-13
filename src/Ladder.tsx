// The ladder diagram of the logical (L3) view: a vertical line for each routing device (a rail), a
// horizontal band for each segment (a VLAN of the ledger), and a dot where a device has an address
// on a segment. Only drawing is here: the caller derives which device sits on which segment (the
// server does) and passes the result in a shape that does not depend on any screen. It is plain
// SVG, not React Flow: nothing is dragged, and the picture is computed from the data every time.
//
// The row height and the column spacing are fixed, so more bands make the picture taller and more
// rails make it wider (the frame scrolls sideways). The text sits in <foreignObject> so the
// browser wraps and clips it by the real glyph widths; colors come from the tokens by class.
// The SVG is hidden from assistive technology and an equivalent table (sr-only) carries the same
// content, so the picture is never the only way to read it.

import type { ReactNode } from "react";
import { DiagramFrame } from "./Diagram";

/** A vertical line: a device that routes (a CPE or an L3 switch). Drawn from left to right in the order given. */
export interface LadderRail {
  id: string;
  label: string;
  /** Under the label in the head box, e.g. the kind of device. */
  sublabel?: string;
}

/**
 * `normal` is an ordinary segment, `warn` one the caller wants noticed (drawn in the amber warning colour; give `note`
 * the reason), `l2only` a segment that carries no subnet (dashed, no fill).
 */
export type LadderTone = "normal" | "warn" | "l2only";

/** A dot on a rail inside a band. `text` is what the device has there, e.g. ".1 VIP .2 · DHCP". */
export interface LadderTap {
  railId: string;
  text: string;
}

/** A horizontal band: a segment. Drawn from top to bottom in the order given. */
export interface LadderBand {
  id: string;
  /** Right of the band, e.g. "VLAN 10 事務". */
  label: string;
  /** Under the label, e.g. "192.0.2.0/26 · SSID 名". */
  sublabel?: string;
  tone: LadderTone;
  /** A short line above the band, in red, e.g. "ゲートウェイの IP を持つ機器がない". */
  note?: string;
  taps: LadderTap[];
}

const g = {
  pad: 12,
  /** The distance between two rails. A tap's text must fit in the space after its dot. */
  railGap: 176,
  headWidth: 132,
  headHeight: 44,
  headRadius: 6,
  /** The space between the head boxes and the first band. */
  bodyGap: 16,
  bandHeight: 52,
  bandGap: 10,
  /** The line above a band, reserved on every row when any band has a note. */
  noteHeight: 20,
  bandRadius: 8,
  dotRadius: 5,
  /** From a dot to the start of its text. */
  tapOffset: 11,
  /** The right column holds the band's label; its width. */
  labelWidth: 264,
  /** The oval above the first rail (the WAN). */
  topHeight: 36,
  topRx: 72,
  topLink: 22,
  railWidth: 2,
} as const;

const dash = "5 4";

/** HTML text in the SVG, centered vertically in the box and clipped to it. */
function Text({
  x,
  y,
  width,
  height,
  align = "start",
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  align?: "start" | "center";
  children: ReactNode;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div
        className={`flex h-full flex-col justify-center overflow-hidden ${align === "center" ? "items-center text-center" : ""}`}
      >
        {children}
      </div>
    </foreignObject>
  );
}

/**
 * The ladder diagram. `label` names the picture and the table that stands in for it. Taps whose
 * `railId` is not in `rails` are not drawn (the table still lists nothing for them). A rail is drawn
 * down to its last tap. `top` is a dashed oval above the first rail (the WAN, which this view does not
 * cover); `footer` is a list under the picture (static routes), titled by `footerLabel`.
 */
export function LadderDiagram({
  label,
  rails,
  bands,
  top,
  footer,
  footerLabel,
}: {
  label: string;
  rails: LadderRail[];
  bands: LadderBand[];
  top?: { label: string };
  footer?: string[];
  footerLabel?: string;
}) {
  const railIndex = new Map(rails.map((r, i) => [r.id, i]));
  const railX = (i: number) => g.pad + g.headWidth / 2 + i * g.railGap;
  const labelX =
    rails.length > 0 ? railX(rails.length - 1) + g.railGap : g.pad + 16;
  const width = labelX + g.labelWidth + g.pad;

  const headTop = g.pad + (top ? g.topHeight + g.topLink : 0);
  const bodyTop = headTop + (rails.length > 0 ? g.headHeight + g.bodyGap : 0);
  const noteRow = bands.some((b) => b.note) ? g.noteHeight : 0;
  const stride = noteRow + g.bandHeight + g.bandGap;
  const bandTop = (i: number) => bodyTop + i * stride + noteRow;
  const bandMid = (i: number) => bandTop(i) + g.bandHeight / 2;
  const height =
    bodyTop + Math.max(bands.length * stride - g.bandGap, 0) + g.pad;

  // The last band a rail has a tap in: the rail runs down to there.
  const lastBand = new Map<string, number>();
  bands.forEach((b, i) => {
    for (const t of b.taps)
      if (railIndex.has(t.railId)) lastBand.set(t.railId, i);
  });

  const tapWidth = g.railGap - g.tapOffset - 14;

  return (
    <DiagramFrame fit>
      <div
        role="region"
        aria-label={`${label}（横にスクロールできます）`}
        tabIndex={0}
        className="overflow-x-auto"
      >
        <svg
          role="img"
          aria-label={`${label}。内容は同じ情報の表で読めます。`}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block max-w-none"
        >
          {bands.map((b, i) => {
            const fill =
              b.tone === "warn"
                ? "fill-sx-warn-bg stroke-sx-warn-dot"
                : b.tone === "l2only"
                  ? "fill-transparent stroke-sx-control"
                  : "fill-sx-fill stroke-transparent";
            return (
              <rect
                key={b.id}
                data-band={b.tone}
                x={g.pad}
                y={bandTop(i)}
                width={width - g.pad * 2}
                height={g.bandHeight}
                rx={g.bandRadius}
                strokeDasharray={b.tone === "l2only" ? dash : undefined}
                className={`${fill} stroke-1`}
              />
            );
          })}

          {top && rails.length > 0 && (
            <g>
              <line
                x1={railX(0)}
                x2={railX(0)}
                y1={g.pad + g.topHeight}
                y2={headTop}
                strokeDasharray={dash}
                className="stroke-sx-control stroke-2"
              />
              <ellipse
                cx={railX(0)}
                cy={g.pad + g.topHeight / 2}
                rx={g.topRx}
                ry={g.topHeight / 2}
                strokeDasharray={dash}
                className="fill-sx-surface stroke-sx-control stroke-1"
              />
              <Text
                x={railX(0) - g.topRx + 8}
                y={g.pad}
                width={g.topRx * 2 - 16}
                height={g.topHeight}
                align="center"
              >
                <span className="line-clamp-1 text-sx-ladder-label font-medium text-sx-muted">
                  {top.label}
                </span>
              </Text>
            </g>
          )}

          {rails.map((r, i) => {
            const last = lastBand.get(r.id);
            return (
              <g key={r.id}>
                {last !== undefined && (
                  <line
                    x1={railX(i)}
                    x2={railX(i)}
                    y1={headTop + g.headHeight}
                    y2={bandMid(last)}
                    className="stroke-sx-body stroke-2"
                  />
                )}
                <rect
                  x={railX(i) - g.headWidth / 2}
                  y={headTop}
                  width={g.headWidth}
                  height={g.headHeight}
                  rx={g.headRadius}
                  className="fill-sx-surface stroke-sx-control stroke-1"
                />
                <Text
                  x={railX(i) - g.headWidth / 2 + 6}
                  y={headTop}
                  width={g.headWidth - 12}
                  height={g.headHeight}
                  align="center"
                >
                  <span
                    title={r.label}
                    className="line-clamp-1 text-sx-ladder-label font-bold text-sx-strong"
                  >
                    {r.label}
                  </span>
                  {r.sublabel && (
                    <span
                      title={r.sublabel}
                      className="line-clamp-1 text-sx-ladder-text text-sx-muted"
                    >
                      {r.sublabel}
                    </span>
                  )}
                </Text>
              </g>
            );
          })}

          {bands.map((b, i) => (
            <g key={b.id}>
              {b.taps.map((t, k) => {
                const at = railIndex.get(t.railId);
                if (at === undefined) return null;
                return (
                  <g key={`${t.railId}-${k}`}>
                    <circle
                      cx={railX(at)}
                      cy={bandMid(i)}
                      r={g.dotRadius}
                      className="fill-sx-accent stroke-sx-surface stroke-2"
                    />
                    <Text
                      x={railX(at) + g.tapOffset}
                      y={bandTop(i)}
                      width={tapWidth}
                      height={g.bandHeight}
                    >
                      <span
                        title={t.text}
                        className="line-clamp-2 text-sx-ladder-text leading-tight text-sx-strong [overflow-wrap:anywhere]"
                      >
                        {t.text}
                      </span>
                    </Text>
                  </g>
                );
              })}
              <Text
                x={labelX}
                y={bandTop(i)}
                width={g.labelWidth}
                height={g.bandHeight}
              >
                <span
                  title={b.label}
                  className={`line-clamp-1 text-sx-ladder-label font-bold ${b.tone === "l2only" ? "text-sx-muted" : "text-sx-strong"}`}
                >
                  {b.label}
                </span>
                {b.sublabel && (
                  <span
                    title={b.sublabel}
                    className="line-clamp-1 text-sx-ladder-text text-sx-muted"
                  >
                    {b.sublabel}
                  </span>
                )}
              </Text>
              {b.note && (
                <Text
                  x={labelX}
                  y={bandTop(i) - g.noteHeight}
                  width={g.labelWidth}
                  height={g.noteHeight}
                >
                  <span
                    title={b.note}
                    className="line-clamp-1 text-sx-ladder-text font-medium text-sx-warn-ink"
                  >
                    {b.note}
                  </span>
                </Text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {footer && footer.length > 0 && (
        <div className="border-t border-sx-line px-4 py-3">
          {footerLabel && (
            <p className="mb-1 text-sx-meta font-bold text-sx-strong">
              {footerLabel}
            </p>
          )}
          <ul className="flex flex-col gap-0.5 text-sx-meta text-sx-body">
            {footer.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">セグメント</th>
            {rails.map((r) => (
              <th key={r.id} scope="col">
                {r.sublabel ? `${r.label}（${r.sublabel}）` : r.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bands.map((b) => (
            <tr key={b.id}>
              <th scope="row">
                {[b.label, b.sublabel, b.note].filter(Boolean).join("、")}
                {b.tone === "l2only" ? "（サブネットなし）" : ""}
              </th>
              {rails.map((r) => (
                <td key={r.id}>
                  {b.taps
                    .filter((t) => t.railId === r.id)
                    .map((t) => t.text)
                    .join("、")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </DiagramFrame>
  );
}
