import { focusRing } from "./focus";

/**
 * A block of preformatted text (a generated Config, a JSON document). The frame is a named region
 * that takes focus (tabIndex=0) so the keyboard can scroll it sideways; the text is a <pre> and is
 * never wrapped.
 */
export function CodeBlock({
  label,
  children,
}: {
  /** The name of the region, read out when it takes focus. */
  label: string;
  children: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`overflow-x-auto rounded-sx-control border border-sx-line bg-sx-subtle ${focusRing}`}
    >
      <pre className="w-max min-w-full px-4 py-3 font-sx-mono text-sx-meta leading-normal text-sx-strong">
        {children}
      </pre>
    </div>
  );
}
