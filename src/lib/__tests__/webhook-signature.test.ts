import { describe, it, expect } from 'vitest'
import { verifyHmacHex, hmacSha256Hex } from '@/lib/payments/signature'

describe('verifyHmacHex', () => {
  const secret = 'test-secret-key'

  it('returns true for valid signature', () => {
    const payload = '{"event":"payment.success"}'
    const signature = `sha256=${hmacSha256Hex(payload, secret)}`

    expect(verifyHmacHex(payload, signature, secret)).toBe(true)
  })

  it('returns false for modified payload', () => {
    const payload = '{"event":"payment.success"}'
    const modifiedPayload = '{"event":"payment.failed"}'
    const signature = `sha256=${hmacSha256Hex(payload, secret)}`

    expect(verifyHmacHex(modifiedPayload, signature, secret)).toBe(false)
  })

  it('returns false for wrong secret', () => {
    const payload = '{"event":"payment.success"}'
    const signature = `sha256=${hmacSha256Hex(payload, secret)}`

    expect(verifyHmacHex(payload, signature, 'wrong-secret')).toBe(false)
  })

  it('returns false when signature header is null', () => {
    const payload = '{"event":"payment.success"}'

    expect(verifyHmacHex(payload, null, secret)).toBe(false)
  })

  it('returns false when signature length does not match', () => {
    const payload = '{"event":"payment.success"}'
    const signature = 'sha256=invalid'

    expect(verifyHmacHex(payload, signature, secret)).toBe(false)
  })

  it('uses timing-safe comparison by not short-circuiting on length mismatch', () => {
    const payload = '{"event":"payment.success"}'
    const shortSignature = 'sha256=abc'

    expect(verifyHmacHex(payload, shortSignature, secret)).toBe(false)
  })
})