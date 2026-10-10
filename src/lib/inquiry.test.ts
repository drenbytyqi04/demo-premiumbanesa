import { describe, expect, it } from 'vitest'
import { inquirySchema, toInquiry } from './inquiry'

const valid = { name: 'Arta Krasniqi', phone: '+383 44 123 456', email: '', buildingId: 'A', rooms: '2' as const, apartmentId: '', message: '', consent: true, website: '' }

describe('inquiry validation', () => {
  it('accepts a valid request and normalizes the phone', () => {
    const r = inquirySchema.parse(valid)
    expect(r.phone).toBe('+38344123456')
    expect(toInquiry(r, 'id-1')).toEqual({ clientId: 'id-1', name: 'Arta Krasniqi', phone: '+38344123456', email: null, buildingId: 'A', rooms: 2, apartmentId: null, message: null })
  })

  it('rejects missing name, bad phone, bad email, missing consent and a filled honeypot', () => {
    for (const patch of [{ name: ' ' }, { phone: '123' }, { email: 'x@' }, { consent: false }, { website: 'http://spam' }, { message: 'x'.repeat(1001) }]) {
      expect(inquirySchema.safeParse({ ...valid, ...patch }).success, JSON.stringify(patch)).toBe(false)
    }
  })
})
