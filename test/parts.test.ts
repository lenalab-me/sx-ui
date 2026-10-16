// node --test test/parts.test.ts（Node の型除去で直接実行する）
//
// 部品と見本ページの書き方の検査（README の「部品の書き方」）。色の直書きは tokens.css にだけ置き、
// 読み上げ（role="alert"・"status"）とフォーカスリングは決まった部品にだけ書く。見本ページは画面と
// 同じく配置のクラスだけを使う。
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  colorPattern,
  disallowedWords,
  lineOf,
  rolePattern,
  scan,
  stripCssComments,
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

test('role="alert"・"status" の文字列は、通知の部品（Notice・StatusLine・Field・SaveStatus）にだけある', () => {
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
    [/\bstyle\s*=\s*\{/, "style="],
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
});
