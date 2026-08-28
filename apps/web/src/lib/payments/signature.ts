import { createHmac, createHash } from "node:crypto";
import { timingSafeCompare } from "@/lib/perf";

export function hmacSha256Hex(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateSha256Signature(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

export function hmacSha512Hex(payload: string, secret: string): string {
  return createHmac("sha512", secret).update(payload).digest("hex");
}

export function generateOttoSignature(
  minifiedBody: string,
  timestamp: string,
  secretKey: string,
): string {
  const stringToSign = `${minifiedBody}&${timestamp}&${secretKey}`;
  return hmacSha512Hex(stringToSign, secretKey);
}

export function generateMd5Signature(data: string): string {
  return createHash("md5").update(data).digest("hex");
}

export function verifySignature(
  _rawBody: string,
  signatureHeader: string | null,
  expectedSignature: string,
): boolean {
  if (!signatureHeader) return false;

  return timingSafeCompare(expectedSignature, signatureHeader);
}

export function verifyHmacHex(
  _rawBody: string,
  signatureHeader: string | null,
  secret: string,
  prefix = "sha256=",
): boolean {
  if (!signatureHeader) return false;

  const expected = hmacSha256Hex(_rawBody, secret);
  const actual = signatureHeader.startsWith(prefix)
    ? signatureHeader.slice(prefix.length)
    : signatureHeader;

  return timingSafeCompare(expected, actual);
}
