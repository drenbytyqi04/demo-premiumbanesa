/**
 * Contact / appointment request: one Zod schema shared by the form (client-side validation)
 * and the repository. The database repeats the same limits (supabase/migrations/0002_inquiries.sql),
 * so a request that bypasses the form is still validated on the server.
 */
import { z } from 'zod'

export const inquirySchema = z.object({
  name: z.string().trim().min(2, 'Shkruani emrin dhe mbiemrin.').max(120, 'Emri është shumë i gjatë.'),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s()./-]/g, ''))
    .pipe(z.string().regex(/^\+?\d{8,15}$/, 'Shkruani një numër telefoni, p.sh. +383 44 123 456.')),
  email: z.union([z.literal(''), z.email('Kjo adresë emaili nuk duket e saktë.').max(200)]),
  buildingId: z.string().max(20),
  rooms: z.union([z.literal(''), z.enum(['1', '2', '3', '4'])]),
  apartmentId: z.string().max(20),
  message: z.string().trim().max(1000, 'Mesazhi mund të ketë deri në 1000 shenja.'),
  consent: z.boolean().refine((v) => v, 'Duhet të pranoni përpunimin e të dhënave për t’ju kontaktuar.'),
  /** honeypot: hidden from people, bots tend to fill it */
  website: z.string().max(0),
})

export type InquiryInput = z.input<typeof inquirySchema>
export type InquiryValues = z.output<typeof inquirySchema>

/** What is stored: validated values + an id generated once per submission (duplicate protection). */
export interface Inquiry {
  clientId: string
  name: string
  phone: string
  email: string | null
  buildingId: string | null
  rooms: number | null
  apartmentId: string | null
  message: string | null
}

export function toInquiry(v: InquiryValues, clientId: string): Inquiry {
  return {
    clientId,
    name: v.name,
    phone: v.phone,
    email: v.email || null,
    buildingId: v.buildingId || null,
    rooms: v.rooms ? Number(v.rooms) : null,
    apartmentId: v.apartmentId || null,
    message: v.message || null,
  }
}

/** Forms submitted faster than this after rendering are almost always bots. */
export const MIN_FILL_MS = 2500
