// Merge a JSON file exported from the polygon editor (#/editor) into src/data/*.json.
//
//   npm run apply-polygons -- polygons-aerial.json [more.json ...]
//
// - target "aerial": sets buildings[].polygon (matched by building id) and the aerial image size
// - target "facade": sets apartments[].polygon + facadeId (matched by apartment id) and the facade image size;
//                    apartments of that facade that are NOT in the file lose their polygon
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DATA = join(import.meta.dirname, '..', 'src', 'data')
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'))
const write = (f, v) => writeFileSync(join(DATA, f), JSON.stringify(v, null, 2) + '\n')

const files = process.argv.slice(2)
if (!files.length) {
  console.error('Usage: npm run apply-polygons -- <export.json> [...]')
  process.exit(1)
}

const complex = read('complex.json')
const buildings = read('buildings.json')
const apartments = read('apartments.json')

for (const file of files) {
  const exp = JSON.parse(readFileSync(file, 'utf8'))
  const byId = new Map(exp.polygons.map((p) => [p.id, p.points]))
  const unknown = []

  if (exp.target?.type === 'aerial') {
    Object.assign(complex.aerial, { image: exp.image, width: exp.width, height: exp.height })
    for (const b of buildings) b.polygon = byId.get(b.id) ?? null
    for (const id of byId.keys()) if (!buildings.some((b) => b.id === id)) unknown.push(id)
    console.log(`✔ ${file}: ${byId.size} building polygons → aerial (${exp.width}×${exp.height})`)
  } else if (exp.target?.type === 'facade') {
    const { buildingId, facadeId } = exp.target
    const building = buildings.find((b) => b.id === buildingId)
    const facade = building?.facades.find((f) => f.id === facadeId)
    if (!facade) {
      console.error(`✖ ${file}: facade ${facadeId} not found in buildings.json`)
      continue
    }
    Object.assign(facade, { image: exp.image, width: exp.width, height: exp.height })
    let n = 0
    for (const a of apartments) {
      if (a.buildingId !== buildingId) continue
      if (byId.has(a.id)) {
        a.polygon = byId.get(a.id)
        a.facadeId = facadeId
        n++
      } else if (a.facadeId === facadeId) {
        a.polygon = null
        a.facadeId = null
      }
    }
    for (const id of byId.keys()) if (!apartments.some((a) => a.id === id && a.buildingId === buildingId)) unknown.push(id)
    console.log(`✔ ${file}: ${n} apartment polygons → ${facadeId} (${exp.width}×${exp.height})`)
  } else {
    console.error(`✖ ${file}: target is "${exp.target?.type}". Choose the aerial image or a facade in the editor before exporting.`)
    continue
  }
  if (unknown.length) console.warn(`  ⚠ ignored unknown ids: ${unknown.join(', ')}`)
}

write('complex.json', complex)
write('buildings.json', buildings)
write('apartments.json', apartments)
console.log('Done. Restart/refresh the dev server. (Clear local edits via Admin → "Rikthe të dhënat fillestare" if the editor had saved overrides.)')
