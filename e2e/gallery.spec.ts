import { expect, test } from "@playwright/test";

// The gallery as it is now (the page of every part in every state, and the overlays it opens with
// ?open=), one baseline image per state (e2e/__screenshots__/). A baseline changes only when a
// person has looked at the new image and asked for npm run e2e -- --update-snapshots. The images
// are per platform (the file name ends with it).
const states = [
  { id: "gallery", path: "/gallery/", title: "部品の見本" },
  {
    id: "gallery-modal",
    path: "/gallery/?open=modal",
    title: "モーダルを開いた状態",
  },
  {
    id: "gallery-modal-lg",
    path: "/gallery/?open=modal-lg",
    title: "大きいモーダルを開いた状態",
  },
  {
    id: "gallery-confirm",
    path: "/gallery/?open=confirm",
    title: "確認を開いた状態",
  },
  {
    id: "gallery-confirm-detail",
    path: "/gallery/?open=confirm-detail",
    title: "内容つきの確認を開いた状態",
  },
  {
    id: "gallery-menu",
    path: "/gallery/?open=menu",
    title: "メニューを開いた状態",
  },
  {
    id: "gallery-popover",
    path: "/gallery/?open=popover",
    title: "浮き枠を開いた状態",
  },
  {
    id: "gallery-table-menu",
    path: "/gallery/?open=table-menu",
    title: "短い表の中のメニューを開いた状態",
  },
  {
    id: "gallery-shell-account",
    path: "/gallery/?shell=account",
    title: "ログインのあるアプリの枠",
  },
  {
    id: "gallery-shell-focus",
    path: "/gallery/?shell=focus",
    title: "左ペインのない枠",
  },
];

for (const state of states) {
  test(`${state.title}が基準画像と一致する`, async ({ page }) => {
    await page.goto(state.path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let i = 0; i < 2; i++)
        await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    // The shell takes the height of the window and only main scrolls.
    const height = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    expect(
      height,
      "ページ全体が縦にスクロールします（スクロールするのは main の中だけのはず）",
    ).toBeLessThanOrEqual(page.viewportSize()!.height);
    await expect(page).toHaveScreenshot(`${state.id}.png`, {
      fullPage: false,
      animations: "disabled",
      caret: "hide",
    });
  });
}

// The page is taller than the first screen, and only main scrolls, so the first screen shows the
// top of it only. Every section (one Card each; the Card's name is "{title}（{parts}）") gets its
// own baseline image, taken with a window as tall as the section so that none of it is cut off.
test("各節が基準画像と一致する", async ({ page }) => {
  await page.goto("/gallery/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  const sections = page.locator("main > section");
  const count = await sections.count();
  expect(count, "見本の節が見つかりません").toBeGreaterThan(0);
  const width = page.viewportSize()!.width;
  for (let i = 0; i < count; i++) {
    const section = sections.nth(i);
    const label = (await section.getAttribute("aria-label")) ?? "";
    const title = label.split("（")[0];
    expect(title, `${i + 1} 番目の節に名前がありません`).not.toBe("");
    const box = await section.boundingBox();
    // Room for the header, the status line and the footer around main.
    await page.setViewportSize({
      width,
      height: Math.ceil(box!.height) + 400,
    });
    await section.scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let j = 0; j < 2; j++)
        await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    await expect
      .soft(section)
      .toHaveScreenshot(`gallery-section-${title}.png`, {
        animations: "disabled",
        caret: "hide",
      });
  }
});
