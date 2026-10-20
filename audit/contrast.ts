import type { Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

// The contrast audit an app runs in its e2e on every route (with Playwright, in Node):
//   import { contrastAudit, describeContrastFail, describeSmallText } from "@sx/ui/audit";
//   const { fails, small } = await contrastAudit(page);
//   expect(fails.map(describeContrastFail), "基準（4.5:1・3:1）に届かない組").toEqual([]);
//   expect(small.map(describeSmallText), "14px 未満の文字").toEqual([]);
// WCAG 2.x AA, the Digital Agency's standard. It reads the foreground and background colors of what
// the browser actually rendered, so it sees the result of every class and token, not the source:
//   - text: 4.5:1, or 3:1 for large text (24px and up, or 18.66px and up when bold)
//   - non-text: 3:1 for icon-only controls and for the edge of every form control
//   - text under 14px is reported on its own (the Digital Agency's smallest size), except inside a
//     diagram ([data-diagram]), whose sizes feed the wiring calculation
//   - disabled controls are exempt (WCAG), and are left out of both lists
// Every input, select, textarea and role=checkbox counts as a control boundary whether or not it
// carries data-boundary, so an input without the mark cannot pass with a faint border;
// data-boundary is for the other things whose edge shows where to operate (the popover frame).
// While a modal dialog is open, only the dialog is audited: what is behind it is inert and dimmed
// by the scrim, and is audited on the page's own route.

const boundarySelector =
  "[data-boundary], input:not([type=hidden]), select, textarea, [role=checkbox]";

type Kind = "text" | "placeholder" | "icon" | "boundary";

interface Raw {
  kind: Kind;
  fg: string;
  bg: string;
  size: number;
  weight: number;
  text: string;
  tag: string;
  disabled: boolean;
  // Inside a diagram ([data-diagram]): the 14px rule does not apply there, because the diagram's
  // sizes feed the wiring calculation; the contrast ratios still do.
  diagram: boolean;
}

export interface ContrastRow {
  ratio: number;
  need: number;
  tier: string;
  fg: string;
  bg: string;
  fgToken: string;
  bgToken: string;
  size: number;
  weight: number;
  count: number;
  samples: string[];
  tags: string[];
}

export interface SmallText {
  size: number;
  count: number;
  samples: string[];
}

type RGB = [number, number, number];
const fromHex = (h: string): RGB =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const lin = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (c: RGB) =>
  0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
export const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Hex value -> the names of the color tokens with that value (for the failure message).
// The tokens are this package's own: read from here as source (audit/) or as the built file
// (dist/audit/).
function tokenNames(): Map<string, string[]> {
  const file = [
    new URL("../src/tokens.css", import.meta.url),
    new URL("../../src/tokens.css", import.meta.url),
  ].find((u) => existsSync(u));
  if (!file) throw new Error("@sx/ui の src/tokens.css が見つかりません");
  const css = readFileSync(file, "utf8");
  const byHex = new Map<string, string[]>();
  for (const m of css.matchAll(
    /^\s*--color-(sx-[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/gm,
  )) {
    const hex = m[2].toLowerCase();
    byHex.set(hex, [...(byHex.get(hex) ?? []), m[1]]);
  }
  return byHex;
}

async function collect(page: Page): Promise<Raw[]> {
  return page.evaluate((selector) => {
    type C = [number, number, number, number];
    const cv = document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true })!;
    const parse = (css: string): C => {
      const m = css.match(
        /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.%]+))?\s*\)/,
      );
      if (m) {
        const a =
          m[4] === undefined
            ? 1
            : m[4].endsWith("%")
              ? parseFloat(m[4]) / 100
              : parseFloat(m[4]);
        return [+m[1], +m[2], +m[3], a];
      }
      // Other color syntaxes (color(srgb ...), oklch ...) are resolved by painting one pixel.
      cv.clearRect(0, 0, 1, 1);
      cv.fillStyle = css;
      cv.fillRect(0, 0, 1, 1);
      const d = cv.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const over = (top: C, base: C): C => {
      const a = top[3] + base[3] * (1 - top[3]);
      if (a === 0) return [0, 0, 0, 0];
      return [0, 1, 2]
        .map((i) => (top[i] * top[3] + base[i] * base[3] * (1 - top[3])) / a)
        .concat(a) as C;
    };
    const hex = (c: C) =>
      "#" +
      c
        .slice(0, 3)
        .map((v) => Math.round(v).toString(16).padStart(2, "0"))
        .join("");

    // The background behind an element: the backgrounds of its ancestors, stacked from the bottom.
    const bgOf = (el: Element | null): C => {
      const layers: C[] = [];
      for (let e = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c[3] > 0) layers.push(c);
        if (c[3] >= 1) break;
      }
      let base: C = [255, 255, 255, 1];
      for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
      return base;
    };
    const opacityOf = (el: Element) => {
      let o = 1;
      for (let e: Element | null = el; e; e = e.parentElement)
        o *= parseFloat(getComputedStyle(e).opacity);
      return o;
    };
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return (
        r.width > 1 &&
        r.height > 1 &&
        cs.visibility !== "hidden" &&
        cs.display !== "none"
      );
    };
    const isDisabled = (el: Element) =>
      !!el.closest(
        'button:disabled, [aria-disabled="true"], input:disabled, select:disabled, textarea:disabled, fieldset:disabled',
      );
    const tagOf = (el: Element) =>
      el.tagName.toLowerCase() +
      (el.getAttribute("role") ? `[role=${el.getAttribute("role")}]` : "");
    // The text color with its opacity blended into the background.
    const fgOn = (css: string, el: Element, bg: C): C => {
      const c = parse(css);
      const a = c[3] * opacityOf(el);
      return [0, 1, 2].map((i) => c[i] * a + bg[i] * (1 - a)).concat(1) as C;
    };

    const modal = document.querySelector("dialog[open]");
    const scope: ParentNode = modal ?? document.body;
    const items: Raw[] = [];
    const push = (
      kind: Kind,
      fg: C,
      bg: C,
      el: Element,
      text: string,
      cs: CSSStyleDeclaration,
    ) =>
      items.push({
        kind,
        fg: hex(fg),
        bg: hex(bg),
        size: parseFloat(cs.fontSize),
        weight: parseInt(cs.fontWeight),
        text: text.replace(/\s+/g, " ").trim().slice(0, 40),
        tag: tagOf(el),
        disabled: isDisabled(el),
        diagram: el.closest("[data-diagram]") !== null,
      });

    // Text
    for (const el of scope.querySelectorAll("*")) {
      if (!visible(el)) continue;
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? "")
        .join("")
        .trim();
      const cs = getComputedStyle(el);
      if (own) {
        const bg = bgOf(el);
        push("text", fgOn(cs.color, el, bg), bg, el, own, cs);
      }
      if (
        (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
        el.placeholder &&
        !el.value
      ) {
        const ph = getComputedStyle(el, "::placeholder");
        const bg = bgOf(el);
        push("placeholder", fgOn(ph.color, el, bg), bg, el, el.placeholder, cs);
      }
    }

    // Buttons and links whose meaning only the icon carries
    for (const svg of scope.querySelectorAll("svg")) {
      if (!visible(svg)) continue;
      const host = svg.closest("button, a");
      if (!host) continue;
      if ((host.textContent ?? "").trim()) continue; // with a text label the icon is decoration
      const bg = bgOf(host);
      push(
        "icon",
        fgOn(getComputedStyle(svg).color, svg, bg),
        bg,
        host,
        host.getAttribute("aria-label") ?? "",
        getComputedStyle(host),
      );
    }

    // The edge of every form control (the shape is what shows where to operate)
    for (const el of scope.querySelectorAll(selector)) {
      if (!visible(el)) continue;
      const cs = getComputedStyle(el);
      const parentBg = bgOf(el.parentElement);
      const bw = parseFloat(cs.borderTopWidth);
      let edge: C;
      let how: string;
      if (
        bw > 0 &&
        cs.borderTopStyle !== "none" &&
        parse(cs.borderTopColor)[3] > 0
      ) {
        edge = over(parse(cs.borderTopColor), parentBg);
        how = "border";
      } else {
        edge = over(parse(cs.backgroundColor), parentBg);
        how = "fill";
      }
      const name =
        el.getAttribute("aria-label") ??
        el.textContent?.trim().slice(0, 20) ??
        "";
      push("boundary", edge, parentBg, el, `${name} (${how})`, cs);
    }
    return items;
  }, boundarySelector);
}

