import { describe, expect, it } from 'vitest'
import { percentTotal, pricePerM2, progressPercent, range, roomType, startingPrice, statusCounts } from './domain'

describe('domain helpers', () => {
  it('maps bedroom counts to N+1 labels', () => {
    expect([1, 2, 3, 4].map(roomType)).toEqual(['1+1', '2+1', '3+1', '4+1'])
  })

  it('computes price per m² and handles missing values', () => {
    expect(pricePerM2({ price: 100_000, area: 80 })).toBe(1250)
    expect(pricePerM2({ price: 0, area: 80 })).toBeNull()
    expect(pricePerM2({ price: 100_000, area: 0 })).toBeNull()
    expect(pricePerM2({ price: NaN, area: 50 })).toBeNull()
  })

  it('counts statuses', () => {
    expect(statusCounts([{ status: 'available' }, { status: 'sold' }, { status: 'available' }])).toEqual({ available: 2, reserved: 0, sold: 1 })
  })

  it('never derives a starting price from an empty or unavailable set', () => {
    expect(startingPrice([])).toBeNull()
    expect(startingPrice([{ status: 'sold', price: 90_000 }])).toBeNull()
    expect(startingPrice([{ status: 'available', price: 0 }])).toBeNull()
    expect(startingPrice([{ status: 'available', price: 120_000 }, { status: 'available', price: 95_000 }, { status: 'reserved', price: 50_000 }])).toBe(95_000)
  })

  it('range of an empty list is null', () => {
    expect(range([])).toBeNull()
    expect(range([3, 1, 2])).toEqual([1, 3])
  })

  it('sums payment percentages', () => {
    expect(percentTotal([{ percent: 10 }, { percent: 30 }, { percent: 40 }, { percent: 20 }])).toBe(100)
  })

  it('progress is unknown until a phase status is configured', () => {
    expect(progressPercent([{ status: null }, { status: null }])).toBeNull()
    expect(progressPercent([{ status: 'done' }, { status: 'current' }, { status: 'next' }, { status: 'next' }])).toBe(37.5)
  })
})
