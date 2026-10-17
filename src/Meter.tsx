export type MeterTone = "accent" | "ok" | "warn" | "error";

const fill: Record<MeterTone, string> = {
  accent: "bg-sx-accent",
  ok: "bg-sx-ok-dot",
  warn: "bg-sx-warn-dot",
  error: "bg-sx-error-dot",
};

/**
 * A bar for an amount out of a whole (progress, a rate): the name at the left, the value in words
 * at the right, the bar under them. `value` null means there is nothing to measure yet (no answer
 * yet): the bar stays empty and `valueText` says why. The value is always written out, so the color
 * (`tone`) only adds to the words. The width is the one inline style (it is the value itself).
 */
export function Meter({
  label,
  value,
  max = 100,
  valueText,
  tone = "accent",
}: {
  label: string;
  value: number | null;
  max?: number;
  /** The value in words (for example "23 / 1054問"). Without it, the percentage. Required when value is null. */
  valueText?: string;
  tone?: MeterTone;
}) {
  const pct =
    value === null || max <= 0
      ? 0
      : Math.max(0, Math.min(100, (value / max) * 100));
  const text = valueText ?? `${Math.round(pct)}%`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sx-meta">
        <span className="min-w-0 text-sx-body">{label}</span>
        <span className="shrink-0 font-medium text-sx-strong tabular-nums">
          {text}
        </span>
      </div>
      {value === null ? (
        <div aria-hidden="true" className="h-2 rounded-full bg-sx-fill" />
      ) : (
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={text}
          className="h-2 overflow-hidden rounded-full bg-sx-fill"
        >
          <div
            className={`h-full rounded-full ${fill[tone]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
