// Generates placeholder images (aerial, facades, floor plans) and matching mock data.
//
//   npm run generate:images   → public/images/*  (placeholder JPGs/SVGs)
//   npm run generate:data     → src/data/*.json  (buildings, apartments with polygons)
//
// ⚠ generate:data OVERWRITES src/data/buildings.json + apartments.json, including any
//   polygons you applied from the editor. Only run it to reset the demo.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const ROOT = join(import.meta.dirname, '..')
const IMG = join(ROOT, 'public', 'images')
const DATA = join(ROOT, 'src', 'data')
const mode = process.argv[2] ?? 'all'

const FLOORS = 8
const UNITS_PER_FLOOR = 4

// ---------------------------------------------------------------- aerial (isometric)
const AERIAL = { width: 1920, height: 1080 }
const ISO = { ox: 940, oy: 400, s: 6.6 }
const C30 = Math.cos(Math.PI / 6)
const iso = (x, y, z) => [
  Math.round(ISO.ox + (x - y) * C30 * ISO.s),
  Math.round(ISO.oy + (x + y) * 0.5 * ISO.s - z * ISO.s),
]
const FLOOR_H = 3.3
const BASE_H = 4.4
const BLD_H = BASE_H + FLOORS * FLOOR_H + 1.2

const BUILDINGS = [
  { id: 'A', x: -52, y: 4, w: 58, d: 20, tint: ['#efe6d8', '#d8ccb8', '#f7f1e7'] },
  { id: 'B', x: 28, y: -34, w: 20, d: 56, tint: ['#e4e7ec', '#c9ced7', '#f3f5f8'] },
  { id: 'C', x: 16, y: 46, w: 52, d: 20, tint: ['#e9d5c8', '#cfb4a3', '#f5e9e1'] },
]

const pts = (arr) => arr.map((p) => p.join(',')).join(' ')

function prism(b) {
  const { x, y, w, d } = b
  const H = BLD_H
  const T1 = iso(x, y, H), T2 = iso(x + w, y, H), T3 = iso(x + w, y + d, H), T4 = iso(x, y + d, H)
  const B2 = iso(x + w, y, 0), B3 = iso(x + w, y + d, 0), B4 = iso(x, y + d, 0)
  return { top: [T1, T2, T3, T4], right: [T2, T3, B3, B2], left: [T4, T3, B3, B4], outline: [T1, T2, B2, B3, B4, T4] }
}

function faceWindows(b, face) {
  // windows on the left (y = y+d) or right (x = x+w) face
  const out = []
  const len = face === 'left' ? b.w : b.d
  const bays = Math.round(len / 4.2)
  const bw = len / bays
  for (let f = 0; f < FLOORS; f++) {
    const z0 = BASE_H + f * FLOOR_H + 0.7
    const z1 = z0 + FLOOR_H - 1.3
    for (let i = 0; i < bays; i++) {
      const a = i * bw + 0.6
      const c = (i + 1) * bw - 0.6
      const P = (t, z) => (face === 'left' ? iso(b.x + t, b.y + b.d, z) : iso(b.x + b.w, b.y + t, z))
      out.push(`<polygon points="${pts([P(a, z1), P(c, z1), P(c, z0), P(a, z0)])}" fill="url(#glass)" opacity="0.9"/>`)
    }
    // slab line
    const zS = BASE_H + f * FLOOR_H
    const P = (t, z) => (face === 'left' ? iso(b.x + t, b.y + b.d, z) : iso(b.x + b.w, b.y + t, z))
    out.push(`<polyline points="${pts([P(0, zS), P(len, zS)])}" stroke="#ffffff" stroke-opacity="0.7" stroke-width="3" fill="none"/>`)
  }
  // ground floor glazing
  const P = (t, z) => (face === 'left' ? iso(b.x + t, b.y + b.d, z) : iso(b.x + b.w, b.y + t, z))
  out.push(`<polygon points="${pts([P(1, BASE_H - 0.6), P(len - 1, BASE_H - 0.6), P(len - 1, 0.2), P(1, 0.2)])}" fill="#3b4b5e" opacity="0.85"/>`)
  return out.join('')
}

function tree(x, y, r = 2.2) {
  const [cx, cy] = iso(x, y, 0)
  const R = r * ISO.s
  return `<ellipse cx="${cx + 6}" cy="${cy + 4}" rx="${R}" ry="${R * 0.55}" fill="#000" opacity="0.18"/>
  <circle cx="${cx}" cy="${cy - R * 0.8}" r="${R}" fill="#5f8f4e"/><circle cx="${cx - R * 0.3}" cy="${cy - R * 1.05}" r="${R * 0.55}" fill="#7aab62"/>`
}

