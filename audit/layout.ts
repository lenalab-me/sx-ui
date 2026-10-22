// The layout audit an app runs in its e2e on every route, in the page:
//   import { layoutAudit } from "@sx/ui/audit";
//   expect(await page.evaluate(layoutAudit), "はみ出し・重なり").toEqual([]);
// Baseline images only tell that a screen changed; a screen that was broken when its image was first
// taken passes them. This looks for the breakage itself, in what is painted:
// - text that leaves its table cell without an ellipsis (a long value in a nowrap cell of a fixed
//   table, which then runs under the next cell);
// - text cut off by a box that hides its overflow, with neither an ellipsis nor a line clamp to show
//   that something is missing;
// - two texts, or a text and an icon, that overlap (neither contains the other);
// - a frame that scrolls up and down without saying so (overflow-y-auto, overflow-auto): a frame that
//   meant to scroll sideways (overflow-x-auto) and was squeezed lower than its content, which then
//   hangs out of it and is cut off at its edge;
// - a page wider than the window, and a frame that scrolls sideways but cannot be reached with the
//   keyboard (neither it nor anything in it takes the focus), so its hidden part cannot be read.
// The text is cut by every ancestor that clips its overflow (a line clamp, a truncated cell), so what
// is hidden on purpose is not counted. A scrolling frame does not cut it for the texts in the same
// frame (what is below the fold is seen too), but does for a text outside it: text scrolled under a
// fixed header or footer is not on top of it. Text hidden from the screen (display none, visibility
// hidden, sr-only) is skipped, and so is a diagram ([data-diagram]) for the icons, whose shapes sit
// on its lines by design. With a modal open, only the modal is seen, since it covers the page.
// An open popover (a menu, a floating box) is in the top layer: what is in it is not cut by the
// clipping around it, does not leave its cell (it is drawn over the table on purpose), and is not
// compared with what is under it, which it covers.
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
  type Item = {
    node: Node;
    el: Element;
    name: string;
    icon: boolean;
    rects: Box[];
    painted: Box[];
    frame: Element | null;
    layer: Element | null;
  };
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
  const area = (rs: Box[]) =>
    rs.reduce((s, r) => s + (r.right - r.left) * (r.bottom - r.top), 0);
  const short = (s: string) => (s.length > 24 ? `${s.slice(0, 24)}…` : s);
  const problems: string[] = [];

  // Where an element is painted: cut by what hides its overflow on purpose (clip: the clipping
  // ancestors inside its nearest scrolling frame), and also by everything that limits what is on the
  // screen (view: the scrolling frames and every clipping ancestor outside them, such as a rounded
  // shell around the scrolling main: what they hide is reached by scrolling, not lost); whether a
  // clipping ancestor shows that it cut something (an ellipsis or a line clamp on the way up to it).
  const place = (el: Element, rects: DOMRect[]) => {
    let clip: Box = {
      left: -Infinity,
      top: -Infinity,
      right: Infinity,
      bottom: Infinity,
    };
    let view = clip;
    let frame: Element | null = null;
    let marked = false;
    let clipped = false;
    const layer = el.closest(":popover-open");
    for (let a: Element | null = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.textOverflow === "ellipsis" || cs.webkitLineClamp !== "none")
        marked = true;
      if (clips(cs)) {
        const b = a.getBoundingClientRect();
        view = cut(view, b);
        if (!frame) {
          clip = cut(clip, b);
          clipped = true;
        }
      } else if (scrolls(cs)) {
        frame ??= a;
        view = cut(view, a.getBoundingClientRect());
      }
      if (a === layer) break;
    }
    return {
      rects: rects.map((r) => cut(r, clip)).filter((r) => !empty(r)),
      painted: rects.map((r) => cut(r, view)).filter((r) => !empty(r)),
      frame,
      layer,
      silent: clipped && !marked,
    };
  };

  const items: Item[] = [];
  const root = document.querySelector("dialog[open]") ?? document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = (node.textContent ?? "").trim();
    const el = node.parentElement;
    if (!text || !el || skipped(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const all = [...range.getClientRects()].filter(
      (r) => r.width > 0 && r.height > 0,
    );
    const p = place(el, all);
    if (p.rects.length === 0) continue;
    items.push({ node, el, name: `「${short(text)}」`, icon: false, ...p });
    // Cut off without a sign: more than a sliver of the text is hidden.
    if (p.silent && area(all) - area(p.rects) > 2 * all.length)
      problems.push(
        `文字が途中で切れている：「${short(text)}」（overflow で隠れている。truncate で省略記号を付けるか、枠を広げるか、折り返す）`,
      );
  }
  for (const svg of root.querySelectorAll("svg")) {
    const r = svg.getBoundingClientRect();
    if (r.width === 0 || r.width > 48 || r.height > 48) continue;
    if (svg.closest("[data-diagram]") || skipped(svg)) continue;
    const p = place(svg, [r]);
    if (p.rects.length > 0)
      items.push({ node: svg, el: svg, name: "アイコン", icon: true, ...p });
  }

  for (const t of items) {
    if (t.icon) continue;
    const cell = t.el.closest("td,th");
    if (!cell || (t.layer && cell.contains(t.layer))) continue;
    const c = cell.getBoundingClientRect();
    if (t.rects.some((r) => r.right > c.right + 1 || r.left < c.left - 1))
      problems.push(
        `セルからはみ出している：${t.name}（${cell.tagName.toLowerCase()} の幅 ${Math.round(c.width)}px を越える。折り返すか、列の幅を取るか、truncate で省略する）`,
      );
  }
  const overlap = (a: Box, b: Box) =>
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!;
      const b = items[j]!;
      if (a.icon && b.icon) continue;
      // Texts are compared node by node, so a label and the icon beside it in the same button are
      // compared too; only an icon is not compared with the text it holds itself.
      if (a.node === b.node) continue;
      if ((a.icon && a.el.contains(b.el)) || (b.icon && b.el.contains(a.el)))
        continue;
      if (a.layer !== b.layer) continue;
      const [ra, rb] =
        a.frame === b.frame ? [a.rects, b.rects] : [a.painted, b.painted];
      if (ra.some((x) => rb.some((y) => overlap(x, y))))
        problems.push(
          a.icon || b.icon
            ? `アイコンと文字が重なっている：${a.icon ? b.name : a.name}`
            : `文字が重なっている：${a.name}と${b.name}`,
        );
    }

  const page = document.documentElement;
  if (page.scrollWidth > window.innerWidth + 1)
    problems.push(
      `ページが横にはみ出している（幅 ${page.scrollWidth}px が画面の ${window.innerWidth}px を越える。広い表は横にスクロールする枠に入れる）`,
    );
  const focusable =
    "a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])";
  for (const el of root.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (!/auto|scroll/.test(cs.overflowX)) continue;
    if (el.scrollWidth <= el.clientWidth + 1 || skipped(el)) continue;
    const reachable =
      (el as HTMLElement).tabIndex >= 0 || el.querySelector(focusable) !== null;
    if (!reachable) {
      const label = el.getAttribute("aria-label") ?? el.tagName.toLowerCase();
      problems.push(
        `横にスクロールする枠にキーボードで入れない：${label}（tabindex="0" と名前を付けるか、はみ出さないようにする）`,
      );
    }
  }
  // The sideways frames (a tab list, a table) are overflow-x-auto, which makes them scroll up and
  // down too; one squeezed by a column that is taller than its box cuts its content at the edge. A
  // frame that scrolls up and down on purpose says so, and a field (textarea, select) scrolls itself.
  for (const el of root.querySelectorAll("*")) {
    if (/^(textarea|select|input)$/i.test(el.tagName)) continue;
    if (!/auto|scroll/.test(getComputedStyle(el).overflowY)) continue;
    if (el.scrollHeight <= el.clientHeight + 1 || skipped(el)) continue;
    const declared = /\boverflow-(y-)?(auto|scroll)\b/.test(
      el.getAttribute("class") ?? "",
    );
    if (declared) continue;
    const label = el.getAttribute("aria-label") ?? el.tagName.toLowerCase();
    problems.push(
      `枠が断りなく縦にスクロールする：${label}（高さ ${el.clientHeight}px に中身 ${el.scrollHeight}px が入りきらず、枠の下で切れている。縦に動かす枠は overflow-y-auto で断り、そうでなければ枠が縮まないようにする）`,
    );
  }
  return [...new Set(problems)];
}
