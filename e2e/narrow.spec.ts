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
