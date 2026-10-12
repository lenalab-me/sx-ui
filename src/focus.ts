/** Focus ring: a 4px black outline plus a yellow ring (tokens sx-focus-outline and sx-focus). */
export const focusRing =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-sx-focus-outline focus-visible:outline-offset-[calc(2/16*1rem)] focus-visible:ring-[calc(2/16*1rem)] focus-visible:ring-sx-focus";

/** For controls that hold text inside their border: the border color changes too, not only the outline. */
export const focusRingInput = `${focusRing} focus-visible:border-sx-strong`;
