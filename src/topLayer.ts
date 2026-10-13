import { useLayoutEffect, type CSSProperties, type RefObject } from "react";

/**
 * Floating boxes (Menu, Popover) go to the browser's top layer with the popover attribute, so a
 * table's scroll frame or a modal's overflow cannot clip them and a menu opened inside a modal
 * stays in front of it. The box is placed with CSS anchor positioning: below the anchor, aligned to
 * its left or right edge, and above it when there is no room below (position-try-fallbacks).
 */

/** An anchor name (a CSS dashed ident) made from a useId() value. */
export const anchorNameOf = (id: string) =>
  `--anchor-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

/** Where the box sits against its anchor. The 4px gap is `mt-1` on the box (flipped with the fallback). */
export const anchoredStyle = (
  name: string,
  align: "start" | "end",
): CSSProperties =>
  ({
    positionAnchor: name,
    top: "anchor(bottom)",
    ...(align === "end"
      ? { right: "anchor(right)" }
      : { left: "anchor(left)" }),
    positionTryFallbacks: "flip-block",
  }) as CSSProperties;

/** Shows the element in the top layer while it is mounted (and `enabled`). Needs popover="manual" on it. */
export function useTopLayer(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    if (!el.matches(":popover-open")) el.showPopover();
    return () => {
      if (el.isConnected && el.matches(":popover-open")) el.hidePopover();
    };
  }, [ref, enabled]);
}
