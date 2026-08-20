import { test, expect } from "@playwright/test";

test.describe("Property Wizard Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/id/login");
    await page.fill('input[name="email"]', "owner@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/owner");
  });

  test("should create property successfully with valid data", async ({ page }) => {
    await page.goto("/id/owner/properties/add");

    await page.fill('input[id="title"]', "Test Property E2E");
    await page.fill('input[id="address"]', "Jl. Test No. 123, RT 05/RW 10, Jakarta Selatan");
    await page.fill('input[id="city"]', "Jakarta Selatan");
    await page.selectOption('select[id="type"]', "kost");

    await page.setInputFiles('input[type="file"]', [
      {
        name: "test1.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "89504e470d0a1a0a0000000d49484452" +
            "000000010000000108060000001f15c4" +
            "890000000a49444154789c6362000000" +
            "010001245a89660000000049454e44ae" +
            "426082",
          "hex",
        ),
      },
      {
        name: "test2.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "89504e470d0a1a0a0000000d49484452" +
            "000000010000000108060000001f15c4" +
            "890000000a49444154789c6362000000" +
            "010001245a89660000000049454e44ae" +
            "426082",
          "hex",
        ),
      },
      {
        name: "test3.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "89504e470d0a1a0a0000000d49484452" +
            "000000010000000108060000001f15c4" +
            "890000000a49444154789c6362000000" +
            "010001245a89660000000049454e44ae" +
            "426082",
          "hex",
        ),
      },
    ]);

    await page.click('button[type="submit"]');

    await page.waitForURL("/owner/properties", { timeout: 10000 });

    await expect(page.locator("text=Test Property E2E")).toBeVisible();
  });

  test("should display validation error for empty required fields", async ({ page }) => {
    await page.goto("/id/owner/properties/add");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Nama properti wajib diisi")).toBeVisible();
  });

  test("should not create property when server returns error", async ({ page }) => {
    await page.goto("/id/owner/properties/add");

    await page.fill('input[id="title"]', "Test Invalid Property");
    await page.fill('input[id="address"]', "short");

    await page.setInputFiles('input[type="file"]', [
      {
        name: "test1.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "89504e470d0a1a0a0000000d49484452" +
            "000000010000000108060000001f15c4" +
            "890000000a49444154789c6362000000" +
            "010001245a89660000000049454e44ae" +
            "426082",
          "hex",
        ),
      },
      {
        name: "test2.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "89504e470d0a1a0a0000000d49484452" +
            "000000010000000108060000001f15c4" +
            "890000000a49444154789c6362000000" +
            "010001245a89660000000049454e44ae" +
            "426082",
          "hex",
        ),
      },
      {
        name: "test3.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "89504e470d0a1a0a0000000d49484452" +
            "000000010000000108060000001f15c4" +
            "890000000a49444154789c6362000000" +
            "010001245a89660000000049454e44ae" +
            "426082",
          "hex",
        ),
      },
    ]);

    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("/owner/properties")) {
      await expect(page.locator("text=Test Invalid Property")).not.toBeVisible();
    }
  });
});
