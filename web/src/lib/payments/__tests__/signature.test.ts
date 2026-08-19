import { describe, it, expect } from "vitest";
import {
  hmacSha256Hex,
  sha256Hex,
  generateSha256Signature,
  generateMd5Signature,
  verifySignature,
  verifyHmacHex,
} from "@/lib/payments/signature";

describe("hmacSha256Hex", () => {
  const secret = "test-secret-key";

  it("generates correct HMAC-SHA256 signature", () => {
    const payload = "test-payload";
    const signature = hmacSha256Hex(payload, secret);

    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates different signatures for different secrets", () => {
    const payload = "test-payload";
    const sig1 = hmacSha256Hex(payload, "secret1");
    const sig2 = hmacSha256Hex(payload, "secret2");

    expect(sig1).not.toBe(sig2);
  });
});

describe("sha256Hex", () => {
  it("generates correct SHA256 hash", () => {
    const input = "test-input";
    const hash = sha256Hex(input);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates deterministic hash", () => {
    const input = "test-input";
    const hash1 = sha256Hex(input);
    const hash2 = sha256Hex(input);

    expect(hash1).toBe(hash2);
  });
});

describe("generateSha256Signature", () => {
  it("generates HMAC-SHA256 signature", () => {
    const data = "data-to-sign";
    const secret = "my-secret";
    const signature = generateSha256Signature(data, secret);

    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("generateMd5Signature", () => {
  it("generates MD5 hash", () => {
    const data = "data-to-sign";
    const signature = generateMd5Signature(data);

    expect(signature).toMatch(/^[a-f0-9]{32}$/);
  });
});

describe("verifySignature", () => {
  const secret = "test-secret-key";

  it("returns true for matching signatures", () => {
    const rawBody = '{"status":"success"}';
    const expectedSignature = generateSha256Signature(rawBody, secret);

    expect(verifySignature(rawBody, expectedSignature, expectedSignature)).toBe(
      true,
    );
  });

  it("returns false for mismatched signatures", () => {
    const rawBody = '{"status":"success"}';
    const wrongSignature = "sha256=invalid";

    expect(verifySignature(rawBody, wrongSignature, "secret")).toBe(false);
  });

  it("returns false for null signature header", () => {
    expect(verifySignature("payload", null, "secret")).toBe(false);
  });
});

describe("verifyHmacHex", () => {
  const secret = "test-secret-key";

  it("returns true for valid HMAC signature", () => {
    const payload = '{"event":"payment.success"}';
    const signature = `sha256=${hmacSha256Hex(payload, secret)}`;

    expect(verifyHmacHex(payload, signature, secret)).toBe(true);
  });

  it("returns false for modified payload", () => {
    const payload = '{"event":"payment.success"}';
    const modifiedPayload = '{"event":"payment.failed"}';
    const signature = `sha256=${hmacSha256Hex(payload, secret)}`;

    expect(verifyHmacHex(modifiedPayload, signature, secret)).toBe(false);
  });

  it("returns false for wrong secret", () => {
    const payload = '{"event":"payment.success"}';
    const signature = `sha256=${hmacSha256Hex(payload, "correct-secret")}`;

    expect(verifyHmacHex(payload, signature, "wrong-secret")).toBe(false);
  });

  it("returns false when signature header is null", () => {
    const payload = '{"event":"payment.success"}';

    expect(verifyHmacHex(payload, null, "secret")).toBe(false);
  });

  it("returns false when signature length does not match", () => {
    const payload = '{"event":"payment.success"}';
    const signature = "sha256=invalid";

    expect(verifyHmacHex(payload, signature, "secret")).toBe(false);
  });
});