function aerialSvg() {
  const g = (x, y) => iso(x, y, 0)
  const ground = [g(-90, -60), g(95, -60), g(95, 90), g(-90, 90)]
  const plaza = [g(-60, -40), g(80, -40), g(80, 75), g(-60, 75)]
  const road1 = [g(-90, 80), g(95, 80), g(95, 90), g(-90, 90)]
  const road2 = [g(85, -60), g(95, -60), g(95, 90), g(85, 90)]
  const trees = []
  for (let t = -55; t < 80; t += 9) trees.push(tree(t, 72), tree(78, t))
  for (const [x, y] of [[-20, -20], [-40, -25], [0, 30], [8, 36], [-10, 40], [-30, 55], [60, -20], [60, 20], [-5, -10]]) trees.push(tree(x, y, 2.6))
  const bld = BUILDINGS.map((b) => {
    const p = prism(b)
    const [tx, ty] = iso(b.x + b.w / 2, b.y + b.d / 2, BLD_H)
    return `<g>
      <polygon points="${pts(p.outline.map(([x, y]) => [x + 40, y + 26]))}" fill="#000" opacity="0.18" filter="url(#blur)"/>
      <polygon points="${pts(p.left)}" fill="${b.tint[0]}"/>
      <polygon points="${pts(p.right)}" fill="${b.tint[1]}"/>
      <polygon points="${pts(p.top)}" fill="${b.tint[2]}"/>
      ${faceWindows(b, 'left')}${faceWindows(b, 'right')}
      <text x="${tx}" y="${ty + 10}" text-anchor="middle" font-family="DejaVu Sans, Arial" font-weight="bold" font-size="46" fill="#1b2a41" opacity="0.55">${b.id}</text>
    </g>`
  })
  // painter's order: back to front (by x+y)
  const order = BUILDINGS.map((b, i) => [b.x + b.y + (b.w + b.d) / 2, i]).sort((a, b) => a[0] - b[0]).map(([, i]) => bld[i])
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${AERIAL.width}" height="${AERIAL.height}" viewBox="0 0 ${AERIAL.width} ${AERIAL.height}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc3e6"/><stop offset="1" stop-color="#e7eef5"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d8fb3"/><stop offset="1" stop-color="#2d4663"/></linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#sky)"/>
  <polygon points="${pts(ground)}" fill="#8fb176"/>
  <polygon points="${pts(plaza)}" fill="#d9d4c7"/>
  <polygon points="${pts(road1)}" fill="#5b6068"/><polygon points="${pts(road2)}" fill="#5b6068"/>
  ${trees.join('')}
  ${order.join('')}
  <rect x="24" y="${AERIAL.height - 70}" width="760" height="46" rx="10" fill="#0f1b2d" opacity="0.8"/>
  <text x="44" y="${AERIAL.height - 39}" font-family="DejaVu Sans, Arial" font-size="20" fill="#fff">PLACEHOLDER · zëvendësoje: public/images/aerial.jpg</text>
</svg>`
}

// ---------------------------------------------------------------- facades (front elevation)
const FACADE = { width: 1200, height: 1500 }
const FX0 = 150, FX1 = 1050, GROUND_TOP = 1300, FLOOR_PX = 130
const floorTop = (f) => GROUND_TOP - f * FLOOR_PX // f = 1..8
const BAY_W = (FX1 - FX0) / 4

const FACADES = [
  { building: 'A', id: 'A-front', label: 'Fasada jugore', file: 'facade-a.jpg', units: [[1, 0, 2], [2, 2, 4]], tint: '#efe6d8' },
  { building: 'A', id: 'A-back', label: 'Fasada veriore', file: 'facade-a-back.jpg', units: [[3, 0, 2], [4, 2, 4]], tint: '#e4dac9' },
  { building: 'B', id: 'B-front', label: 'Fasada kryesore', file: 'facade-b.jpg', units: [[1, 0, 1], [2, 1, 2], [3, 2, 3], [4, 3, 4]], tint: '#e4e7ec' },
  { building: 'C', id: 'C-front', label: 'Fasada kryesore', file: 'facade-c.jpg', units: [[1, 0, 1], [2, 1, 2], [3, 2, 3], [4, 3, 4]], tint: '#e9d5c8' },
]

/** polygon of unit spanning bays [b0, b1) on floor f */
function unitPolygon(f, b0, b1) {
  const top = floorTop(f) + 6, bottom = floorTop(f - 1) - 4
  const l = FX0 + b0 * BAY_W + 6, r = FX0 + b1 * BAY_W - 6
  return [[l, top], [r, top], [r, bottom], [l, bottom]]
}

function facadeSvg(fc) {
  const parts = []
  for (let f = 1; f <= FLOORS; f++) {
    const y = floorTop(f)
    parts.push(`<rect x="${FX0 - 12}" y="${y + FLOOR_PX - 10}" width="${FX1 - FX0 + 24}" height="10" fill="#ffffff" opacity="0.85"/>`)
    for (let b = 0; b < 4; b++) {
      const x = FX0 + b * BAY_W
      parts.push(`<rect x="${x + 22}" y="${y + 18}" width="${BAY_W * 0.42}" height="${FLOOR_PX - 40}" rx="3" fill="url(#glass)"/>`)
      parts.push(`<rect x="${x + BAY_W * 0.54}" y="${y + 18}" width="${BAY_W * 0.36}" height="${FLOOR_PX - 64}" rx="3" fill="url(#glass)"/>`)
      // balcony railing
      parts.push(`<rect x="${x + 14}" y="${y + FLOOR_PX - 52}" width="${BAY_W * 0.5}" height="36" fill="#ffffff" opacity="0.35" stroke="#ffffff" stroke-opacity="0.8"/>`)
    }
    parts.push(`<text x="${FX1 + 26}" y="${y + FLOOR_PX / 2 + 8}" font-family="DejaVu Sans, Arial" font-size="22" fill="#1b2a41" opacity="0.5">${f}</text>`)
  }
  // bay dividers
  for (let b = 1; b < 4; b++) parts.push(`<rect x="${FX0 + b * BAY_W - 3}" y="${floorTop(FLOORS)}" width="6" height="${GROUND_TOP - floorTop(FLOORS)}" fill="#000" opacity="0.06"/>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FACADE.width}" height="${FACADE.height}" viewBox="0 0 ${FACADE.width} ${FACADE.height}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db6de"/><stop offset="1" stop-color="#eaf1f7"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86a6c6"/><stop offset="0.5" stop-color="#3d5a7a"/><stop offset="1" stop-color="#253c57"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#sky)"/>
  <rect x="0" y="1420" width="${FACADE.width}" height="80" fill="#7c9a66"/>
  <rect x="0" y="1410" width="${FACADE.width}" height="14" fill="#c9c3b6"/>
  <rect x="${FX0 - 20}" y="${floorTop(FLOORS) - 40}" width="${FX1 - FX0 + 40}" height="40" fill="#d8d2c6"/>
  <rect x="${FX0}" y="${floorTop(FLOORS)}" width="${FX1 - FX0}" height="${GROUND_TOP - floorTop(FLOORS)}" fill="${fc.tint}"/>
  <rect x="${FX0}" y="${GROUND_TOP}" width="${FX1 - FX0}" height="${1410 - GROUND_TOP}" fill="#34465b"/>
  <rect x="${FX0 + 380}" y="${GROUND_TOP + 20}" width="140" height="90" fill="#c8a867" opacity="0.8"/>
  ${parts.join('')}
  <text x="${FX0}" y="${floorTop(FLOORS) - 60}" font-family="DejaVu Sans, Arial" font-weight="bold" font-size="40" fill="#1b2a41" opacity="0.6">Ndërtesa ${fc.building} · ${fc.label}</text>
  <rect x="20" y="${FACADE.height - 58}" width="760" height="40" rx="8" fill="#0f1b2d" opacity="0.8"/>
  <text x="36" y="${FACADE.height - 31}" font-family="DejaVu Sans, Arial" font-size="18" fill="#fff">PLACEHOLDER · zëvendësoje: public/images/${fc.file}</text>
