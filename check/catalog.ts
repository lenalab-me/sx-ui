// 部品の台帳の検査に使う道具（README の「見本ページ」）。見本ページの各節の `parts` が台帳で、
// 入口（index.ts）が公開する部品は、どれもちょうど1つの節に載り、見本で描かれていなければならない。
// ファイルは文字列として受け取る。

// コメントは見ない（`// <Button` を「描いている」と読まないため）。
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

// index.ts が値として公開する部品の名前（英大文字で始まるもの。`type` の export と、
// `confirmTitle` のような関数は除く）。
export function exportedParts(index: string): string[] {
  const code = withoutComments(index);
  if (/export\s*\*/.test(code))
    throw new Error(
      "index.ts に export * があります。部品の名前を読めるよう、名前を列挙してください",
    );
  const names: string[] = [];
  for (const block of code.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const item of block[1]!.split(",")) {
      const entry = item.trim();
      if (entry === "" || /^type\s/.test(entry)) continue;
      const name = entry
        .split(/\s+as\s+/)
        .pop()!
        .trim();
      if (/^[A-Z]/.test(name)) names.push(name);
    }
  }
  // `export const Dummy = …` のように index.ts に直接書いた部品も数える。
  for (const m of code.matchAll(
    /export\s+(?:const|let|var|function|class|enum)\s+([A-Z]\w*)/g,
  ))
    names.push(m[1]!);
  return names;
}

// 見本の各節が `parts={[...]}` に挙げた名前（節ごとに1つの配列）。
export function cataloguedParts(gallery: string): string[][] {
  return [
    ...withoutComments(gallery).matchAll(/\bparts=\{\[([^\]]*)\]\}/g),
  ].map((m) => [...m[1]!.matchAll(/"([^"]+)"/g)].map((n) => n[1]!));
}

// 見本が `<名前` として描いている部品の名前。
function isDrawn(gallery: string, name: string): boolean {
  return new RegExp(`<${name}(?![A-Za-z0-9_])`).test(withoutComments(gallery));
}

// 落ちる理由を、部品の名前で分かる文にして返す。
export function catalogProblems(index: string, gallery: string): string[] {
  const exported = exportedParts(index);
  const sections = cataloguedParts(gallery);
  const listed = sections.flat();
  const problems: string[] = [];
  for (const name of exported) {
    const count = listed.filter((n) => n === name).length;
    if (count === 0) problems.push(`台帳に無い部品: ${name}`);
    if (count > 1)
      problems.push(
        `台帳に${count}回載っている部品（1つの節にだけ載せる）: ${name}`,
      );
    if (!isDrawn(gallery, name))
      problems.push(`見本で描いていない部品: ${name}`);
  }
  for (const name of new Set(listed))
    if (!exported.includes(name)) problems.push(`公開していない名前: ${name}`);
  return problems;
}
