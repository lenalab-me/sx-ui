import { expect, test } from "@playwright/test";

// How the parts behave with the keyboard and a screen reader, on the gallery: what the baseline
// images cannot show (where the focus goes, what a reader hears, what the browser does on its own).
test.describe("部品の振る舞い", () => {
  test.skip(
    ({ viewport }) => viewport!.width < 768,
    "操作は広い画面で確かめる",
  );

  test("送信中（busy）のモーダルは、Esc を続けて押しても閉じない", async ({
    page,
  }) => {
    await page.goto("/gallery/?open=modal&busy");
    const dialog = page.getByRole("dialog", { name: "拠点を追加" });
    await expect(dialog).toBeVisible();
    // The browser stops honoring preventDefault on cancel after a few presses with nothing between.
    for (let i = 0; i < 5; i++) await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    expect(
      await page
        .locator("dialog")
        .evaluate((d) => (d as HTMLDialogElement).open),
    ).toBe(true);
  });

  test("送信中でないモーダルは、Esc で閉じる", async ({ page }) => {
    await page.goto("/gallery/?open=modal");
    const dialog = page.getByRole("dialog", { name: "拠点を追加" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("入力中の行（group）は、赤枠と指摘を見せないが、読み上げには残す", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    const input = page.getByRole("textbox", { name: "行1 のVLAN ID" });
    const message = page.locator("#gallery-group-1-messages");
    await input.focus();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).not.toHaveAttribute("data-invalid");
    await expect(input).toHaveAccessibleDescription(
      /VLAN ID：指定可能：1-4094/,
    );
    // Kept for readers only (sr-only), not drawn.
    await expect(message.getByText("VLAN ID：指定可能：1-4094")).toHaveClass(
      /sr-only/,
    );
    await expect(
      message.getByText("VLAN ID：補足は入力中も出ます"),
    ).not.toHaveClass(/sr-only/);
    await page.locator("main").click({ position: { x: 4, y: 4 } });
    await expect(input).toHaveAttribute("data-invalid", "true");
    await expect(
      message.getByText("VLAN ID：指定可能：1-4094"),
    ).not.toHaveClass(/sr-only/);
  });

  test("入力中の行が消えて、フォーカスが行き場を失っても、指摘が戻る", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    const name = page.getByRole("textbox", { name: "行1 の名前" });
    const message = page.locator("#gallery-group-1-messages");
    await name.focus();
    await expect(message.getByText("VLAN ID：指定可能：1-4094")).toHaveClass(
      /sr-only/,
    );
    // The focused element goes away and the table hears no blur: when React deletes the row, the
    // focusout comes during its commit, while React's own events are switched off. Here the focusout
    // is kept from React's root instead.
    await name.evaluate((el) => {
      const stop = (e: Event) => e.stopPropagation();
      window.addEventListener("focusout", stop, true);
      el.remove();
      window.removeEventListener("focusout", stop, true);
    });
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
      "BODY",
    );
    await page.locator("main").click({ position: { x: 4, y: 4 } });
    await expect(
      message.getByText("VLAN ID：指定可能：1-4094"),
    ).not.toHaveClass(/sr-only/);
  });

  test("タブの aria-controls は、どれも実在するパネルを指す", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    await expect(page.getByRole("tab").first()).toBeVisible();
    const dangling = await page.evaluate(() =>
      [...document.querySelectorAll("[role=tab][aria-controls]")]
        .map((t) => t.getAttribute("aria-controls")!)
        .filter((id) => !document.getElementById(id)),
    );
    expect(dangling).toEqual([]);
    expect(
      await page
        .locator("[role=tab][aria-selected=true][aria-controls]")
        .count(),
    ).toBeGreaterThan(0);
  });

  test("浮き枠は、Tab で枠の外へ出ると閉じる", async ({ page }) => {
    await page.goto("/gallery/");
    const opener = page.getByRole("button", { name: "浮き枠を開く" });
    await opener.click();
    const box = page.getByRole("dialog", { name: "浮き枠の例" });
    await expect(box).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(box.getByRole("textbox", { name: "メモ" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(box).toBeHidden();
    await expect(opener).not.toBeFocused();
  });

  test("解答後の選択肢の名前は、結果の読み上げが言う記号を含む", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    const group = page.getByRole("group", {
      name: "解答（解答後）",
      exact: true,
    });
    const said = await group.getByRole("status").textContent();
    const right = said!.match(/正解は (\S+) です/)![1]!;
    await expect(
      group.getByRole("radio", { name: new RegExp(`^${right}：`) }),
    ).toHaveCount(1);
  });

  test("論理接続図の読み上げ用の表は、上の楕円（WAN）も言う", async ({
    page,
  }) => {
    await page.goto("/gallery/");
    await expect(
      page.getByRole("table", { name: /^論理接続図の例/ }),
    ).toHaveAccessibleName(/WAN（対象外）/);
  });
});
