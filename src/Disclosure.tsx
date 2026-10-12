import { ChevronRight } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { focusRing } from "./focus";

/**
 * A section that opens and closes through a button aria-expanded inside its heading.
 * Pass `open` to control it from outside (changes arrive through onOpenChange); without it the
 * component keeps its own state, starting from defaultOpen.
 * `highlighted` emphasizes the section with a thick border (for example the device picked in the
 * drawing); put the word "選択中" in `after` so the emphasis is not color alone.
 */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  open: controlled,
  onOpenChange,
  level = 3,
  after,
  highlighted = false,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  level?: 2 | 3 | 4;
  after?: ReactNode;
  highlighted?: boolean;
}) {
  const [own, setOwn] = useState(defaultOpen);
  const open = controlled ?? own;
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  const id = useId();
  const H = `h${level}` as "h2" | "h3" | "h4";
  return (
    <div
      className={`relative rounded-sx-control bg-sx-surface ${highlighted ? "border-2 border-sx-accent" : "border border-sx-line"}`}
    >
      <div className="flex items-center gap-3 pr-4">
        <H className="min-w-0 flex-1 text-sx-base font-medium">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen(!open)}
            className={`flex w-full items-center gap-2 rounded-sx-control px-4 py-3 text-left hover:bg-sx-subtle ${focusRing}`}
          >
            <ChevronRight
              size={18}
              aria-hidden="true"
              className={`shrink-0 text-sx-muted transition-transform ${open ? "rotate-90" : ""}`}
            />
            {title}
          </button>
        </H>
        {after}
      </div>
      <div id={id} hidden={!open} className="border-t border-sx-row px-4 py-4">
        {children}
      </div>
    </div>
  );
}
