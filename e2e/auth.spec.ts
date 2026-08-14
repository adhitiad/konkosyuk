import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Masuk");
  });

  test("should show error for invalid email format", async ({ page }) => {
    await page.goto("/sign-up");
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="name"]', "Test User");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Format email tidak valid")).toBeVisible();
  });

  test("should show error for short password", async ({ page }) => {
    await page.goto("/sign-up");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "short");
    await page.fill('input[name="name"]', "Test User");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=minimal 8 karakter")).toBeVisible();
  });
});
