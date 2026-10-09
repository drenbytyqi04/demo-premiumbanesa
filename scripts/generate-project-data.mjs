// Builds the site data for the real project from the studio renders in public/images/projekti/.
//
//   node scripts/generate-project-data.mjs
//
// - crops the hero (whole building) and one facade image per wing out of the renders
// - writes src/data/complex.json, buildings.json, apartments.json with polygons that match them
//
// Apartment numbers, prices and statuses are DEMO values until the studio's table arrives
// (2 wings × 10 floors × 7 apartments = 140). Polygons are approximations measured on the
// renders – refine them in #/admin/poligonet.
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const sharp = createRequire(join(ROOT, 'package.json'))('sharp')
const IMG = join(ROOT, 'public', 'images', 'projekti')
const DATA = join(ROOT, 'src', 'data')

const FLOORS = 10
const UNITS = 7 // per wing per floor
const FRONT_UNITS = { A: 4, B: 3 } // apartments visible on the street facade, the rest face the courtyard

// ------------------------------------------------------------------ crops (source: 2000px renders)
// hero: the aerial render, zoomed in on the building (crop, then upscaled to HERO_W wide)
const HERO = { file: 'pamja-ajrore-2.jpg', left: 180, top: 125, width: 1360, height: 620 }
const HERO_W = 1920
const HERO_K = HERO_W / HERO.width
const FACADE = {
  A: { file: 'pamja-ballore.jpg', left: 150, top: 240, width: 960, height: 960 },
  B: { file: 'pamja-ballore.jpg', left: 1030, top: 150, width: 740, height: 1060 },
}

