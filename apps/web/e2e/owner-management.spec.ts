import { test, expect } from "@playwright/test";

test.describe("Owner Property Management", () => {
  test("should display owner dashboard", async ({ page }) => {
    await page.goto("/owner/dashboard");

    await expect(page.locator("text=Properti Saya")).toBeVisible();
  });

  test("should open create property form", async ({ page }) => {
    await page.goto("/owner/properties");

    const createButton = page.locator('button:has-text("Tambah Properti")');
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.locator("text=Nama Properti")).toBeVisible();
    }
  });

  test("should validate required fields in property form", async ({ page }) => {
    await page.goto("/owner/properties/new");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Nama properti wajib diisi")).toBeVisible();
  });
});
