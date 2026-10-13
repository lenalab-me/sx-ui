import { CircleCheck } from "lucide-react";

/**
 * A one-line role=status. The element stays when the text is empty so text that arrives later is announced.
 * `ok` (default) is a result, in green with a check mark; `neutral` is a plain note such as "読み込み中…",
 * with no icon.
 */
export function StatusLine({
  text,
  tone = "ok",
}: {
  text: string | null;
  tone?: "ok" | "neutral";
}) {
  const ok = tone === "ok";
  return (
    <p
      role="status"
      className={
        text
          ? `flex items-center gap-2 ${ok ? "text-sx-ok-ink" : "text-sx-muted"}`
          : "sr-only"
      }
    >
      {text && ok && (
        <CircleCheck size={18} aria-hidden="true" className="shrink-0" />
      )}
      {text}
    </p>
  );
}
