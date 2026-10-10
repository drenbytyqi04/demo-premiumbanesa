import { describe, expect, it } from 'vitest'
import type { Apartment } from '../types'
import { matches, parseFilters, serializeFilters } from './Filters'

const p = (s: string) => parseFilters(new URLSearchParams(s))

describe('filter URL state', () => {
  it('parses the documented format', () => {
    expect(p('dhoma=2,3&kati=3-8&min=60&max=100&lira=1')).toEqual({ rooms: [2, 3], minFloor: 3, maxFloor: 8, minArea: 60, maxArea: 100, onlyAvailable: true })
  })

  it('treats a single floor as a one-floor range', () => {
    expect(p('kati=5')).toMatchObject({ minFloor: 5, maxFloor: 5 })
  })

  it('ignores invalid values and fixes reversed ranges', () => {
    expect(p('dhoma=0,2,x,9,2&kati=8-3&min=-5&max=abc&lira=yes')).toEqual({ rooms: [2], minFloor: 3, maxFloor: 8, minArea: null, maxArea: null, onlyAvailable: false })
    expect(p('min=100&max=60')).toMatchObject({ minArea: 60, maxArea: 100 })
  })

  it('round-trips and keeps unrelated parameters', () => {
    const state = p('dhoma=3,1&kati=2-4&lira=1')
    const out = serializeFilters(state, new URLSearchParams('ndertesa=A'))
    expect(out.get('ndertesa')).toBe('A')
    expect(out.get('dhoma')).toBe('1,3')
    expect(parseFilters(out)).toEqual(state)
  })

  it('writes nothing for empty filters', () => {
    expect(serializeFilters(p('')).toString()).toBe('')
  })
})

describe('matches', () => {
  const apt = { rooms: 2, floor: 4, area: 72, status: 'available' } as Apartment
  it('applies every filter', () => {
    expect(matches(apt, p(''))).toBe(true)
    expect(matches(apt, p('dhoma=2'))).toBe(true)
    expect(matches(apt, p('dhoma=3'))).toBe(false)
    expect(matches(apt, p('kati=5-9'))).toBe(false)
    expect(matches(apt, p('min=73'))).toBe(false)
    expect(matches({ ...apt, status: 'sold' }, p('lira=1'))).toBe(false)
  })
})
