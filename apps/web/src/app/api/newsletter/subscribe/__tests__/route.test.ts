import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/newsletter/subscribe/route";

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 422 for invalid email", async () => {
    const req = {
      json: async () => ({ email: "invalid" }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.success).toBe(false);
  });

  it("should return 500 when Resend client is not configured", async () => {
    const req = {
      json: async () => ({ email: "test@example.com" }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
