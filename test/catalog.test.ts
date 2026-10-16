// node --test test/catalog.test.ts（Node の型除去で直接実行する）
//
// 部品の台帳の検査（README の「見本ページ」）。src/index.ts が公開する部品は、どれも見本ページ
// （gallery/gallery.tsx）のちょうど1つの節の `parts` に載り、見本で描かれている。
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  catalogProblems,
  cataloguedParts,
  exportedParts,
} from "../check/catalog.ts";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("index.ts が公開する部品は、どれもちょうど1つの節に載り、見本で描かれている", () => {
  const index = read("src/index.ts");
  const gallery = read("gallery/gallery.tsx");
  assert.ok(exportedParts(index).length > 0, "部品を1つも読み取れません");
  assert.ok(cataloguedParts(gallery).length > 0, "見本の節を読み取れません");
  assert.deepEqual(catalogProblems(index, gallery), []);
});

// 検査自身の確認：落とすべき壊れ方を落とす（読み取りが黙って空になって通るのを防ぐ）。
test("検査は、台帳の載せ忘れ・公開していない名前・描き忘れ・重複を落とす", () => {
  const index = [
    'export { Button, type ButtonVariant } from "./Button";',
    'export { confirmTitle, ConfirmDialog } from "./ConfirmDialog";',
    'export { Tag as Chip } from "./Tag";',
    "export type Local = string;",
  ].join("\n");
  const gallery = `
    // <Chip is only in a comment
    <Section parts={["Button", "ConfirmDialog", "Chip"]}>
      <Button>a</Button><ConfirmDialog q={q} /><Chip>b</Chip>
    </Section>`;
  assert.deepEqual(exportedParts(index), ["Button", "ConfirmDialog", "Chip"]);
  assert.deepEqual(catalogProblems(index, gallery), []);

  const problems = (g: string) => catalogProblems(index, g);
  assert.deepEqual(problems(gallery.replace('"Button", ', "")), [
    "台帳に無い部品: Button",
  ]);
  assert.deepEqual(problems(gallery.replace('"Chip"]', '"Chip", "Dummy"]')), [
    "公開していない名前: Dummy",
  ]);
  assert.deepEqual(problems(gallery.replaceAll("<Button", "<Bu")), [
    "見本で描いていない部品: Button",
  ]);
  assert.deepEqual(
    problems(gallery.replace("<Chip>b</Chip>", "<ChipList>b</ChipList>")),
    ["見本で描いていない部品: Chip"],
  );
  assert.deepEqual(
    problems(
      gallery.replace(
        "</Section>",
        '</Section><Section parts={["Chip"]}></Section>',
      ),
    ),
    ["台帳に2回載っている部品（1つの節にだけ載せる）: Chip"],
  );
  assert.deepEqual(
    problems(gallery).concat(
      catalogProblems(index + "\nexport const Dummy = () => null;", gallery),
    ),
    ["台帳に無い部品: Dummy", "見本で描いていない部品: Dummy"],
  );
  assert.throws(() => exportedParts('export * from "./Button";'));
});