</svg>`
}

// ---------------------------------------------------------------- floor plans (SVG)
function floorPlanSvg(rooms) {
  const W = 800, H = 560
  const labels = {
    1: [['Dhoma ditore + kuzhina', 40, 40, 480, 480], ['Dhoma e gjumit', 520, 40, 240, 300], ['Banjo', 520, 340, 240, 180]],
    2: [['Dhoma ditore', 40, 40, 400, 300], ['Kuzhina', 40, 340, 250, 180], ['Banjo', 290, 340, 150, 180], ['Dhoma e gjumit', 440, 40, 320, 480]],
    3: [['Dhoma ditore', 40, 40, 360, 280], ['Kuzhina', 40, 320, 220, 200], ['Banjo', 260, 320, 140, 200], ['Dhoma e gjumit 1', 400, 40, 360, 240], ['Dhoma e gjumit 2', 400, 280, 360, 240]],
    4: [['Dhoma ditore', 40, 40, 340, 260], ['Kuzhina', 40, 300, 200, 220], ['Banjo', 240, 300, 140, 220], ['Dhoma 1', 380, 40, 190, 240], ['Dhoma 2', 570, 40, 190, 240], ['Dhoma 3', 380, 280, 380, 240]],
  }[rooms]
  const r = labels.map(([t, x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f8fafc" stroke="#1b2a41" stroke-width="6"/>
    <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#475569">${t}</text>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${r.join('\n  ')}
  <text x="${W - 20}" y="${H - 12}" text-anchor="end" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Plan ilustrues (placeholder) · ${rooms} dhoma</text>
</svg>`
}

