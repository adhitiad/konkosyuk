import { test, expect } from "@playwright/test";

test.describe("Property Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display property search page", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Temukan");
  });

  test("should filter properties by type", async ({ page }) => {
    const kostFilter = page.locator('button:has-text("Kost")');
    if (await kostFilter.isVisible()) {
      await kostFilter.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should search properties by city", async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Jakarta"], input[placeholder*="kota"]',
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("Jakarta");
      await page.waitForTimeout(1000);
    }
  });
});
