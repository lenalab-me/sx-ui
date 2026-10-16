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
