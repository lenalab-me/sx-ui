import { CircleCheck } from "lucide-react";

/** A one-line role=status. The element stays when the text is empty so text that arrives later is announced. */
export function StatusLine({ text }: { text: string | null }) {
  return (
    <p
      role="status"
      className={text ? "flex items-center gap-2 text-sx-ok-ink" : "sr-only"}
    >
      {text && (
        <CircleCheck size={18} aria-hidden="true" className="shrink-0" />
      )}
      {text}
    </p>
  );
}
