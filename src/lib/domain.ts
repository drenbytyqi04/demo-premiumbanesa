/**
 * Pure domain helpers (unit-tested in src/lib/domain.test.ts).
 *
 * Room mapping: `Apartment.rooms` is the number of bedrooms. The interface shows it in the
 * local convention "N+1" = N bedrooms + 1 living room with kitchen, so 1 → "1+1" … 4 → "4+1".
 */
import type { Apartment, ApartmentStatus } from '../types'

export const ROOM_TYPES = [1, 2, 3, 4] as const

export const roomType = (rooms: number) => `${rooms}+1`

/** €/m², or null when the price or area is missing/zero (never NaN or Infinity). */
export function pricePerM2(a: Pick<Apartment, 'price' | 'area'>): number | null {
  if (!(a.price > 0) || !(a.area > 0)) return null
  return Math.round(a.price / a.area)
}

export function statusCounts(list: Pick<Apartment, 'status'>[]): Record<ApartmentStatus, number> {
  const c = { available: 0, reserved: 0, sold: 0 }
  for (const a of list) c[a.status]++
  return c
}

/** Lowest positive price among available apartments, or null when there is none. */
export function startingPrice(list: Pick<Apartment, 'price' | 'status'>[]): number | null {
  const prices = list.filter((a) => a.status === 'available' && a.price > 0).map((a) => a.price)
  return prices.length ? Math.min(...prices) : null
}

/** [min, max] of a numeric field, or null for an empty list. */
export function range(values: number[]): [number, number] | null {
  return values.length ? [Math.min(...values), Math.max(...values)] : null
}

export const percentTotal = (steps: { percent: number }[]) => steps.reduce((t, s) => t + s.percent, 0)

/** Share of construction done (0–100), or null when no phase has a confirmed status. */
export function progressPercent(phases: { status: 'done' | 'current' | 'next' | null }[]): number | null {
  if (!phases.length || phases.every((p) => p.status === null)) return null
  const done = phases.filter((p) => p.status === 'done').length
  const current = phases.some((p) => p.status === 'current') ? 0.5 : 0
  return ((done + current) / phases.length) * 100
}
