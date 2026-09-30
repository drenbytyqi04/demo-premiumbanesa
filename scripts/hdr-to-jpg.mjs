// Convert a Radiance .hdr equirectangular panorama to a tonemapped JPG.
// Usage: node scripts/hdr-to-jpg.mjs input.hdr output.jpg [targetWidth] [exposureBias]
import sharp from 'sharp'
import { readHdr, tonemap } from './lib/hdr.mjs'

const [input, output, targetWidth = '2048', bias = '1'] = process.argv.slice(2)
if (!input || !output) {
  console.error('Usage: node scripts/hdr-to-jpg.mjs input.hdr output.jpg [targetWidth] [exposureBias]')
  process.exit(1)
}

const hdr = readHdr(input)
const rgb = tonemap(hdr, +bias)
const w = +targetWidth
await sharp(rgb, { raw: { width: hdr.width, height: hdr.height, channels: 3 } })
  .resize(w, w / 2, { kernel: 'lanczos3' })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(output)
console.log(`✔ ${output} (${w}×${w / 2})`)
