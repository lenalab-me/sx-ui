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
// 画面に書けない。sm: md: lg: と max-sm: max-md: max-lg: の接頭辞（画面の幅で配置を変える。狭い画面は
// max-md: で書く）は外してから当てるので、配置のクラスなら幅の接頭辞が付いていても書ける。
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

// クラス名に見える語：先頭が（! や - のあと）英小文字か [（http:// のような URL は除く）か、Tailwind の接頭辞の
// @（コンテナ）・*:（子）・2xl: のような数字ではじまる幅。日本語の文言・# や / ではじまる語はクラスに見えないので読み飛ばす。
const classLike = /^(?![a-z]+:\/\/)(?:[!-]?[a-z[]|@[a-z]|\*{1,2}:|\d+xl:)/;
// 1語だけのリテラルが、className の外でも落ちる形（装飾のクラスの形）。`variant="primary"` のような
// 部品の引数の値は1語なので、className の中でないかぎり、この形だけを落とす。
const decorative = new RegExp(
  "[:[]|-sx-|^!|^(?:bg|text|border|rounded|shadow|ring|outline|font|leading|tracking|opacity|fill|stroke|divide|decoration|accent|caret|from|via|to|scale|rotate|translate|skew|blur|backdrop|transition|duration|ease|animate|cursor|select|appearance|resize|object|aspect|float|columns|line-clamp|indent|scheme|list|dads)-",
);

// 1語では部品の引数の値と見分けられない装飾のクラス。複数語のリテラルにあれば、クラスの並びと見る。
const bareDecorative =
  /^(?:border|rounded|shadow|ring|outline|italic|underline|overline|line-through|uppercase|lowercase|capitalize|invisible|visible|grayscale|invert|sepia|blur|antialiased|transition|transform|filter|container|isolate|collapse)$/;
const layoutWord = (word: string) =>
  allowedLayout.some((re) =>
    re.test(word.replace(/^(?:max-)?(?:sm|md|lg):/, "")),
  );

// className の外の複数語のリテラルが、クラスの並びに見えるか。どれかの語が、配置のクラス・装飾の形・
// 「-」「:」「[」を含むクラスの形・装飾の1語なら、クラスの並びと見る。"close dialog" のような英語の文は見ない。
const looksLikeClasses = (words: string[]) =>
  words.some(
    (w) =>
      classLike.test(w) &&
      (layoutWord(w) ||
        decorative.test(w) ||
        /[-:[]/.test(w) ||
        bareDecorative.test(w)),
  );

export function disallowedWords(literal: Literal): string[] {
  const words = literal.text.split(/\s+/).filter((w) => w !== "");
  const classes =
    literal.inClass || (words.length > 1 && looksLikeClasses(words));
  const bad: string[] = [];
  for (const word of words) {
    if (layoutWord(word)) continue;
    if (!classLike.test(word)) continue;
    if (classes || decorative.test(word)) bad.push(word);
  }
  return bad;
}

// ---- 画面と部品に共通の書き方 ------------------------------------------------------------------

// 読み上げの書き方（読み上げは部品が持つ）：role="alert"・"status" と、同じく出た瞬間に読み上げる
// log・alertdialog・timer・marquee の role、aria-live、暗黙に status の <output>。
const liveRole = String.raw`["'\`](?:alert|status|log|alertdialog|timer|marquee)["'\`]`;
export const rolePattern = new RegExp(
  String.raw`\brole\s*=\s*(?:${liveRole}|\{[^}]*${liveRole})|\brole["']?\s*:\s*${liveRole}|\baria-live\b|\bariaLive\b|<output\b`,
);
// 画面が role を式で渡す書き方（const r = "alert"; role={r}）。部品は stack の表のように式で渡すので、画面だけに使う。
export const computedRolePattern =
  /\brole\s*=\s*\{(?!\s*["'`][\w-]*["'`]\s*\})|\brole["']?\s*:\s*(?!["'`])[\w$(]/;
// style の書き方：style= と、spread やオブジェクトの style:、<style> の要素、要素の .style。
export const stylePattern =
  /\bstyle["']?\s*[=:]|<style\b|\.style\b|setAttribute\(\s*["'`]style\b/;
// 色の直書き（tokens.css にだけ置く）。色の名前（red など）は文の語と見分けられないので見ない。
export const colorPattern =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/;

// アプリの CSS の入口（とそのほかの CSS）の書き方：部品の CSS を読む @import "@sx/ui/styles.css" と、画面の
// ファイルを走査させる @source（@source not も）だけを書ける。トークンの上書き（@theme）や独自の規則を書くと、
// 部品の見た目が画面の側で変わる。書けない部分を、行と中身で返す。
export function appCssProblems(
  source: string,
): { line: number; text: string }[] {
  const code = stripCssComments(source).replace(
    /@import\s+["']@sx\/ui\/styles\.css["']\s*;|@source\s+(?:not\s+)?["'][^"'\n]*["']\s*;/g,
    (s) => s.replace(/[^\n]/g, " "),
  );
  const problems: { line: number; text: string }[] = [];
  for (const m of code.matchAll(/\S[^\n]*/g))
    problems.push({ line: lineOf(code, m.index), text: m[0].trim() });
  return problems;
}

// CSS のコメントを、行を保ったまま空白にする。
export const stripCssComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));

export function lineOf(code: string, index: number): number {
  return code.slice(0, index).split("\n").length;
}
