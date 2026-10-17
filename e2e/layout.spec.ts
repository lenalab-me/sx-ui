import { expect, test } from "@playwright/test";
import { layoutAudit } from "../audit/index.ts";

// The layout audit (audit/layout.ts, what @sx/ui/audit gives to the apps) on every state of the
// gallery: no text leaves its table cell, and no two texts overlap. Baseline images would keep a
// layout that was broken when it was first taken; this looks for the breakage itself.
const paths = [
  "/gallery/",
  "/gallery/?open=modal",
  "/gallery/?open=modal-lg",
  "/gallery/?open=confirm",
  "/gallery/?open=confirm-detail",
  "/gallery/?open=menu",
  "/gallery/?open=popover",
  "/gallery/?open=table-menu",
  "/gallery/?shell=account",
  "/gallery/?shell=focus",
];

for (const path of paths) {
  test(`${path} の文字がセルからはみ出さず、重ならない`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(layoutAudit), "はみ出し・重なり").toEqual([]);
  });
}

// The audit itself: it finds a long value in a nowrap cell of a fixed table that runs under the next
// cell, and passes the same table when the value is truncated with an ellipsis or wraps.
test("監査は、固定幅の表で折り返さない長い値のはみ出しと重なりを落とし、省略・折り返しなら通す", async ({
  page,
}) => {
  const table = (cell: string) => `
    <table style="table-layout: fixed; width: 400px; border-collapse: collapse">
      <tr><td style="${cell}">2026-10-14 〜 2026-10-21 の貸し出し</td><td>貸出中</td></tr>
    </table>`;
  await page.setContent(table("white-space: nowrap"));
  const broken = await page.evaluate(layoutAudit);
  expect(broken.some((p) => p.startsWith("セルからはみ出している"))).toBe(true);
  expect(broken.some((p) => p.startsWith("文字が重なっている"))).toBe(true);
  await page.setContent(
    table("white-space: nowrap; overflow: hidden; text-overflow: ellipsis"),
  );
  expect(await page.evaluate(layoutAudit)).toEqual([]);
  await page.setContent(table(""));
  expect(await page.evaluate(layoutAudit)).toEqual([]);
});

// A menu opened from a cell is in the top layer, drawn over the table on purpose: it neither leaves
// its cell nor overlaps the text under it. Two texts in the page under it still count.
test("監査は、セルから開いたメニュー（popover）を、はみ出し・重なりに数えない", async ({
  page,
}) => {
  await page.setContent(`
    <table style="table-layout: fixed; width: 300px">
      <tr><td>行の操作<div popover="manual" id="m" style="position: fixed; inset: 0 auto auto 0; margin: 0; width: 280px">テンプレートから写す・テンプレート化</div></td><td>貸出中</td></tr>
      <tr><td>2行目の名前</td><td>返却済</td></tr>
    </table>`);
  await page.evaluate(() => document.getElementById("m")!.showPopover());
  expect(await page.evaluate(layoutAudit)).toEqual([]);
});

// The audit itself, for each of the other kinds: the broken form is caught, the right one passes.
const audit = async (page: import("@playwright/test").Page, html: string) => {
  await page.setContent(html);
  return page.evaluate(layoutAudit);
};

test("監査は、省略記号も行数の制限も無く途中で切れた文字を落とし、truncate・行数の制限なら通す", async ({
  page,
}) => {
  const box = (style: string) =>
    `<div style="width: 120px; overflow: hidden; white-space: nowrap; ${style}">見本拠点 001 〜 見本拠点 120 の一括登録</div>`;
  const cut = await audit(page, box(""));
  expect(cut.some((p) => p.startsWith("文字が途中で切れている"))).toBe(true);
  expect(await audit(page, box("text-overflow: ellipsis"))).toEqual([]);
  expect(
    await audit(
      page,
      `<div style="width: 120px; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1">見本拠点 001 〜 見本拠点 120 の一括登録</div>`,
    ),
  ).toEqual([]);
});

test("監査は、文字に重なったアイコンを落とし、並んだアイコンなら通す", async ({
  page,
}) => {
  const icon = (style: string) =>
    `<p style="position: relative; font-size: 16px">保存しました<svg width="16" height="16" style="${style}"><circle cx="8" cy="8" r="8"/></svg></p>`;
  const hit = await audit(
    page,
    icon("position: absolute; left: 4px; top: 4px"),
  );
  expect(hit.some((p) => p.startsWith("アイコンと文字が重なっている"))).toBe(
    true,
  );
  expect(await audit(page, icon("margin-left: 8px"))).toEqual([]);
});

test("監査は、ページの横のはみ出しと、キーボードで入れない横スクロールの枠を落とし、入れる枠なら通す", async ({
  page,
}) => {
  const wide = await audit(page, `<div style="width: 3000px">広い表</div>`);
  expect(wide.some((p) => p.startsWith("ページが横にはみ出している"))).toBe(
    true,
  );
  const frame = (attrs: string) =>
    `<div ${attrs} style="width: 300px; overflow-x: auto"><div style="width: 900px">広い表の中身</div></div>`;
  const locked = await audit(page, frame(""));
  expect(
    locked.some((p) =>
      p.startsWith("横にスクロールする枠にキーボードで入れない"),
    ),
  ).toBe(true);
  expect(
    await audit(page, frame('tabindex="0" role="region" aria-label="表"')),
  ).toEqual([]);
});
