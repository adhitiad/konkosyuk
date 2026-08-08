import { describe, it, expect } from 'vitest'
import { calculateDp, calculateEndDate } from '@/lib/payments/calculations'

describe('calculateDp', () => {
  it('returns dpAmount 35% and remainingAmount 65% of totalPrice', () => {
    const totalPrice = 1_000_000
    const result = calculateDp(totalPrice)

    expect(result.dpAmount).toBe(350_000)
    expect(result.remainingAmount).toBe(650_000)
  })

  it('handles zero totalPrice', () => {
    const result = calculateDp(0)

    expect(result.dpAmount).toBe(0)
    expect(result.remainingAmount).toBe(0)
  })

  it('handles decimal values correctly', () => {
    const totalPrice = 1_500_000
    const result = calculateDp(totalPrice)

    expect(result.dpAmount).toBe(525_000)
    expect(result.remainingAmount).toBe(975_000)
  })
})

describe('calculateEndDate', () => {
  it('adds specified months to startDate', () => {
    const startDate = '2026-09-01'
    const result = calculateEndDate(startDate, 3)

    expect(result).toBe('2026-12-01')
  })

  it('handles month overflow correctly', () => {
    const startDate = '2026-10-15'
    const result = calculateEndDate(startDate, 5)

    expect(result).toBe('2027-03-15')
  })

  it('returns same date when months is 0', () => {
    const startDate = '2026-09-01'
    const result = calculateEndDate(startDate, 0)

    expect(result).toBe('2026-09-01')
  })
})