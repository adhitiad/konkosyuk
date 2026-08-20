import { describe, it, expect } from "vitest";
import { validateCsrfToken, getCsrfToken } from "@/lib/csrf";

function createMockRequest(opts: {
  cookieToken?: string | null;
  headerToken?: string | null;
}) {
  return {
    cookies: {
      get: (_name: string) => {
        if (opts.cookieToken === undefined || opts.cookieToken === null) {
          return undefined;
        }
        return { value: opts.cookieToken };
      },
    },
    headers: {
      get: (_name: string) => opts.headerToken ?? null,
    },
  } as unknown as NextRequest;
}

describe("safeCompare (via validateCsrfToken)", () => {
  it("returns true for identical tokens", () => {
    const req = createMockRequest({
      cookieToken: "abc123",
      headerToken: "abc123",
    });
    expect(validateCsrfToken(req).success).toBe(true);
  });

  it("returns false for different tokens", () => {
    const req = createMockRequest({
      cookieToken: "abc123",
      headerToken: "xyz789",
    });
    expect(validateCsrfToken(req).success).toBe(false);
  });

  it("returns false when one token is empty", () => {
    const req = createMockRequest({
      cookieToken: "abc123",
      headerToken: "",
    });
    expect(validateCsrfToken(req).success).toBe(false);
  });

  it("handles different length tokens without error", () => {
    const req = createMockRequest({
      cookieToken: "short",
      headerToken: "much-longer-token",
    });
    expect(() => validateCsrfToken(req)).not.toThrow();
    expect(validateCsrfToken(req).success).toBe(false);
  });
});

describe("validateCsrfToken", () => {
  it("returns success for valid token", () => {
    const req = createMockRequest({
      cookieToken: "valid-token",
      headerToken: "valid-token",
    });
    expect(validateCsrfToken(req).success).toBe(true);
  });

  it("returns false for invalid token", () => {
    const req = createMockRequest({
      cookieToken: "valid-token",
      headerToken: "wrong-token",
    });
    const result = validateCsrfToken(req);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns false for empty token", () => {
    const req = createMockRequest({
      cookieToken: "",
      headerToken: "",
    });
    expect(validateCsrfToken(req).success).toBe(false);
  });
});

describe("getCsrfToken", () => {
  it("returns token from cookies", () => {
    const req = createMockRequest({ cookieToken: "csrf-value" }) as NextRequest;
    expect(getCsrfToken(req)).toBe("csrf-value");
  });

  it("returns null when cookie is missing", () => {
    const req = createMockRequest({}) as NextRequest;
    expect(getCsrfToken(req)).toBeNull();
  });
});
