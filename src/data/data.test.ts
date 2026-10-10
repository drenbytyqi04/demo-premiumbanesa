import { describe, expect, it } from 'vitest'
import type { Apartment, Building } from '../types'
import apartmentsJson from './apartments.json'
import buildingsJson from './buildings.json'
import raw from './site.json'
import { parseSite, siteSchema } from './site'

const apartments = apartmentsJson as Apartment[]
const buildings = buildingsJson as Building[]

describe('demo inventory', () => {
  it('has exactly 140 apartments with unique ids', () => {
    expect(apartments).toHaveLength(140)
    expect(new Set(apartments.map((a) => a.id)).size).toBe(140)
  })

  it('has 70 apartments per wing, 7 on each of 10 floors', () => {
    for (const b of buildings) {
      const list = apartments.filter((a) => a.buildingId === b.id)
      expect(list).toHaveLength(70)
      for (let floor = 1; floor <= 10; floor++) expect(list.filter((a) => a.floor === floor)).toHaveLength(7)
    }
  })

  it('apartment numbers are unique per wing and floor', () => {
    const keys = apartments.map((a) => `${a.buildingId}/${a.floor}/${a.number}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('uses valid statuses, room types 1–4 and positive areas/prices', () => {
    for (const a of apartments) {
      expect(['available', 'reserved', 'sold']).toContain(a.status)
      expect(a.rooms).toBeGreaterThanOrEqual(1)
      expect(a.rooms).toBeLessThanOrEqual(4)
      expect(a.area).toBeGreaterThan(0)
      expect(a.price).toBeGreaterThanOrEqual(0)
    }
  })

  it('references existing wings and facades', () => {
    const facades = new Set(buildings.flatMap((b) => b.facades.map((f) => f.id)))
    for (const a of apartments) {
      expect(buildings.some((b) => b.id === a.buildingId)).toBe(true)
      if (a.facadeId) expect(facades.has(a.facadeId)).toBe(true)
    }
  })
})

describe('site.json', () => {
  it('is valid', () => {
    expect(() => parseSite(raw)).not.toThrow()
  })

  it('payment plan totals 100%', () => {
    const site = parseSite(raw)
    expect(site.payment.steps.reduce((t, s) => t + s.percent, 0)).toBe(100)
    const broken = structuredClone(raw) as { payment: { steps: { percent: number }[] } }
    broken.payment.steps[0].percent = 15
    expect(siteSchema.safeParse(broken).success).toBe(false)
  })

  it('does not present unconfirmed facts', () => {
    const site = parseSite(raw)
    // these stay null until the investor confirms them (UI shows "Të dhënat së shpejti")
    expect(site.facts).toEqual({ delivery: null, parking: null, courtyardArea: null })
    expect(site.contact.phone).toBeNull()
    expect(site.location.address).toBeNull()
  })
})
