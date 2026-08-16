import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  sanitizeObject,
  sanitizeMetadata,
} from "@/lib/sanitize";

describe("sanitizeString", () => {
  it("escapes HTML special characters", () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;",
    );
  });

  it("returns null for null input", () => {
    expect(sanitizeString(null)).toBe(null);
  });

  it("returns undefined for undefined input", () => {
    expect(sanitizeString(undefined)).toBe(undefined);
  });

  it("escapes single quotes", () => {
    expect(sanitizeString("It's working")).toBe("It&#039;s working");
  });
});

describe("sanitizeObject", () => {
  it("sanitizes string values", () => {
    const result = sanitizeObject({ name: "<b>Test</b>" });
    expect(result.name).toBe("&lt;b&gt;Test&lt;&#x2F;b&gt;");
  });

  it("sanitizes nested objects", () => {
    const result = sanitizeObject({
      user: {
        name: "<script>alert(1)</script>",
      },
    });
    expect(result.user.name).toBe("&lt;script&gt;alert(1)&lt;&#x2F;script&gt;");
  });

  it("sanitizes arrays", () => {
    const result = sanitizeObject({
      tags: ["<div>", "safe"],
    });
    expect(result.tags[0]).toBe("&lt;div&gt;");
    expect(result.tags[1]).toBe("safe");
  });

  it("does not modify non-string values", () => {
    const input = {
      count: 42,
      active: true,
      nested: { value: 123 },
    };
    const result = sanitizeObject(input);
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.nested.value).toBe(123);
  });
});

describe("sanitizeMetadata", () => {
  it("returns null for null input", () => {
    expect(sanitizeMetadata(null)).toBe(null);
  });

  it("sanitizes metadata object", () => {
    const metadata = { description: "<p>Test</p>", count: 5 };
    const result = sanitizeMetadata(metadata);
    expect(result?.description).toBe("&lt;p&gt;Test&lt;&#x2F;p&gt;");
    expect(result?.count).toBe(5);
  });
});
