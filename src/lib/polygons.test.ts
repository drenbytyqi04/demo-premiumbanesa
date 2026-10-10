import { describe, expect, it } from 'vitest'
import type { Point } from '../types'
import { clientToImage, fromNormalized, parsePolygonImport, polygonsOverlap, toNormalized, validatePolygons } from './polygons'

const sq = (x: number, y: number, s = 10): Point[] => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]]
const opts = { width: 100, height: 100 }

describe('coordinates', () => {
  it('normalizes and back', () => {
    const pts: Point[] = [[50, 25], [100, 100]]
    expect(toNormalized(pts, 200, 100)).toEqual([[0.25, 0.25], [0.5, 1]])
    expect(fromNormalized(toNormalized(pts, 200, 100), 200, 100)).toEqual(pts)
  })

  it('maps pointer positions through zoom/scale', () => {
    // a 1000×500 image shown at 2× zoom (2000×1000 px), scrolled so it starts at -300,-100
    expect(clientToImage(700, 400, { left: -300, top: -100, width: 2000, height: 1000 }, 1000, 500)).toEqual([500, 250])
  })
})

describe('validatePolygons', () => {
  it('accepts clean geometry', () => {
    expect(validatePolygons([{ id: 'A-101', points: sq(0, 0) }, { id: 'A-102', points: sq(20, 0) }], { ...opts, expectedIds: ['A-101', 'A-102'] })).toEqual([])
  })

  it('rejects too few points, non-finite and out-of-bounds coordinates', () => {
    const issues = validatePolygons(
      [
        { id: 'a', points: [[0, 0], [5, 5]] },
        { id: 'b', points: [[0, 0], [NaN, 1], [3, 3]] },
        { id: 'c', points: sq(95, 95) },
      ],
      opts,
    )
    expect(issues.filter((i) => i.level === 'error').map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('rejects zero-area and self-intersecting shapes', () => {
    const line: Point[] = [[0, 0], [5, 5], [10, 10]]
    const bowtie: Point[] = [[0, 0], [10, 10], [10, 0], [0, 10]]
    const ids = validatePolygons([{ id: 'line', points: line }, { id: 'bow', points: bowtie }], opts).map((i) => i.id)
    expect(ids).toContain('line')
    expect(ids).toContain('bow')
  })

  it('rejects duplicate and unknown ids, warns about overlaps and missing apartments', () => {
    const issues = validatePolygons(
      [
        { id: 'A-1', points: sq(0, 0) },
        { id: 'A-1', points: sq(50, 50) },
        { id: 'Z-9', points: sq(5, 5) },
      ],
      { ...opts, expectedIds: ['A-1', 'A-2'] },
    )
    expect(issues.some((i) => i.level === 'error' && /më shumë se një herë/.test(i.message))).toBe(true)
    expect(issues.some((i) => i.level === 'error' && i.id === 'Z-9')).toBe(true)
    expect(issues.some((i) => i.level === 'warning' && /mbivendoset/.test(i.message))).toBe(true)
    expect(issues.some((i) => i.level === 'warning' && /A-2/.test(i.message))).toBe(true)
  })

  it('detects containment as overlap', () => {
    expect(polygonsOverlap(sq(0, 0, 50), sq(10, 10, 5))).toBe(true)
    expect(polygonsOverlap(sq(0, 0), sq(10, 0))).toBe(false) // touching edge only
  })
})

describe('parsePolygonImport', () => {
  it('accepts an editor export and a bare list', () => {
    const exp = { version: 1, target: { type: 'aerial' }, image: 'x.jpg', width: 10, height: 10, polygons: [{ id: 'A', points: [[1, 1], [2, 1], [2, 2]] }] }
    expect(parsePolygonImport(JSON.stringify(exp))).toMatchObject({ image: 'x.jpg' })
    expect(parsePolygonImport(JSON.stringify(exp.polygons))).toHaveLength(1)
  })

  it('rejects invalid JSON and wrong shapes', () => {
    expect(() => parsePolygonImport('{')).toThrow(/JSON/)
    expect(() => parsePolygonImport('{"polygons": 5}')).toThrow()
  })
})
