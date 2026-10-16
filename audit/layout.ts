// The layout audit an app runs in its e2e on every route, in the page:
//   import { layoutAudit } from "@sx/ui/audit";
//   expect(await page.evaluate(layoutAudit), "はみ出し・重なり").toEqual([]);
// Baseline images only tell that a screen changed; a screen that was broken when its image was first
// taken passes them. This looks for the breakage itself, in the text that is painted:
// - text that leaves its table cell without an ellipsis (a long value in a nowrap cell of a fixed
//   table, which then runs under the next cell);
// - texts of two elements that overlap (neither contains the other).
// The text is cut by every ancestor that clips its overflow (a line clamp, a truncated cell), so what
// is hidden on purpose is not counted. A scrolling frame does not cut it for the texts in the same
// frame (what is below the fold is seen too), but does for a text outside it: text scrolled under a
// fixed header or footer is not on top of it. Text hidden from the screen (display none, visibility
// hidden, sr-only) is skipped. With a modal open, only the modal is seen, since it covers the page.
// An open popover (a menu, a floating box) is in the top layer: what is in it is not cut by the
// clipping around it, does not leave its cell (it is drawn over the table on purpose), and is not
// compared with the text under it, which it covers.
// The function is passed to page.evaluate, so it uses nothing outside itself.
export function layoutAudit(): string[] {
  const skipped = (el: Element): boolean => {
    for (let a: Element | null = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.display === "none" || cs.visibility === "hidden") return true;
      if (/^inset\(50%/.test(cs.clipPath)) return true;
      const r = a.getBoundingClientRect();
      if (cs.overflow !== "visible" && (r.width <= 1 || r.height <= 1))
        return true;
    }
    return false;
  };
  type Box = { left: number; top: number; right: number; bottom: number };
  const clips = (cs: CSSStyleDeclaration) =>
    /hidden|clip/.test(cs.overflowX) || /hidden|clip/.test(cs.overflowY);
  const scrolls = (cs: CSSStyleDeclaration) =>
    /auto|scroll/.test(cs.overflowX) || /auto|scroll/.test(cs.overflowY);
  const cut = (r: Box, c: Box): Box => ({
    left: Math.max(r.left, c.left),
    top: Math.max(r.top, c.top),
    right: Math.min(r.right, c.right),
    bottom: Math.min(r.bottom, c.bottom),
  });
  const empty = (r: Box) => r.right - r.left <= 0 || r.bottom - r.top <= 0;
  const texts: {
    el: Element;
    text: string;
    rects: Box[];
    painted: Box[];
    frame: Element | null;
    layer: Element | null;
  }[] = [];
  const root = document.querySelector("dialog[open]") ?? document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = (node.textContent ?? "").trim();
    const el = node.parentElement;
    if (!text || !el || skipped(el)) continue;
    // clip: what hides the text on purpose; view: also the scrolling frames (what is on the screen).
    let clip: Box = {
      left: -Infinity,
      top: -Infinity,
      right: Infinity,
      bottom: Infinity,
    };
    let view = clip;
    let frame: Element | null = null;
    const layer = el.closest(":popover-open");
    for (let a: Element | null = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      const b = a.getBoundingClientRect();
      if (clips(cs)) {
        clip = cut(clip, b);
        view = cut(view, b);
      } else if (scrolls(cs)) {
        frame ??= a;
        view = cut(view, b);
      }
      if (a === layer) break;
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    const all = [...range.getClientRects()];
    const rects = all.map((r) => cut(r, clip)).filter((r) => !empty(r));
    const painted = all.map((r) => cut(r, view)).filter((r) => !empty(r));
    if (rects.length > 0)
      texts.push({ el, text, rects, painted, frame, layer });
  }
  const short = (s: string) => (s.length > 24 ? `${s.slice(0, 24)}…` : s);
  const problems: string[] = [];
  for (const t of texts) {
    const cell = t.el.closest("td,th");
    if (!cell || (t.layer && cell.contains(t.layer))) continue;
    const c = cell.getBoundingClientRect();
    if (t.rects.some((r) => r.right > c.right + 1 || r.left < c.left - 1))
      problems.push(
        `セルからはみ出している：「${short(t.text)}」（${cell.tagName.toLowerCase()} の幅 ${Math.round(c.width)}px を越える。折り返すか、列の幅を取るか、truncate で省略する）`,
      );
  }
  const overlap = (a: Box, b: Box) =>
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i]!;
      const b = texts[j]!;
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (a.layer !== b.layer) continue;
      const [ra, rb] =
        a.frame === b.frame ? [a.rects, b.rects] : [a.painted, b.painted];
      if (ra.some((x) => rb.some((y) => overlap(x, y))))
        problems.push(
          `文字が重なっている：「${short(a.text)}」と「${short(b.text)}」`,
        );
    }
  return [...new Set(problems)];
}
