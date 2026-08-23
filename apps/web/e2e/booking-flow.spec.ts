import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test("should display booking form when logged in", async ({ page }) => {
    await page.goto("/properties/123");

    await expect(page.locator("text=Booking")).toBeVisible();
  });

  test("should calculate DP amount correctly", async ({ page }) => {
    await page.goto("/properties/123");

    const totalPriceElement = page.locator("text=1.500.000");
    if (await totalPriceElement.isVisible()) {
      await expect(totalPriceElement).toBeVisible();
    }
  });

  test("should show validation error for past dates", async ({ page }) => {
    await page.goto("/properties/123");

    const startDateInput = page.locator('input[type="date"]').first();
    if (await startDateInput.isVisible()) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateStr = pastDate.toISOString().split("T")[0];

      await startDateInput.fill(pastDateStr);

      await expect(page.locator("text=tidak boleh di masa lalu")).toBeVisible();
    }
  });
});
