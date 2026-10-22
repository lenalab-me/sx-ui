// node --test test/parts.test.ts（Node の型除去で直接実行する）
//
// 部品と見本ページの書き方の検査（README の「部品の書き方」）。色の直書きは tokens.css にだけ置き、
// 読み上げ（role="alert"・"status"）とフォーカスリングは決まった部品にだけ書く。見本ページは画面と
// 同じく配置のクラスだけを使う。
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  appCssProblems,
  colorPattern,
  computedRolePattern,
  disallowedWords,
  lineOf,
  rolePattern,
  scan,
  stripCssComments,
  stylePattern,
} from "../check/screen-style.ts";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

const partFiles = readdirSync(new URL("src/", root), {
  recursive: true,
  encoding: "utf8",
})
  .filter((p) => /\.(tsx?|css)$/.test(p))
  .map((p) => `src/${p}`)
  .sort();
const galleryFile = "gallery/gallery.tsx";

// role="alert"・"status" を書けるのは、通知の部品だけ。
const roleAllowed = [
  "src/Notice.tsx",
  "src/StatusLine.tsx",
  "src/Field.tsx",
  "src/SaveStatus.tsx",
  // 解答の欄の部品（ChoiceList・MatchList・OrderList）が、結果を読み上げる隠した1行。結果そのものは行の文字とアイコンで言い、この行は読み上げ専用。
  "src/Answer.tsx",
];

const codeOf = (file: string) => {
  const source = read(file);
  return file.endsWith(".css") ? stripCssComments(source) : scan(source).code;
};

test("部品のファイルを読み取れている", () => {
  assert.ok(partFiles.includes("src/tokens.css"));
  assert.ok(partFiles.includes("src/Button.tsx"));
});

test("色の直書きは src/tokens.css にだけある", () => {
  const problems: string[] = [];
  for (const file of [...partFiles, galleryFile]) {
    if (file === "src/tokens.css") continue;
    const code = codeOf(file);
    const m = colorPattern.exec(code);
    if (m) problems.push(`${file}:${lineOf(code, m.index)} ${m[0]}`);
  }
  assert.deepEqual(problems, []);
});

test('role="alert"・"status" の文字列は、通知の部品（Notice・StatusLine・Field・SaveStatus）と、解答の欄の読み上げの1行（Answer）にだけある', () => {
  const problems: string[] = [];
  for (const file of [...partFiles, galleryFile]) {
    if (!file.endsWith(".tsx") || roleAllowed.includes(file)) continue;
    const code = codeOf(file);
    const m = rolePattern.exec(code);
    if (m) problems.push(`${file}:${lineOf(code, m.index)} ${m[0]}`);
  }
  assert.deepEqual(problems, []);
});

test("focus-visible の文字列は src/focus.ts にだけある", () => {
  const problems: string[] = [];
  for (const file of [...partFiles, galleryFile]) {
    if (file === "src/focus.ts") continue;
    const code = codeOf(file);
    const m = /focus-visible/.exec(code);
    if (m)
      problems.push(
        `${file}:${lineOf(code, m.index)} focus-visible（フォーカスリングは src/focus.ts の focusRing を使う）`,
      );
  }
  assert.deepEqual(problems, []);
});

