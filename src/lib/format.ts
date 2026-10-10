import type { ApartmentStatus, Point } from '../types'

export const STATUS_LABELS: Record<ApartmentStatus, string> = {
  available: 'E lirë',
  sold: 'E shitur',
  reserved: 'E rezervuar',
}

/** Polygon fill colours (rgb) per status; opacity is applied in CSS. */
export const STATUS_RGB: Record<ApartmentStatus, string> = {
  available: '47 107 79', // #2F6B4F pine green
  sold: '163 61 50', // #A33D32 brick
  reserved: '184 134 43', // #B8862B ochre
}

export const STATUS_BADGE: Record<ApartmentStatus, string> = {
  available: 'bg-available/10 text-available ring-available/30',
  sold: 'stack-sold bg-sold/8 text-sold ring-sold/30',
  reserved: 'bg-reserved/12 text-reserved-ink ring-reserved/40',
}

const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

export const formatPrice = (v: number) => eur.format(v)
export const formatArea = (v: number) => `${num.format(v)} m²`
export const formatNumber = (v: number) => num.format(v)

export const roomsLabel = (n: number) => (n === 1 ? '1 dhomë' : `${n} dhoma`)

/** Resolve a /public asset path so it works under any base URL. */
export const asset = (path: string) =>
  /^(https?:|data:|blob:)/.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export const toPoints = (pts: Point[]) => pts.map(([x, y]) => `${x},${y}`).join(' ')

export function centroid(pts: Point[]): Point {
  const n = pts.length || 1
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n]
}

/** Static Tailwind classes for "one column per building" grids (dynamic class names would be purged). */
export const MD_COLS: Record<number, string> = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' }
