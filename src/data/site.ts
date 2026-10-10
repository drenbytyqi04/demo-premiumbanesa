/**
 * Public site copy (site.json), validated with Zod when the app starts.
 * `null` means "not confirmed yet": the UI then shows PENDING instead of an invented value.
 */
import { z } from 'zod'
import raw from './site.json'

export const PENDING = 'Të dhënat së shpejti'

const text = z.string().trim().min(1)
const maybe = text.nullable()
const image = z.object({ src: text, thumb: text, width: z.number().int().positive(), height: z.number().int().positive(), alt: text })

export const siteSchema = z.object({
  hero: z.object({ title: text, text }),
  facts: z.object({
    delivery: maybe,
    parking: z.number().int().nonnegative().nullable(),
    courtyardArea: z.number().positive().nullable(),
  }),
  location: z.object({
    address: maybe,
    intro: text,
    distances: z.array(z.object({ place: text, time: text })),
    map: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), zoom: z.number().int().min(3).max(19) }).nullable(),
  }),
  features: z.array(z.object({ icon: text, title: text, text: maybe })).length(6),
  payment: z.object({
    illustrative: z.boolean(),
    steps: z
      .array(z.object({ percent: z.number().positive().max(100), title: text, text }))
      .min(1)
      .refine((s) => s.reduce((t, x) => t + x.percent, 0) === 100, 'Përqindjet e planit të pagesës duhet të japin 100%.'),
  }),
  contact: z.object({ phone: maybe, email: z.email().nullable(), office: maybe, hours: maybe }),
  gallery: z.object({ title: text, text, images: z.array(image).min(1) }),
  concept: z.array(z.object({ image: text, alt: text, title: text, text })),
  progress: z.object({
    title: text,
    text,
    illustrative: z.boolean(),
    updated: maybe,
    phases: z.array(z.object({ title: text, date: maybe, status: z.enum(['done', 'current', 'next']).nullable() })),
  }),
  faq: z.array(z.object({ q: text, a: text })),
})

export type Site = z.infer<typeof siteSchema>

export function parseSite(data: unknown): Site {
  const r = siteSchema.safeParse(data)
  if (!r.success) throw new Error(`site.json nuk është i vlefshëm:\n${z.prettifyError(r.error)}`)
  return r.data
}

const site = parseSite(raw)
export default site

/** tel: link for a configured phone number, or undefined. */
export const telHref = (phone: string | null) => (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined)