// ---------------------------------------------------------------- data
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateData() {
  const rand = mulberry32(20260930)
  const complex = {
    name: 'Rezidenca Aurora',
    tagline: 'Jetesë premium në zemër të qytetit',
    location: 'Prishtinë, Kosovë',
    aerial: { image: 'images/aerial.jpg', ...AERIAL },
  }
  const meta = {
    A: { name: 'Ndërtesa A', description: 'Pamje nga parku, apartamente me dy fasada dhe ballkone të gjera.' },
    B: { name: 'Ndërtesa B', description: 'Në qendër të kompleksit, afër hyrjes kryesore dhe sheshit.' },
    C: { name: 'Ndërtesa C', description: 'Kati përdhes me lokale, pamje nga rruga kryesore dhe malet.' },
  }
  const buildings = BUILDINGS.map((b) => ({
    id: b.id,
    name: meta[b.id].name,
    description: meta[b.id].description,
    floors: FLOORS,
    polygon: prism(b).outline,
    facades: FACADES.filter((f) => f.building === b.id).map((f) => ({
      id: f.id, label: f.label, image: `images/${f.file}`, ...FACADE,
    })),
  }))

  const apartments = []
  for (const b of BUILDINGS) {
    for (let floor = 1; floor <= FLOORS; floor++) {
      for (let unit = 1; unit <= UNITS_PER_FLOOR; unit++) {
        const r = rand()
        const status = r < 0.5 ? 'available' : r < 0.85 ? 'sold' : 'reserved'
        const rooms = 1 + Math.floor(rand() * 4)
        const [minA, maxA] = [[45, 62], [58, 85], [78, 108], [98, 130]][rooms - 1]
        const area = Math.round((minA + rand() * (maxA - minA)) * 10) / 10
        const perM2 = 1200 + rand() * 450 + (floor - 1) * 21
        const price = Math.round((area * perM2) / 500) * 500
        const fc = FACADES.find((f) => f.building === b.id && f.units.some(([u]) => u === unit))
        const [, b0, b1] = fc.units.find(([u]) => u === unit)
        const scenes = rooms === 1 ? ['living', 'kitchen', 'bathroom'] : ['living', 'bedroom', 'kitchen', 'bathroom']
        apartments.push({
          id: `${b.id}-${floor}${String(unit).padStart(2, '0')}`,
          buildingId: b.id,
          floor,
          number: `${floor}${String(unit).padStart(2, '0')}`,
          area,
          rooms,
          price,
          status,
          facadeId: fc.id,
          polygon: unitPolygon(floor, b0, b1),
          panoramaSceneIds: scenes,
          floorPlan: `images/floorplans/plan-${rooms}.svg`,
        })
      }
    }
  }
  mkdirSync(DATA, { recursive: true })
  writeFileSync(join(DATA, 'complex.json'), JSON.stringify(complex, null, 2) + '\n')
  writeFileSync(join(DATA, 'buildings.json'), JSON.stringify(buildings, null, 2) + '\n')
  writeFileSync(join(DATA, 'apartments.json'), JSON.stringify(apartments, null, 2) + '\n')
  const count = (s) => apartments.filter((a) => a.status === s).length
  console.log(`✔ data: ${buildings.length} buildings, ${apartments.length} apartments (lira ${count('available')}, shitur ${count('sold')}, rezervuar ${count('reserved')})`)
}

async function generateImages() {
  mkdirSync(join(IMG, 'floorplans'), { recursive: true })
  await sharp(Buffer.from(aerialSvg())).jpeg({ quality: 88 }).toFile(join(IMG, 'aerial.jpg'))
  console.log('✔ images/aerial.jpg')
  for (const fc of FACADES) {
    await sharp(Buffer.from(facadeSvg(fc))).jpeg({ quality: 88 }).toFile(join(IMG, fc.file))
    console.log(`✔ images/${fc.file}`)
  }
  for (let r = 1; r <= 4; r++) writeFileSync(join(IMG, 'floorplans', `plan-${r}.svg`), floorPlanSvg(r))
  console.log('✔ images/floorplans/plan-{1..4}.svg')
}

if (mode === 'all' || mode === 'images') await generateImages()
if (mode === 'all' || mode === 'data') generateData()
