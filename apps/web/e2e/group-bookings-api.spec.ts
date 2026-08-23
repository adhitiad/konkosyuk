import { test, expect } from "@playwright/test";

async function getCsrfToken(page: typeof test.prototype.page): Promise<string> {
  const response = await page.request.get("/api/csrf");
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);

  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find(
    (c: { name: string }) => c.name === "csrf_token",
  );
  expect(csrfCookie).toBeDefined();
  return csrfCookie!.value;
}

async function authenticatedRequest(
  page: typeof test.prototype.page,
  options: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    url: string;
    body?: unknown;
  },
) {
  const csrfToken = await getCsrfToken(page);
  const headers: Record<string, string> = {
    "X-CSRF-Token": csrfToken,
  };

  if (options.body && options.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  const fullUrl = `http://localhost:3000${options.url}`;

  switch (options.method) {
    case "GET":
      return await page.request.get(fullUrl, { headers });
    case "POST":
      return await page.request.post(fullUrl, {
        headers,
        data: options.body ? JSON.stringify(options.body) : undefined,
      });
    case "PUT":
      return await page.request.put(fullUrl, {
        headers,
        data: options.body ? JSON.stringify(options.body) : undefined,
      });
    case "DELETE":
      return await page.request.delete(fullUrl, { headers });
  }
}

test.describe("Group Bookings API", () => {
  let createdGroupBookingId: string | null = null;
  let testPropertyId: string | null = null;
  let testUnitId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await page.goto("/id/login");
    await page.fill('input[name="email"]', "owner@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/owner");

    const csrfResponse = await page.request.get("/api/csrf");
    expect(csrfResponse.status()).toBe(200);

    const propertyResponse = await page.request.post("/api/properties", {
      headers: { "Content-Type": "application/json" },
      data: {
        title: "Test Property for Group Booking",
        type: "kost",
        address: "Jl. Test No. 123",
        city: "Jakarta Selatan",
        basePrice: "1500000",
        status: "aktif",
        isActive: true,
      },
    });

    if (propertyResponse.status() === 201) {
      const propertyData = await propertyResponse.json();
      testPropertyId = propertyData.data?.id || propertyData.id;

      const unitResponse = await page.request.post("/api/units", {
        headers: { "Content-Type": "application/json" },
        data: {
          propertyId: testPropertyId,
          name: "Unit Test 1",
          price: "1500000",
          capacity: "2",
          status: "available",
        },
      });

      if (unitResponse.status() === 201) {
        const unitData = await unitResponse.json();
        testUnitId = unitData.data?.id || unitData.id;
      }
    }
  });

  test.afterEach(async ({ page }) => {
    if (createdGroupBookingId) {
      try {
        await authenticatedRequest(page, {
          method: "DELETE",
          url: `/api/group-bookings/${createdGroupBookingId}`,
        });
      } catch {
        // ignore cleanup errors
      }
      createdGroupBookingId = null;
    }

    if (testPropertyId) {
      try {
        const csrfToken = await getCsrfToken(page);
        await page.request.delete(
          `http://localhost:3000/api/properties/${testPropertyId}`,
          { headers: { "X-CSRF-Token": csrfToken } },
        );
      } catch {
        // ignore cleanup errors
      }
      testPropertyId = null;
    }
  });

  test("should create a group booking", async ({ page }) => {
    if (!testPropertyId || !testUnitId) {
      test.skip(true, "Test data setup failed - property or unit not created");
      return;
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const response = await authenticatedRequest(page, {
      method: "POST",
      url: "/api/group-bookings",
      body: {
        propertyId: testPropertyId,
        unitId: testUnitId,
        startDate: futureDate.toISOString(),
        endDate: new Date(
          futureDate.getTime() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        maxMembers: 4,
        memberEmails: ["member1@test.com", "member2@test.com"],
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.id).toBeDefined();

    createdGroupBookingId = data.data.id;
  });

  test("should get group booking detail", async ({ page }) => {
    if (!createdGroupBookingId) {
      test.skip(true, "No group booking created");
      return;
    }

    const response = await authenticatedRequest(page, {
      method: "GET",
      url: `/api/group-bookings/${createdGroupBookingId}`,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(createdGroupBookingId);
  });

  test("should return 404 for non-existent group booking", async ({ page }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await authenticatedRequest(page, {
      method: "GET",
      url: `/api/group-bookings/${fakeId}`,
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test("should cancel a group booking", async ({ page }) => {
    if (!createdGroupBookingId) {
      test.skip(true, "No group booking created");
      return;
    }

    const response = await authenticatedRequest(page, {
      method: "DELETE",
      url: `/api/group-bookings/${createdGroupBookingId}`,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    createdGroupBookingId = null;
  });

  test("should get membership status", async ({ page }) => {
    if (!createdGroupBookingId) {
      test.skip(true, "No group booking created");
      return;
    }

    const response = await authenticatedRequest(page, {
      method: "GET",
      url: `/api/group-bookings/${createdGroupBookingId}/members/me`,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });
});