test("見本ページは、配置のクラスだけを書き、style=・lucide-react・<label・placeholder= を使わない", () => {
  const problems: string[] = [];
  const { code, literals } = scan(read(galleryFile));
  for (const literal of literals)
    for (const word of disallowedWords(literal))
      problems.push(`${galleryFile}:${literal.line} ${word}`);
  for (const [re, what] of [
    [stylePattern, "style="],
    [/["']lucide-react["']/, "lucide-react"],
    [/<label\b/, "<label"],
    [/\bplaceholder\s*=/, "placeholder="],
  ] as const) {
    const m = re.exec(code);
    if (m) problems.push(`${galleryFile}:${lineOf(code, m.index)} ${what}`);
  }
  assert.deepEqual(problems, []);
});

// 検査自身の確認：落とすべき書き方を落とし、通すべき書き方を通す（許可リストや走査を緩めて
// 検査が黙って通るようになるのを防ぐ）。
test("検査は、装飾のクラスを落とし、配置のクラスと部品の引数の値を通す", () => {
  const bad = (source: string) =>
    scan(source).literals.flatMap((l) => disallowedWords(l));
  assert.deepEqual(bad('<div className="flex gap-4 text-[13px]" />'), [
    "text-[13px]",
  ]);
  assert.deepEqual(bad('<div className="md:grid-cols-2 hover:bg-x" />'), [
    "hover:bg-x",
  ]);
  // 幅の接頭辞（md: と、狭い画面の max-md:）は、配置のクラスなら通し、装飾のクラスには効かない。
  assert.deepEqual(
    bad(
      '<div className="flex-col md:flex-row max-md:hidden md:grid-cols-3" />',
    ),
    [],
  );
  assert.deepEqual(
    bad(
      '<div className="max-md:flex-col max-md:bg-sx-fill max-md:hover:flex" />',
    ),
    ["max-md:bg-sx-fill", "max-md:hover:flex"],
  );
  assert.deepEqual(bad("<p className={`mt-2 ${a ? 'text-sx-body' : ''}`} />"), [
    "text-sx-body",
  ]);
  assert.deepEqual(bad('<div className="outline" />'), ["outline"]);
  assert.deepEqual(bad('<div className={a ? "border" : "flex"} />'), [
    "border",
  ]);
  assert.deepEqual(
    bad('<Tag tone="outline" icon="file-text" size="sm" />'),
    [],
  );
  assert.deepEqual(bad('<a href="#physical">物理構成 STEP1 の申込</a>'), []);
  assert.deepEqual(bad("// className=\"text-red-500\"\nconst a = 'flex';"), []);
  assert.deepEqual(bad('const l = `tabs-${v}`; const p = "/api/x";'), []);
  // Tailwind の接頭辞のうち、英小文字ではじまらないもの（幅の 2xl:、コンテナの @、子の *:）も見る。
  assert.deepEqual(
    bad('<div className="2xl:bg-x @container @md:shadow-lg *:rounded flex" />'),
    ["2xl:bg-x", "@container", "@md:shadow-lg", "*:rounded"],
  );
  assert.deepEqual(bad('const c = "2xl:bg-x"; const d = "*:p-4";'), [
    "2xl:bg-x",
    "*:p-4",
  ]);
  assert.deepEqual(bad('import { Button } from "@sx/ui";'), []);
  // className の外の複数語は、クラスの並びに見えるときだけ見る（英語の文は通す）。
  assert.deepEqual(bad('const c = "rounded shadow";'), ["rounded", "shadow"]);
  assert.deepEqual(bad('const c = "flex text-sx-body";'), ["text-sx-body"]);
  assert.deepEqual(
    bad(
      '<IconButton label="close dialog" /><a href="https://x.example/a b">x</a>',
    ),
    [],
  );
  assert.deepEqual(bad('const m = "network error";'), []);
});

test("検査は、読み上げ・style・色の別の書き方を落とし、部品の引数を通す", () => {
  const hit = (re: RegExp, source: string) => re.test(scan(source).code);
  for (const source of [
    '<div role="alert" />',
    "<div role={`status`} />",
    '<div role={ok ? "alert" : undefined} />',
    '<div {...{ role: "alert" }} />',
    "<div {...{ role: `alert` }} />",
    '<div role="log" />',
    '<div role="alertdialog" />',
    '<div aria-live="assertive" />',
    '<div aria-live="polite" />',
    "<output>{m}</output>",
  ])
    assert.ok(hit(rolePattern, source), source);
  for (const source of [
    '<div role="img" />',
    '<Notice live tone="error" />',
    '<div title="role: alert の説明" />',
  ])
    assert.ok(!hit(rolePattern, source), source);
  for (const source of [
    "<div role={r} />",
    "<div {...{ role: r }} />",
    '<div role={ok ? "alert" : undefined} />',
  ])
    assert.ok(hit(computedRolePattern, source), source);
  assert.ok(
    !hit(computedRolePattern, '<div role="img" /><div role={"img"} />'),
  );
  for (const source of [
    "<div style={{ color: x }} />",
    '<div {...{ style: { color: "red" } }} />',
    '<div {...{ "style": s }} />',
    '<style>{"main{}"}</style>',
    'ref.current.style.color = "red";',
    'el.setAttribute("style", s);',
  ])
    assert.ok(hit(stylePattern, source), source);
  for (const source of [
    '<Button variant="primary" />',
    "const fontStyle = 1;",
    "<p>style を書かない</p>",
  ])
    assert.ok(!hit(stylePattern, source), source);
  for (const source of [
    "#fff",
    "rgb(0 0 0)",
    "oklch(0.5 0.1 200)",
    "hwb(0 0% 0%)",
    "lab(50 0 0)",
    "color-mix(in srgb, red, blue)",
  ])
    assert.ok(colorPattern.test(source), source);
});

test("検査は、アプリの CSS に部品の CSS の読み込みと @source のほかを書かせない", () => {
  const ok = [
    "/* 画面の CSS の入口 */",
    '@import "@sx/ui/styles.css";',
    '@source "./";',
    "@source not './legacy';",
  ].join("\n");
  assert.deepEqual(appCssProblems(ok), []);
  assert.deepEqual(
    appCssProblems(`${ok}\n@theme {\n  --color-sx-accent: #f00;\n}`),
    [
      { line: 5, text: "@theme {" },
      { line: 6, text: "--color-sx-accent: #f00;" },
      { line: 7, text: "}" },
    ],
  );
  assert.deepEqual(appCssProblems('@import "tailwindcss";'), [
    { line: 1, text: '@import "tailwindcss";' },
  ]);
  assert.deepEqual(appCssProblems("main { color: red }"), [
    { line: 1, text: "main { color: red }" },
  ]);
});
