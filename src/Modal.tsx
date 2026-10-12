import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "./Button";

/**
 * A modal on a native <dialog> opened with showModal(), so the page behind it is inert and
 * Esc and the focus trap come from the browser. It follows the create-modal behavior in
 * docs/dads-implementation.md: on open the heading takes focus, on close the element that opened
 * it does. Esc and "閉じる" only call onClose, which closes the window; they never send anything,
 * and while `busy` they do nothing. Render it where it is used (inside the Shell), not in a portal:
 * the Shell root carries the font and the scoped reset.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
  busy = false,
  size = "md",
  description,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Buttons along the bottom edge, right-aligned. */
  footer?: ReactNode;
  busy?: boolean;
  /** md is 640px wide (forms), sm is 520px (confirmations). */
  size?: "sm" | "md";
  description?: ReactNode;
}) {
  const titleId = useId();
  const descId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    const el = dialog.current!;
    el.showModal();
    heading.current?.focus();
    return () => {
      el.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      aria-busy={busy || undefined}
      onCancel={(e) => {
        // Handle Esc ourselves so the dialog is never closed behind the caller's back.
        e.preventDefault();
        if (!busy) onClose();
      }}
      className={`${size === "sm" ? "w-130" : "w-160"} flex-col overflow-hidden rounded-sx-card border border-sx-line bg-sx-surface text-sx-strong shadow-sx-overlay backdrop:bg-sx-scrim open:flex`}
    >
      <div className="flex items-start gap-4 px-7 pt-6 pb-3">
        <h2
          ref={heading}
          id={titleId}
          tabIndex={-1}
          className="flex-1 text-sx-heading leading-snug font-medium outline-none"
        >
          {title}
        </h2>
        <IconButton label="閉じる" icon="x" onClick={onClose} disabled={busy} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-7 pb-6">
        {description && (
          <div id={descId} className="text-sx-body">
            {description}
          </div>
        )}
        {children}
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-sx-row bg-sx-subtle px-7 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}
