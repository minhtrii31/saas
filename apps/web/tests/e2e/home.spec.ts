import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /sharper applications/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Start workspace" })).toBeVisible();
});
