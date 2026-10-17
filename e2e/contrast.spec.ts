import { expect, test } from "@playwright/test";
import {
  contrastAudit,
  describeContrastFail,
  describeSmallText,
} from "../audit/index.ts";

// The contrast audit (audit/contrast.ts, what @sx/ui/audit gives to the apps) on every state of the
// gallery, so that a part whose colors fall under the standard fails here, before an app takes it.
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
  test(`${path} の文字・アイコン・操作部品の境界がコントラストの基準を満たす`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const { fails, small } = await contrastAudit(page);
    expect(
      fails.map(describeContrastFail),
      "基準（4.5:1・3:1）に届かない組",
    ).toEqual([]);
    expect(small.map(describeSmallText), "14px 未満の文字").toEqual([]);
  });
}

// The audit itself: a faint text on white fails with its ratio, a dark one passes.
test("監査は、基準に届かない文字の色を落とし、届く色なら通す", async ({
  page,
}) => {
  const page_ = (color: string) =>
    `<body style="background: #ffffff; margin: 0"><p style="color: ${color}; font-size: 16px">見本拠点の補足</p></body>`;
  await page.setContent(page_("#aaaaaa"));
  const faint = await contrastAudit(page);
  expect(faint.fails.map(describeContrastFail).join("\n")).toContain("< 4.5");
  await page.setContent(page_("#333333"));
  expect((await contrastAudit(page)).fails).toEqual([]);
});
