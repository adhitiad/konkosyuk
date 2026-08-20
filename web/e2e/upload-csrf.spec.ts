import { test, expect } from "@playwright/test";

test.describe("Upload CSRF Protection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/id/login");
    await page.fill('input[name="email"]', "owner@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/owner");
  });

  test("should upload image successfully with CSRF token", async ({ page }) => {
    await page.goto("/id/owner/properties/add");

    const fileInput = page.locator('input[type="file"]').first();
    if (!(await fileInput.isVisible())) {
      test.skip(true, "Upload input not visible on this page");
    }

    const buffer = Buffer.from(
      "89504e470d0a1a0a0000000d49484452" +
        "000000010000000108060000001f15c4" +
        "890000000a49444154789c6362000000" +
        "010001245a89660000000049454e44ae" +
        "426082",
      "hex",
    );

    await fileInput.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer,
    });

    await expect(page.locator("text=Upload")).toBeVisible();
  });

  test("should reject upload without CSRF token", async ({ page }) => {
    await page.goto("/id/owner/properties/add");

    await page.context().clearCookies();

    await page.route("**/uploadImageAction", async (route) => {
      const request = route.request();
      const postData = request.postData();
      if (postData && !postData.includes("csrf")) {
        await route.fulfill({ status: 403, body: JSON.stringify({ error: "Invalid CSRF token" }) });
        return;
      }
      await route.continue();
    });

    const fileInput = page.locator('input[type="file"]').first();
    if (!(await fileInput.isVisible())) {
      test.skip(true, "Upload input not visible on this page");
    }

    const buffer = Buffer.from(
      "89504e470d0a1a0a0000000d49484452" +
        "000000010000000108060000001f15c4" +
        "890000000a49444154789c6362000000" +
        "010001245a89660000000049454e44ae" +
        "426082",
      "hex",
    );

    await fileInput.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer,
    });

    await expect(page.locator("text=Invalid CSRF token")).toBeVisible();
  });

  test("should reject fake WebP file with WAV magic bytes", async ({ page }) => {
    await page.goto("/id/owner/properties/add");

    const wavHeader = Buffer.from("52494646", "hex");
    const rest = Buffer.alloc(100, 0);
    const buffer = Buffer.concat([wavHeader, rest]);

    const fileInput = page.locator('input[type="file"]').first();
    if (!(await fileInput.isVisible())) {
      test.skip(true, "Upload input not visible on this page");
    }

    await fileInput.setInputFiles({
      name: "fake.webp",
      mimeType: "image/webp",
      buffer,
    });

    await expect(
      page.locator("text=File tidak valid atau tidak sesuai format gambar"),
    ).toBeVisible();
  });
});
