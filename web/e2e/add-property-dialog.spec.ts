import { test, expect } from "@playwright/test";

test.describe("Add Property", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/id/login");
    await page.fill('input[name="email"]', "owner@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/owner");
  });

  test("should show add property page and create property successfully", async ({
    page,
  }) => {
    await page.goto("/id/owner/properties/add");

    await page.fill("#title", "Test Property");
    await page.fill("#city", "Jakarta Selatan");
    await page.fill("#address", "Jl. Test No. 123");

    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (!form) return;

      const addHiddenInput = (name: string, value: string) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      addHiddenInput("title", "Test Property");
      addHiddenInput("type", "kost");
      addHiddenInput("city", "Jakarta Selatan");
      addHiddenInput("address", "Jl. Test No. 123");
    });

    await page.click('button[type="submit"]:has-text("Simpan")');

    await expect(page).toHaveURL("/owner/properties");
    await expect(
      page.locator("text=Properti berhasil ditambahkan."),
    ).toBeVisible();
  });

  test("should show validation errors for empty required fields", async ({
    page,
  }) => {
    await page.goto("/id/owner/properties/add");

    await page.evaluate(() => {
      document.querySelectorAll("[required]").forEach((el) => {
        el.removeAttribute("required");
      });
    });

    await page.click('button[type="submit"]:has-text("Simpan")');

    await expect(
      page.locator("text=String must contain at least 1 character(s)"),
    ).toBeVisible();
  });

  test("should show error on server error", async ({ page }) => {
    await page.goto("/id/owner/properties/add");

    await page.fill("#title", "Test Property");
    await page.fill("#city", "Jakarta Selatan");
    await page.fill("#address", "Jl. Test No. 123");

    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (!form) return;

      const addHiddenInput = (name: string, value: string) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      addHiddenInput("type", "kost");

      const imagesInput = document.getElementById(
        "property-images",
      ) as HTMLInputElement | null;
      if (imagesInput) {
        imagesInput.value = "invalid json";
      }
    });

    await page.click('button[type="submit"]:has-text("Simpan")');

    await expect(page.locator("text=Gagal membuat properti")).toBeVisible();
  });
});
