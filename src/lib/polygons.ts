/**
 * Polygon geometry + validation for the overlay editor.
 *
 * Coordinate system: points are stored as [x, y] in the pixel space of the image they were
 * drawn on, i.e. 0 ≤ x ≤ width and 0 ≤ y ≤ height of the `width`/`height` saved next to them
 * (the SVG overlay uses the same numbers as its viewBox, so the shapes scale with the image).
 * `toNormalized` / `fromNormalized` convert to and from the 0–1 range, e.g. to move polygons
 * to a re-exported render of the same view at another resolution.
 */
import { z } from 'zod'
import type { Point, PolygonExport } from '../types'

export const toNormalized = (pts: Point[], width: number, height: number): Point[] => pts.map(([x, y]) => [x / width, y / height])
export const fromNormalized = (pts: Point[], width: number, height: number): Point[] => pts.map(([x, y]) => [x * width, y * height])

/** Pointer position (client px) → image coordinates, whatever the zoom, pan or element size. */
export function clientToImage(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }, width: number, height: number): Point {
  return [((clientX - rect.left) / rect.width) * width, ((clientY - rect.top) / rect.height) * height]
}

export function area(pts: Point[]): number {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    s += x1 * y2 - x2 * y1
  }
  return Math.abs(s) / 2
}

export function pointInPolygon([x, y]: Point, pts: Point[]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point) {
  const o = (p: Point, q: Point, r: Point) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]))
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0
}

/** True when two polygons share interior area (edges crossing, or one inside the other). */
export function polygonsOverlap(p: Point[], q: Point[]): boolean {
  for (let i = 0; i < p.length; i++)
    for (let j = 0; j < q.length; j++) if (segmentsCross(p[i], p[(i + 1) % p.length], q[j], q[(j + 1) % q.length])) return true
  const mid = (pts: Point[]): Point => [pts.reduce((s, v) => s + v[0], 0) / pts.length, pts.reduce((s, v) => s + v[1], 0) / pts.length]
  return pointInPolygon(mid(p), q) || pointInPolygon(mid(q), p)
}

function selfIntersects(pts: Point[]) {
  const n = pts.length
  for (let i = 0; i < n; i++)
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue // neighbouring edges share a vertex
      if (segmentsCross(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return true
    }
  return false
}

export interface PolygonIssue {
  level: 'error' | 'warning'
  id?: string
  message: string
}

/**
 * Errors block publishing (broken geometry, duplicate or unknown ids);
 * warnings need confirmation (overlaps, apartments without a polygon).
 */
export function validatePolygons(
  polys: { id: string; points: Point[] }[],
  { width, height, expectedIds }: { width: number; height: number; expectedIds?: string[] },
): PolygonIssue[] {
  const issues: PolygonIssue[] = []
  const seen = new Set<string>()
  const tol = 0.5
  for (const p of polys) {
    const id = p.id.trim()
    if (!id) issues.push({ level: 'error', message: 'Një poligon nuk ka ID.' })
    else if (seen.has(id)) issues.push({ level: 'error', id, message: `ID ${id} përdoret më shumë se një herë.` })
    seen.add(id)
    if (expectedIds && id && !expectedIds.includes(id)) issues.push({ level: 'error', id, message: `ID ${id} nuk ekziston në të dhëna.` })
    if (p.points.length < 3) {
      issues.push({ level: 'error', id, message: `${id || 'Poligoni'} ka më pak se 3 pika.` })
      continue
    }
    if (p.points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
      issues.push({ level: 'error', id, message: `${id} ka koordinata të pavlefshme.` })
      continue
    }
    if (p.points.some(([x, y]) => x < -tol || y < -tol || x > width + tol || y > height + tol))
      issues.push({ level: 'error', id, message: `${id} del jashtë imazhit.` })
    if (area(p.points) < 4) issues.push({ level: 'error', id, message: `${id} nuk ka sipërfaqe (pikat janë në një vijë).` })
    else if (selfIntersects(p.points)) issues.push({ level: 'error', id, message: `${id} i pret vetes brinjët.` })
  }
  const valid = polys.filter((p) => p.points.length >= 3 && p.points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)))
  for (let i = 0; i < valid.length; i++)
    for (let j = i + 1; j < valid.length; j++)
      if (polygonsOverlap(valid[i].points, valid[j].points))
        issues.push({ level: 'warning', id: valid[i].id, message: `${valid[i].id} mbivendoset me ${valid[j].id}.` })
  if (expectedIds) {
    const missing = expectedIds.filter((id) => !seen.has(id))
    if (missing.length) issues.push({ level: 'warning', message: `${missing.length} pa poligon: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}` })
  }
  return issues
}

const point = z.tuple([z.coerce.number(), z.coerce.number()])
const poly = z.object({ id: z.coerce.string(), points: z.array(point) })
const target = z.discriminatedUnion('type', [
  z.object({ type: z.literal('aerial') }),
  z.object({ type: z.literal('facade'), buildingId: z.string(), facadeId: z.string() }),
  z.object({ type: z.literal('custom') }),
])
export const polygonExportSchema = z.union([
  z.object({ version: z.literal(1), target, image: z.string().min(1), width: z.number().positive(), height: z.number().positive(), polygons: z.array(poly) }),
  z.array(poly),
])

/** Parses an editor JSON export (or a bare polygon list); throws a readable error. */
export function parsePolygonImport(text: string): PolygonExport | { id: string; points: Point[] }[] {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('teksti nuk është JSON')
  }
  const r = polygonExportSchema.safeParse(raw)
  if (!r.success) throw new Error(z.prettifyError(r.error).split('\n').slice(0, 3).join(' '))
  return r.data as PolygonExport | { id: string; points: Point[] }[]
}
