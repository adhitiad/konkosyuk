import { createHmac, createHash, timingSafeEqual } from 'node:crypto'

export function hmacSha256Hex(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function generateSha256Signature(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

export function generateMd5Signature(data: string): string {
  return createHash('md5').update(data).digest('hex')
}

export function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  expectedSignature: string,
): boolean {
  if (!signatureHeader) return false

  try {
    return timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signatureHeader))
  } catch {
    return false
  }
}

export function verifyHmacHex(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  prefix = 'sha256=',
): boolean {
  if (!signatureHeader) return false

  const expected = hmacSha256Hex(rawBody, secret)
  const actual = signatureHeader.startsWith(prefix)
    ? signatureHeader.slice(prefix.length)
    : signatureHeader

  if (actual.length !== expected.length) return false

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  } catch {
    return false
  }
}
