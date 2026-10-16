import type { ReactNode } from "react";

// Fullwidth closing punctuation keeps its ink in the left half of its em box, so the underline of a
// link that ends with one (ノートPC（軽量）) runs past the visible text.
const closing = /[）」』】〕］｝〉》、。，．]$/u;

/**
 * The text of a link. When it ends with fullwidth closing punctuation, the blank right half of that
 * last character is clipped (and its width given back), so the underline stops at the ink.
 * The clip reaches 0.5em above and below because the underline is drawn outside the line box.
 */
export function LinkText({ children }: { children: ReactNode }) {
  if (
    typeof children !== "string" ||
    children.length < 2 ||
    !closing.test(children)
  ) {
    return <>{children}</>;
  }
  return (
    <>
      {children.slice(0, -1)}
      <span className="-mr-[0.5em] [clip-path:inset(-0.5em_50%_-0.5em_0)]">
        {children.slice(-1)}
      </span>
    </>
  );
}