// Runs the audit on the page as it is now. fails: the combinations under their requirement;
// small: text under 14px.
export async function contrastAudit(
  page: Page,
): Promise<{ fails: ContrastRow[]; small: SmallText[] }> {
  const raw = await collect(page);
  const names = tokenNames();
  const nameOf = (hex: string) =>
    (names.get(hex.toLowerCase()) ?? ["(token外)"]).join(" / ");

  const groups = new Map<string, ContrastRow>();
  const small = new Map<number, SmallText>();
  const tiers: Record<Kind, string> = {
    text: "通常文字",
    placeholder: "プレースホルダー",
    icon: "アイコンのみ操作",
    boundary: "操作部品の境界",
  };
  for (const r of raw) {
    if (r.disabled) continue;
    const isText = r.kind === "text" || r.kind === "placeholder";
    const large = r.size >= 24 || (r.size >= 18.66 && r.weight >= 700);
    const need = isText && !large ? 4.5 : 3;
    const tier = isText && large ? "大きい文字" : tiers[r.kind];
    const rt = ratio(fromHex(r.fg), fromHex(r.bg));
    const key = [
      r.kind,
      r.fg,
      r.bg,
      isText ? r.size : "",
      isText ? r.weight : "",
    ].join("|");
    let row = groups.get(key);
    if (!row) {
      row = {
        ratio: rt,
        need,
        tier,
        fg: r.fg,
        bg: r.bg,
        fgToken: nameOf(r.fg),
        bgToken: nameOf(r.bg),
        size: isText ? r.size : 0,
        weight: r.weight,
        count: 0,
        samples: [],
        tags: [],
      };
      groups.set(key, row);
    }
    row.count++;
    if (row.samples.length < 4 && r.text && !row.samples.includes(r.text))
      row.samples.push(r.text);
    if (row.tags.length < 3 && !row.tags.includes(r.tag)) row.tags.push(r.tag);

    if (isText && r.size < 14 && !r.diagram) {
      const s = small.get(r.size) ?? { size: r.size, count: 0, samples: [] };
      s.count++;
      if (s.samples.length < 4 && !s.samples.includes(r.text))
        s.samples.push(r.text);
      small.set(r.size, s);
    }
  }
  const fails = [...groups.values()]
    .filter((r) => r.ratio < r.need)
    .sort((a, b) => a.ratio - b.ratio);
  return { fails, small: [...small.values()] };
}

// One line per failing combination: ratio < requirement, colors (with token names), kind, examples.
export function describeContrastFail(r: ContrastRow): string {
  const examples = r.samples.map((s) => `「${s}」`).join(" ");
  return (
    `${r.ratio.toFixed(2)} < ${r.need}  ${r.fg} (${r.fgToken}) on ${r.bg} (${r.bgToken})` +
    `  [${r.tier}]  ×${r.count}  ${r.tags.join(", ")}  ${examples}`
  );
}

export function describeSmallText(s: SmallText): string {
  return `${s.size}px ×${s.count} ${s.samples.map((x) => `「${x}」`).join(" ")}`;
}
