import { test, expect } from "@playwright/test";

test.describe("CSP Nonce", () => {
  test("should set x-nonce header and CSP nonce on page load", async ({
    page,
  }) => {
    const responses: { url: string; headers: Record<string, string> }[] = [];

    page.on("response", async (response) => {
      if (response.url().includes("localhost:3000/")) {
        const headers = response.headers();
        responses.push({ url: response.url(), headers });
      }
    });

    await page.goto("/id");

    const mainResponse = responses.find(
      (r) => r.url === "http://localhost:3000/id",
    );
    expect(mainResponse).toBeDefined();

    const headers = mainResponse!.headers;

    const nonce = headers["x-nonce"];
    expect(nonce).toBeDefined();
    expect(typeof nonce).toBe("string");
    expect(nonce.length).toBeGreaterThan(0);

    const csp = headers["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain(`nonce-${nonce}`);

    expect(csp).not.toContain("'unsafe-inline'");
  });

  test("should have nonce in style-src and script-src", async ({ page }) => {
    const responses: { url: string; headers: Record<string, string> }[] = [];

    page.on("response", async (response) => {
      if (response.url().includes("localhost:3000/")) {
        const headers = response.headers();
        responses.push({ url: response.url(), headers });
      }
    });

    await page.goto("/id");

    const mainResponse = responses.find(
      (r) => r.url === "http://localhost:3000/id",
    );
    expect(mainResponse).toBeDefined();

    const csp = mainResponse!.headers["content-security-policy"];
    expect(csp).toBeDefined();

    const nonce = mainResponse!.headers["x-nonce"];
    expect(nonce).toBeDefined();

    const scriptSrcMatch = csp.match(/script-src ([^;]+);/);
    expect(scriptSrcMatch).toBeTruthy();
    expect(scriptSrcMatch![1]).toContain(`nonce-${nonce}`);

    const styleSrcMatch = csp.match(/style-src ([^;]+);/);
    expect(styleSrcMatch).toBeTruthy();
    expect(styleSrcMatch![1]).toContain(`nonce-${nonce}`);
  });

  test("should allowlisted domains remain in CSP", async ({ page }) => {
    const responses: { url: string; headers: Record<string, string> }[] = [];

    page.on("response", async (response) => {
      if (response.url().includes("localhost:3000/")) {
        const headers = response.headers();
        responses.push({ url: response.url(), headers });
      }
    });

    await page.goto("/id");

    const mainResponse = responses.find(
      (r) => r.url === "http://localhost:3000/id",
    );
    expect(mainResponse).toBeDefined();

    const csp = mainResponse!.headers["content-security-policy"];
    expect(csp).toBeDefined();

    expect(csp).toContain("https://va.vercel-scripts.com");
    expect(csp).toContain("https://res.cloudinary.com");
    expect(csp).toContain("https://tiles.stadiamaps.com");
    expect(csp).toContain("https://basemaps.cartocdn.com");
    expect(csp).toContain("https://tile.openstreetmap.org");
  });
});
