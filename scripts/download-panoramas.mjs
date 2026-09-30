// Downloads CC0 indoor equirectangular panoramas from Poly Haven (https://polyhaven.com)
// and saves them as ~4K JPGs in public/panoramas/{living,bedroom,kitchen,bathroom}.jpg
//
// Usage:
//   npm run panoramas                         # auto-pick by keywords
//   npm run panoramas -- living=lebombo bedroom=hotel_room
//
// Uses the public API: https://api.polyhaven.com/assets?t=hdris&c=indoor
// Poly Haven assets are CC0 — no attribution required (but appreciated).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const OUT = join(import.meta.dirname, '..', 'public', 'panoramas')
const API = 'https://api.polyhaven.com'
const HEADERS = { 'User-Agent': 'demo-premiumbanesa/1.0 (demo real-estate site)' }
const TARGET_WIDTH = 4096

const SCENES = {
  living: ['living', 'lounge', 'lebombo', 'apartment', 'room'],
  bedroom: ['bedroom', 'hotel_room', 'bed', 'room'],
  kitchen: ['kitchen', 'dining', 'interior'],
  bathroom: ['bathroom', 'bath', 'toilet', 'small'],
}

const overrides = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.includes('=')).map((a) => a.split('=')),
)

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

const assets = await getJson(`${API}/assets?t=hdris&c=indoor`)
const ids = Object.keys(assets)
console.log(`Found ${ids.length} indoor HDRIs on Poly Haven`)

const used = new Set()
mkdirSync(OUT, { recursive: true })

for (const [scene, keywords] of Object.entries(SCENES)) {
  let id = overrides[scene]
  if (!id) {
    for (const kw of keywords) {
      id = ids.find((i) => !used.has(i) && (i.includes(kw) || assets[i].name?.toLowerCase().includes(kw)))
      if (id) break
    }
    id ??= ids.find((i) => !used.has(i))
  }
  used.add(id)

  const files = await getJson(`${API}/files/${id}`)
  const url = files.tonemapped?.url
  if (!url) {
    console.warn(`✖ ${id}: no tonemapped JPG available, skipping ${scene}`)
    continue
  }
  process.stdout.write(`↓ ${scene.padEnd(8)} ← ${id} ... `)
  const res = await fetch(url, { headers: HEADERS })
  const input = Buffer.from(await res.arrayBuffer())
  const jpg = await sharp(input, { limitInputPixels: false })
    .resize(TARGET_WIDTH, TARGET_WIDTH / 2)
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
  writeFileSync(join(OUT, `${scene}.jpg`), jpg)
  console.log(`ok (${(jpg.length / 1024 / 1024).toFixed(1)} MB)`)
}

console.log('\nDone. Panoramas are CC0 from https://polyhaven.com')
