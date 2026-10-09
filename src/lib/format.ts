import type { ApartmentStatus, Point } from '../types'

export const STATUS_LABELS: Record<ApartmentStatus, string> = {
  available: 'E lirë',
  sold: 'E shitur',
  reserved: 'E rezervuar',
}

/** Polygon fill colours (rgb) per status; opacity is applied in CSS. */
export const STATUS_RGB: Record<ApartmentStatus, string> = {
  available: '46 125 86', // pine green
  sold: '168 64 46', // brick
  reserved: '201 148 52', // ochre
}

export const STATUS_BADGE: Record<ApartmentStatus, string> = {
  available: 'bg-[#2e7d56]/10 text-[#24623f] ring-[#2e7d56]/30',
  sold: 'bg-[#a8402e]/8 text-[#8c3524] ring-[#a8402e]/25',
  reserved: 'bg-[#c99434]/12 text-[#7a5612] ring-[#c99434]/35',
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
