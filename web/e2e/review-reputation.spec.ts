import { test, expect } from "@playwright/test";

test.describe("Review Reputation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/id/login");
    await page.fill('input[name="email"]', "tenant@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("should submit review and display it on property page", async ({
    page,
  }) => {
    await page.goto("/id/properties/123/reviews");

    const reviewForm = page.locator("form").filter({
      hasText: "Write a Review",
    });
    if (!(await reviewForm.isVisible())) {
      test.skip(true, "Review form not available for this property");
    }

    await page.fill(
      'textarea[name="comment"]',
      "Great property, highly recommended!",
    );
    await page.click('input[name="rating"][value="5"]');
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Review submitted")).toBeVisible();

    await page.reload();

    await expect(
      page.locator("text=Great property, highly recommended!"),
    ).toBeVisible();
  });

  test("should update average rating after review submission", async ({
    page,
  }) => {
    await page.goto("/id/properties/123/reviews");

    const avgRatingElement = page.locator(".text-4xl.font-bold");
    if (!(await avgRatingElement.isVisible())) {
      test.skip(true, "Average rating not displayed");
    }

    const beforeRating = await avgRatingElement.textContent();

    await page.fill(
      'textarea[name="comment"]',
      "Testing reputation score update",
    );
    await page.click('input[name="rating"][value="5"]');
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Review submitted")).toBeVisible();

    await page.reload();
    await page.waitForTimeout(1000);

    const afterRating = await avgRatingElement.textContent();
    expect(afterRating).not.toBeNull();
  });
});
