// Minimal Radiance .hdr (RGBE) reader + ACES-ish tonemapper → 8-bit RGB buffer.
import { readFileSync } from 'node:fs'

export function readHdr(path) {
  const buf = readFileSync(path)
  let pos = 0
  const line = () => {
    let s = ''
    while (buf[pos] !== 0x0a) s += String.fromCharCode(buf[pos++])
    pos++
    return s
  }
  if (!line().startsWith('#?')) throw new Error('Not a Radiance HDR file')
  while (line() !== '');
  const [, h, , w] = line().split(' ')
  const width = +w
  const height = +h
  const data = new Float32Array(width * height * 3)
  const scan = new Uint8Array(width * 4)

  for (let y = 0; y < height; y++) {
    if (buf[pos] === 2 && buf[pos + 1] === 2 && (buf[pos + 2] & 0x80) === 0) {
      // new-style RLE, one channel at a time
      pos += 4
      for (let c = 0; c < 4; c++) {
        let x = 0
        while (x < width) {
          let count = buf[pos++]
          if (count > 128) {
            count -= 128
            const v = buf[pos++]
            while (count--) scan[(x++) * 4 + c] = v
          } else {
            while (count--) scan[(x++) * 4 + c] = buf[pos++]
          }
        }
      }
    } else {
      for (let x = 0; x < width * 4; x++) scan[x] = buf[pos++]
    }
    for (let x = 0; x < width; x++) {
      const e = scan[x * 4 + 3]
      const f = e ? Math.pow(2, e - 136) : 0
      const o = (y * width + x) * 3
      data[o] = scan[x * 4] * f
      data[o + 1] = scan[x * 4 + 1] * f
      data[o + 2] = scan[x * 4 + 2] * f
    }
  }
  return { width, height, data }
}

/** Tonemap with auto-exposure (log-average luminance) + ACES filmic curve + sRGB gamma. */
export function tonemap({ width, height, data }, exposureBias = 1) {
  let sum = 0
  const n = width * height
  for (let i = 0; i < n; i++) {
    const l = 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2]
    sum += Math.log(1e-4 + l)
  }
  const avg = Math.exp(sum / n)
  const exposure = (0.3 / avg) * exposureBias
  const aces = (x) => Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)))
  const out = Buffer.alloc(n * 3)
  for (let i = 0; i < n * 3; i++) {
    out[i] = Math.round(Math.pow(aces(data[i] * exposure), 1 / 2.2) * 255)
  }
  return out
}
