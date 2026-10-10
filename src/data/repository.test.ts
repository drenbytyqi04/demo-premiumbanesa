import { describe, expect, it, vi } from 'vitest'
import { localRepository } from './repository'

const KEY = 'aurora-demo-overrides-v1'

describe('local demo repository', () => {
  it('loads the 140-apartment seed when storage is empty', async () => {
    const d = await localRepository.load()
    expect(d.apartments).toHaveLength(140)
  })

  it('persists apartment edits and notifies subscribers', async () => {
    const onChange = vi.fn()
    const off = localRepository.subscribe(onChange)
    await localRepository.updateApartment('A-101', { status: 'sold', price: 123_000 })
    off()
    expect(onChange).toHaveBeenCalled()
    const a = (await localRepository.load()).apartments.find((x) => x.id === 'A-101')
    expect(a).toMatchObject({ status: 'sold', price: 123_000 })
    await localRepository.reset()
    expect((await localRepository.load()).apartments.find((x) => x.id === 'A-101')?.price).not.toBe(123_000)
  })

  it('ignores corrupted or invalid storage instead of breaking', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(KEY, '{not json')
    expect((await localRepository.load()).apartments).toHaveLength(140)
    localStorage.setItem(KEY, JSON.stringify({ apartments: { 'A-101': { status: 'gone', price: -1 } }, facades: {} }))
    const a = (await localRepository.load()).apartments.find((x) => x.id === 'A-101')
    expect(['available', 'reserved', 'sold']).toContain(a?.status)
  })

  it('saves facade polygons and rejects a missing target', async () => {
    const d = await localRepository.load()
    const facade = d.buildings[0].facades[0]
    await localRepository.savePolygons({ version: 1, target: { type: 'facade', buildingId: d.buildings[0].id, facadeId: facade.id }, image: facade.image, width: facade.width, height: facade.height, polygons: [{ id: 'A-101', points: [[0, 0], [10, 0], [10, 10]] }] })
    const after = await localRepository.load()
    expect(after.apartments.find((a) => a.id === 'A-101')?.polygon).toEqual([[0, 0], [10, 0], [10, 10]])
    expect(after.apartments.filter((a) => a.buildingId === 'A' && a.polygon)).toHaveLength(1)
    await expect(localRepository.savePolygons({ version: 1, target: { type: 'custom' }, image: 'x', width: 1, height: 1, polygons: [] })).rejects.toThrow()
  })

  it('stores an inquiry once per client id', async () => {
    const i = { clientId: 'c1', name: 'Test', phone: '+38344123456', email: null, buildingId: null, rooms: null, apartmentId: null, message: null }
    await localRepository.submitInquiry(i)
    await localRepository.submitInquiry(i)
    expect(JSON.parse(localStorage.getItem('aurora-demo-inquiries-v1')!)).toHaveLength(1)
  })
})