async function crop(c, out, width = c.width) {
  await sharp(join(IMG, c.file))
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .resize({ width, kernel: 'lanczos3' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(join(IMG, out))
}

// ------------------------------------------------------------------ geometry (in source-render pixels)
// Hero (pamja-ajrore-2, 1732×908): roof + facades of each wing, down to the top of the shop floor.
// The divider between the two green roofs is the border between the wings.
const HERO_POLY = {
  A: [[483, 238], [555, 170], [850, 212], [770, 290], [800, 345], [805, 595], [495, 518]],
  B: [[850, 212], [920, 218], [965, 172], [1155, 190], [1222, 235], [1215, 500], [1000, 652], [805, 595], [800, 345], [770, 290]],
}

// Facade (pamja-ballore): floor boundaries at a reference x, plus the slope of the slabs.
// bounds[0] = bottom of floor 1 … bounds[10] = top of floor 10. A floor = its windows + the balcony band below them.
const WING = {
  A: { x0: 215, x1: 1000, xRef: 600, slope: -0.019, bounds: [1180, 1107, 1022, 937, 855, 772, 687, 602, 517, 432, 355] },
  // Lamela B: window rows fan out in perspective, so every line is given at two x positions
  // (in fasada-b.jpg pixels). Floor 10 is hidden behind the top-floor overhang in this render.
  B: { x0: 65, x1: 615, xL: 170, xR: 500, lines: [[995, 1000], [940, 935], [855, 830], [765, 735], [675, 635], [590, 540], [505, 440], [415, 345], [330, 245], [245, 150]] },
}

const r = (n) => Math.round(n)
const shift = (pts, c) => pts.map(([x, y]) => [r(x - c.left), r(y - c.top)])

function facadePolygon(id, floor, slot, count) {
  const w = WING[id]
  if (w.lines) {
    if (floor >= w.lines.length) return null // not visible on this render
    const y = (b, x) => { const [l, rr] = w.lines[b]; return l + ((rr - l) * (x - w.xL)) / (w.xR - w.xL) }
    const xa = w.x0 + ((w.x1 - w.x0) * slot) / count + 4
    const xb = w.x0 + ((w.x1 - w.x0) * (slot + 1)) / count - 4
    return [[xa, y(floor, xa) + 4], [xb, y(floor, xb) + 4], [xb, y(floor - 1, xb) - 4], [xa, y(floor - 1, xa) - 4]].map(([x, yy]) => [r(x), r(yy)])
  }
  const y = (b, x) => w.bounds[b] + w.slope * (x - w.xRef)
  const xa = w.x0 + ((w.x1 - w.x0) * slot) / count + 4
  const xb = w.x0 + ((w.x1 - w.x0) * (slot + 1)) / count - 4
  const top = floor, bottom = floor - 1
  return shift([[xa, y(top, xa) + 4], [xb, y(top, xb) + 4], [xb, y(bottom, xb) - 4], [xa, y(bottom, xa) - 4]], FACADE[id])
}

// ------------------------------------------------------------------ data
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

async function main() {
  mkdirSync(DATA, { recursive: true })
  await crop(HERO, 'hero.jpg', HERO_W)
  await crop(FACADE.A, 'fasada-a.jpg')
  await crop(FACADE.B, 'fasada-b.jpg')

  const complex = {
    name: 'Rezidenca Aurora',
    tagline: 'Jetesë premium në zemër të qytetit',
    location: 'Prishtinë, Kosovë',
    aerial: { image: 'images/projekti/hero.jpg', width: HERO_W, height: r(HERO.height * HERO_K) },
  }
  const buildings = [
    { id: 'A', name: 'Lamela A', description: 'Krahu me fasadë në tone të çelura, me ballkone të gjera nga rruga dhe nga oborri.' },
    { id: 'B', name: 'Lamela B', description: 'Krahu me breza të kuq, me pamje nga rruga dhe nga sheshi i brendshëm.' },
  ].map((b) => ({
    ...b,
    floors: FLOORS,
    polygon: shift(HERO_POLY[b.id], HERO).map(([x, y]) => [r(x * HERO_K), r(y * HERO_K)]),
    facades: [{ id: `${b.id}-front`, label: 'Fasada nga rruga', image: `images/projekti/fasada-${b.id.toLowerCase()}.jpg`, width: FACADE[b.id].width, height: FACADE[b.id].height }],
  }))

  const rand = mulberry32(20261009)
  const apartments = []
  for (const b of buildings) {
    for (let floor = 1; floor <= FLOORS; floor++) {
      for (let unit = 1; unit <= UNITS; unit++) {
        const x = rand()
        const status = x < 0.5 ? 'available' : x < 0.85 ? 'sold' : 'reserved'
        const rooms = 1 + Math.floor(rand() * 4)
        const [minA, maxA] = [[45, 62], [58, 85], [78, 108], [98, 130]][rooms - 1]
        const area = Math.round((minA + rand() * (maxA - minA)) * 10) / 10
        const perM2 = 1200 + rand() * 450 + (floor - 1) * 21
        const number = `${floor}${String(unit).padStart(2, '0')}`
        const poly = unit <= FRONT_UNITS[b.id] ? facadePolygon(b.id, floor, unit - 1, FRONT_UNITS[b.id]) : null
        apartments.push({
          id: `${b.id}-${number}`,
          buildingId: b.id,
          floor,
          number,
          area,
          rooms,
          price: Math.round((area * perM2) / 500) * 500,
          status,
          facadeId: poly ? `${b.id}-front` : null,
          polygon: poly,
          panoramaSceneIds: rooms === 1 ? ['living', 'kitchen', 'bathroom'] : ['living', 'bedroom', 'kitchen', 'bathroom'],
          floorPlan: `images/floorplans/plan-${rooms}.svg`,
        })
      }
    }
  }

  writeFileSync(join(DATA, 'complex.json'), JSON.stringify(complex, null, 2) + '\n')
  writeFileSync(join(DATA, 'buildings.json'), JSON.stringify(buildings, null, 2) + '\n')
  writeFileSync(join(DATA, 'apartments.json'), JSON.stringify(apartments, null, 2) + '\n')
  const n = (s) => apartments.filter((a) => a.status === s).length
  console.log(`✔ ${buildings.length} lamela, ${apartments.length} banesa (lira ${n('available')}, shitur ${n('sold')}, rezervuar ${n('reserved')})`)
}

await main()
