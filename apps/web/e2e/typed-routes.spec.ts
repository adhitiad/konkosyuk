import { test, expect } from "@playwright/test";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getFirstPropertyId(): Promise<string | null> {
  try {
    const response = await fetch(`${BASE}/api/properties?limit=1`);
    if (!response.ok) return null;
    const body = await response.json();
    const first = body?.data?.data?.[0] || body?.data?.[0];
    return first?.id || null;
  } catch {
    return null;
  }
}

test.describe("Typed Routes Smoke", () => {
  test("public pages should be reachable", async ({ page }) => {
    const propertyId = await getFirstPropertyId();
    const pages = [
      "/id",
      "/id/properties",
      `/id/properties/${propertyId ?? "123"}`,
    ];

    const failed: string[] = [];
    for (const path of pages) {
      try {
        const response = await page.goto(path, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        const status = response?.status();
        if (status && status >= 400) {
          failed.push(`${path} (${status})`);
        }
      } catch (error) {
        failed.push(`${path} (navigation error)`);
      }
    }

    expect(failed, `Routes failed: ${failed.join(", ")}`).toEqual([]);
  });

  test("internal links should not point to missing routes", async ({
    page,
  }) => {
    await page.goto("/id", { waitUntil: "domcontentloaded" });

    const links = await page.locator('a[href^="/"]').all();
    expect(links.length).toBeGreaterThan(0);

    const checked = new Set<string>();
    const invalidHrefs: string[] = [];
    const maxLinks = 20;

    for (const link of links.slice(0, maxLinks)) {
      const href = await link.getAttribute("href");
      if (!href || href === "/" || checked.has(href)) continue;
      checked.add(href);

      try {
        const response = await page.request.get(`${BASE}${href}`, {
          timeout: 10000,
        });
        if (response.status() >= 400) {
          invalidHrefs.push(`${href} (${response.status()})`);
        }
      } catch {
        invalidHrefs.push(`${href} (network error)`);
      }
    }

    expect(
      invalidHrefs,
      `Invalid internal links found: ${invalidHrefs.join(", ")}`,
    ).toEqual([]);
  });
});
