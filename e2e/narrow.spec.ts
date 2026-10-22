import { expect, test } from "@playwright/test";

// The gallery on a phone (the narrow project only): nothing runs past the right edge of the
// screen, of the frame that clips it, or of the window it is in. The layout audit looks at the
// page as a whole and at the text in table cells; this looks at every box. A frame that scrolls
// sideways on purpose is a table, a tab list or a code block (it says so with overflow-x-auto);
// a frame that scrolls without saying so (the body of a modal, main) means something stuck out.
test.skip(({ viewport }) => viewport!.width >= 768, "狭い画面だけ");

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

function stickingOut(): string[] {
  const width = document.documentElement.clientWidth;
  const describe = (el: Element) =>
    `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? `.${el.className.split(/\s+/).slice(0, 3).join(".")}` : ""} 「${(el.textContent ?? "").trim().slice(0, 20)}」`;
  const problems: string[] = [];
  const clipFor = (el: Element) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const style = getComputedStyle(p);
      if (style.overflowX === "visible") continue;
      const scrolls = p.scrollWidth > p.clientWidth + 1;
      if (style.overflowX === "hidden" || style.overflowX === "clip")
        return { frame: p, scrolls: false };
      if (scrolls) return { frame: p, scrolls: true };
    }
    return null;
  };
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("[data-diagram], svg, [class*='sr-only']")) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    const clip = clipFor(el);
    if (clip?.scrolls) {
      // Reported once, at the frame, and only when it does not say it scrolls.
      const frame = clip.frame;
      const declared = /\boverflow-(x-)?(auto|scroll)\b/.test(
        frame.getAttribute("class") ?? "",
      );
      const note = `横にスクロールする枠: ${describe(frame)}`;
      if (!declared && !problems.includes(note)) problems.push(note);
      continue;
    }
    const right = clip ? clip.frame.getBoundingClientRect().right : width;
    if (r.right > right + 1 || r.left < -1)
      problems.push(
        `枠の外に出ている（右端 ${Math.round(r.right)} / 枠 ${Math.round(right)}）: ${describe(el)}`,
      );
  }
  return problems;
}

for (const path of paths) {
  test(`${path} のどの箱も、画面と枠の横からはみ出さない`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(stickingOut), "はみ出した箱").toEqual([]);
  });
}

// The drawer of the Shell (its panel is in the top layer, over the page).
test("メニューの引き出しの中身が、引き出しの横からはみ出さない", async ({
  page,
}) => {
  await page.goto("/gallery/?shell=account");
  await page.getByRole("button", { name: "メニューを開く" }).click();
  await expect(page.getByRole("dialog", { name: "メニュー" })).toBeVisible();
  expect(await page.evaluate(stickingOut), "はみ出した箱").toEqual([]);
});

// The check itself: a box that runs past a clipping frame, and a frame that scrolls sideways
// without saying so, are found; a table frame that says it scrolls (overflow-x-auto) is not.
test("この検査は、枠からはみ出した箱と、断りなく横に動く枠を見つけ、断った枠は通す", async ({
  page,
}) => {
  const frame = (cls: string, style: string) =>
    `<div class="${cls}" style="width: 200px; ${style}"><div style="width: 600px; height: 20px">広い中身</div></div>`;
  await page.setContent(frame("", "overflow: hidden"));
  expect((await page.evaluate(stickingOut)).join()).toContain(
    "枠の外に出ている",
  );
  await page.setContent(frame("", "overflow-y: auto"));
  expect((await page.evaluate(stickingOut)).join()).toContain(
    "横にスクロールする枠",
  );
  await page.setContent(frame("overflow-x-auto", "overflow-x: auto"));
  expect(await page.evaluate(stickingOut)).toEqual([]);
});

// A stacked table (Table `stack`) is display: block below md, which in some browsers drops the
// table's meaning; the roles Table sets say it again. The header row stays (sr-only), so the
// columns keep their names.
test("積んだ表は、表・行・列見出し・行見出し・セルとして読まれ、見出しの行が残る", async ({
  page,
}) => {
  await page.goto("/gallery/");
  const table = page.getByRole("table", { name: "Card に入れた表" });
  await expect(table).toBeAttached();
  await table.scrollIntoViewIfNeeded();
  await expect(table.getByRole("columnheader")).toHaveText([
    "拠点番号",
    "拠点名",
    "機器数",
  ]);
  await expect(table.getByRole("rowgroup")).toHaveCount(2);
  await expect(table.getByRole("row")).toHaveCount(4);
  await expect(table.getByRole("rowheader")).toHaveCount(3);
  await expect(table.getByRole("cell")).toHaveCount(6);
  // The header row is not drawn (sr-only: 1px) but is in the page.
  const head = await table.locator("thead").boundingBox();
  expect(head!.width).toBeLessThanOrEqual(1);
  // Without `stack` the table keeps the DOM the browser already reads as a table (no roles).
  const plain = page.getByRole("table", { name: "見本拠点の一覧" });
  expect(await plain.locator("[role]").count()).toBe(0);
  expect(await plain.getAttribute("role")).toBeNull();
});

// A pill tab list with more tabs than fit scrolls sideways in one row (like underline and
// segmented) instead of wrapping into several rows.
test("pill のタブは、あふれても折り返さず、1行のまま横にスクロールする", async ({
  page,
}) => {
  await page.goto("/gallery/");
  const row = await page.evaluate(() => {
    const list = document.querySelector(
      '[role="tablist"][aria-label="タブ（pill）"]',
    )!;
    const first = list.firstElementChild!;
    for (let i = 0; i < 6; i++) list.append(first.cloneNode(true));
    const tops = new Set(
      [...list.children].map((c) => Math.round(c.getBoundingClientRect().top)),
    );
    return {
      rows: tops.size,
      scrolls: list.scrollWidth > list.clientWidth,
      overflowX: getComputedStyle(list).overflowX,
    };
  });
  expect(row).toEqual({ rows: 1, scrolls: true, overflowX: "auto" });
});

// Below md the tab lists are scroll frames (overflow-x-auto), whose minimum height is 0. In a column
// that is taller than its box (the main of a screen with a long table under the tabs) they were the
// items that shrank, down to their padding, so the labels hung out under the box that follows (found
// on the exam list of exam-platform, which the gallery's own layout does not show). Here the column
// holding each list is made shorter than its content, as a screen's main is.
for (const variant of ["underline", "segmented", "pill"]) {
  test(`${variant} のタブは、中身より低い列に入れても、ラベルが収まる高さを保つ`, async ({
    page,
  }) => {
    await page.goto("/gallery/");
    const label = `タブ（${variant}）`;
    const list = page.locator(`[role="tablist"][aria-label="${label}"]`);
    await list.scrollIntoViewIfNeeded();
    const heights = await list.evaluate((el) => {
      const column = el.parentElement!;
      const before = el.getBoundingClientRect().height;
      column.style.height = "40px";
      const tabs = [...el.children].map((c) => c.getBoundingClientRect());
      const box = el.getBoundingClientRect();
      return {
        before,
        after: box.height,
        tabsInside: tabs.every((t) => t.bottom <= box.bottom + 1),
      };
    });
    expect(heights.after, "縮んだ後のタブの並びの高さ").toBe(heights.before);
    expect(heights.tabsInside, "タブがタブの並びの下にはみ出す").toBe(true);
  });
}
