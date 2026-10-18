import { expect, test } from "@playwright/test";
import { contrastAudit, describeContrastFail } from "../audit/index.ts";

// How the answer parts behave in the gallery (the section "解答の選択肢" and "組み合わせと並べ替え"):
// the keyboard, the limit of a multiple choice, the positions of an ordering, the hidden result line.
test.describe("解答の欄の部品", () => {
  test.skip(
    ({ viewport }) => viewport!.width < 768,
    "操作は広い画面で確かめる",
  );

  test("ラジオは Tab で入り、矢印で選べ、フォーカスの輪郭が出る", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    const radios = page
      .getByRole("group", { name: "解答（解答前）" })
      .getByRole("radio");
    await radios.first().scrollIntoViewIfNeeded();
    await page.keyboard.press("Tab");
    await radios.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(radios.nth(1)).toBeChecked();
    const ring = await radios.nth(1).evaluate((el) => {
      const s = getComputedStyle(el.closest("label")!);
      return [s.outlineStyle, s.outlineWidth, s.outlineColor];
    });
    expect(ring).toEqual(["solid", "4px", "rgb(0, 0, 0)"]);
  });

  test("複数選択は、上限まで選ぶと残りが選べなくなり、外すと戻る", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    const boxes = page
      .getByRole("group", { name: "解答（複数・途中）" })
      .getByRole("checkbox");
    await boxes.nth(2).focus();
    await page.keyboard.press("Space");
    await expect(boxes.nth(0)).toBeChecked();
    await expect(boxes.nth(2)).toBeChecked();
    await expect(boxes.nth(1)).toBeDisabled();
    await expect(boxes.nth(3)).toBeDisabled();
    await page.keyboard.press("Space");
    await expect(boxes.nth(1)).toBeEnabled();
    await expect(boxes.nth(3)).toBeEnabled();
  });

  test("上限で淡くした選択肢の文字も、コントラストの監査が見る", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    await page
      .getByRole("group", { name: "解答（複数・上限）" })
      .getByRole("checkbox")
      .nth(1)
      .evaluate((el) => {
        (el.closest("label") as HTMLElement).style.color = "#bbbbbb";
      });
    const { fails } = await contrastAudit(page);
    expect(fails.map(describeContrastFail).join("\n")).toContain(
      "経路を暗号化する",
    );
  });

  test("並べ替えは、選んだ手順の位置を詰めず、ほかの手順が選んだ選択肢を出さない", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    const step = (n: number) => page.getByLabel(`手順 ${n}`).first();
    await expect(step(3)).toHaveValue("B");
    await expect(step(1)).toHaveValue("");
    expect(await step(1).locator("option").allTextContents()).not.toContain(
      "B. IP アドレスを設定する",
    );
    await step(4).selectOption("E");
    await expect(step(1)).toHaveValue("");
    await expect(step(2)).toHaveValue("");
    await expect(step(3)).toHaveValue("B");
  });

  test("解答後の結果は、行の文字と、読み上げの1行の両方に出る", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    const status = (name: string) =>
      page.getByRole("group", { name }).getByRole("status");
    await expect(status("解答（複数・解答後）")).toHaveText(
      "不正解です。正解は A・C です",
    );
    await expect(status("解答（解答前）")).toHaveText("");
    await expect(
      page.getByText("不正解です。3 問中 2 問が正解です"),
    ).toHaveCount(1);
    await expect(
      page.getByText("不正解です。4 手順中 2 手順が正解です"),
    ).toHaveCount(1);
  });
});
