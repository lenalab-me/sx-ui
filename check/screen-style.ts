// 画面ファイルの書き方の検査に使う道具（README の「画面ファイルの検査」）。見た目は部品だけが持ち、
// 画面のファイルは配置のクラスしか書かない。ファイルは文字列として読み、文字列リテラルを取り出して
// 調べる（Tailwind もリテラルからしかクラスを作らないので、これで画面が使えるクラスの全部を見られる）。
// 使う側は `@sx/ui/check` から読み、どのファイルを画面とするかは自分で決める。許可リストを緩めるのは
// このリポジトリのコミットだけで、使う側では緩めない。

// ---- ソースの走査 ---------------------------------------------------------------------------

export type Literal = { text: string; line: number; inClass: boolean };

// コメントを空白にしたコードと、文字列リテラル（テンプレートは式の間ごとに1つ）を取り出す。
// inClass は、className= / className: の値の中にあるリテラル。JSX の文章（タグの間の文字）は
// リテラルではないので見ない。
export function scan(source: string): { code: string; literals: Literal[] } {
  const literals: Literal[] = [];
  const n = source.length;
  let code = "";
  let line = 1;
  let i = 0;
  let depth = 0;
  let classUntil: number | null = null;
  let classNext = false;

  const advance = (to: number) => {
    for (; i < to; i++) if (source[i] === "\n") line++;
  };
  const blank = (to: number) => {
    code += source.slice(i, to).replace(/[^\n]/g, " ");
    advance(to);
  };
  const keep = (to: number) => {
    code += source.slice(i, to);
    advance(to);
  };
  const push = (text: string, startLine: number, inClass: boolean) => {
    if (text !== "") literals.push({ text, line: startLine, inClass });
  };

  function readString(quote: string) {
    const startLine = line;
    const inClass = classNext || classUntil !== null;
    classNext = false;
    let text = "";
    let j = i + 1;
    // 閉じていない引用符（JSX の文章中のアポストロフィなど）は、その行の終わりで打ち切る。
    while (j < n && source[j] !== quote && source[j] !== "\n") {
      if (source[j] === "\\") {
        text += source[j + 1] ?? "";
        j += 2;
      } else text += source[j++];
    }
    keep(source[j] === quote ? j + 1 : j);
    push(text, startLine, inClass);
  }

  function readTemplate() {
    const inClass = classNext || classUntil !== null;
    classNext = false;
    let text = "";
    let startLine = line;
    keep(i + 1);
    while (i < n && source[i] !== "`") {
      if (source[i] === "\\") {
        text += source[i + 1] ?? "";
        keep(i + 2);
      } else if (source[i] === "$" && source[i + 1] === "{") {
        push(text, startLine, inClass);
        text = "";
        keep(i + 2);
        readCode(true);
        startLine = line;
      } else {
        text += source[i];
        keep(i + 1);
      }
    }
    push(text, startLine, inClass);
    keep(Math.min(i + 1, n));
  }

  function readCode(inTemplate: boolean) {
    const baseDepth = depth;
    depth++;
    while (i < n) {
      const c = source[i];
      const next = source[i + 1];
      if (c === "/" && next === "/") {
        const end = source.indexOf("\n", i);
        blank(end === -1 ? n : end);
      } else if (c === "/" && next === "*") {
        const end = source.indexOf("*/", i + 2);
        blank(end === -1 ? n : end + 2);
      } else if (c === '"' || c === "'") readString(c);
      else if (c === "`") readTemplate();
      else if (c === "{") {
        depth++;
        keep(i + 1);
      } else if (c === "}") {
        depth--;
        if (classUntil !== null && depth <= classUntil) classUntil = null;
        keep(i + 1);
        if (inTemplate && depth === baseDepth) return;
      } else if (
        c === "c" &&
        /^className\s*[=:]\s*/.test(source.slice(i, i + 40)) &&
        !/\w/.test(source[i - 1] ?? "")
      ) {
        const m = /^className\s*[=:]\s*/.exec(source.slice(i, i + 40))!;
        keep(i + m[0].length);
        if (source[i] === "{") classUntil = depth;
        else if (/["'`]/.test(source[i] ?? "")) classNext = true;
      } else keep(i + 1);
    }
  }

  readCode(false);
  return { code, literals };
}

// ---- 画面ファイルが書いてよいクラス -----------------------------------------------------------

// 配置のクラス。これ以外（色・文字サイズ・枠・角丸・影・hover など状態・任意値・-sx- を含む語）は
// 画面に書けない。sm: md: lg: の接頭辞は外してから当てる。
export const allowedLayout: RegExp[] = [
  /flex|inline-flex|grid|block|inline|inline-block|hidden|contents|sr-only|not-sr-only/,
  /flex-(row|col|wrap|nowrap|1|auto|none)/,
  /grid-cols-\d+|col-span-\d+|col-start-\d+|row-span-\d+/,
  /gap(-[xy])?-\d+(\.\d+)?/,
  /(items|justify|self|content|place)-[a-z]+(-[a-z]+)*/,
  /(min-|max-)?[wh]-(\d+(\.\d+)?|full|auto|px|fit|min|max|dvh|screen|\d+\/\d+)|size-\d+/,
  /-?[pm][xytrbl]?-(\d+(\.\d+)?|auto|px)|space-[xy]-\d+/,
  /shrink(-0)?|grow(-0)?|basis-[\w./]+|order-[\w-]+/,
  /overflow(-[xy])?-(auto|hidden|clip|visible|scroll)/,
  /relative|absolute|sticky|fixed|static|(top|right|bottom|left|inset)(-[xy])?-(\d+|auto|px)|z-\d+/,
  /whitespace-[a-z-]+|truncate|break-[a-z]+|text-(left|center|right)|tabular-nums|align-[a-z-]+/,
  /table-fixed|table-auto|list-none/,
].map((re) => new RegExp(`^(?:${re.source})$`));

// クラス名に見える語：先頭が（! や - のあと）英小文字か [（http:// のような URL は除く）。日本語の文言・# や / ではじまる語は
// クラスに見えないので読み飛ばす。
const classLike = /^(?![a-z]+:\/\/)[!-]?[a-z[]/;
// 1語だけのリテラルが、className の外でも落ちる形（装飾のクラスの形）。`variant="primary"` のような
// 部品の引数の値は1語なので、className の中でないかぎり、この形だけを落とす。
const decorative = new RegExp(
  "[:[]|-sx-|^!|^(?:bg|text|border|rounded|shadow|ring|outline|font|leading|tracking|opacity|fill|stroke|divide|decoration|accent|caret|from|via|to|scale|rotate|translate|skew|blur|backdrop|transition|duration|ease|animate|cursor|select|appearance|resize|object|aspect|float|columns|line-clamp|indent|scheme|list|dads)-",
);

export function disallowedWords(literal: Literal): string[] {
  const words = literal.text.split(/\s+/).filter((w) => w !== "");
  const bad: string[] = [];
  for (const word of words) {
    const bare = word.replace(/^(?:sm|md|lg):/, "");
    if (allowedLayout.some((re) => re.test(bare))) continue;
    if (!classLike.test(word)) continue;
    if (words.length > 1 || literal.inClass || decorative.test(word))
      bad.push(word);
  }
  return bad;
}

// ---- 画面と部品に共通の書き方 ------------------------------------------------------------------

// role="alert"・"status" の書き方（読み上げは部品が持つ）。
export const rolePattern =
  /\brole\s*=\s*(?:["'](?:alert|status)["']|\{[^}]*["'`](?:alert|status)["'`])|\brole\s*:\s*["'](?:alert|status)["']/;
// 色の直書き（tokens.css にだけ置く）。
export const colorPattern = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/;

// CSS のコメントを、行を保ったまま空白にする。
export const stripCssComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));

export function lineOf(code: string, index: number): number {
  return code.slice(0, index).split("\n").length;
}
