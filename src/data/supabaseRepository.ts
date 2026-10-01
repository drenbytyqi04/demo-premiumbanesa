/**
 * Supabase implementation of DataRepository.
 * Tables: see supabase/migrations/0001_init.sql. Columns are snake_case, types are camelCase.
 * Panorama scenes stay in scenes.json (they describe static image files in /public).
 */
import { supabase } from '../lib/supabase'
import type { Apartment, ApartmentStatus, Building, Complex, PanoramaScene, Point } from '../types'
import type { DataRepository } from './repository'
import scenesJson from './scenes.json'

interface ComplexRow {
  name: string
  tagline: string | null
  location: string | null
  aerial_image: string
  aerial_width: number
  aerial_height: number
}
interface BuildingRow {
  id: string
  name: string
  description: string | null
  floors: number
  polygon: Point[] | null
  sort: number
}
interface FacadeRow {
  id: string
  building_id: string
  label: string
  image: string
  width: number
  height: number
  sort: number
}
interface ApartmentRow {
  id: string
  building_id: string
  floor: number
  number: string
  area: number
  rooms: number
  price: number
  status: ApartmentStatus
  facade_id: string | null
  polygon: Point[] | null
  panorama_scene_ids: string[]
  floor_plan: string | null
}

const db = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

/** Throws a readable Albanian error for failed writes (e.g. RLS rejected a non-admin). */
function check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) {
    if (res.error.code === '42501' || /row-level security/i.test(res.error.message))
      throw new Error('Nuk keni leje për këtë ndryshim. Kyçuni si administrator.')
    throw new Error(res.error.message)
  }
  return res.data
}

/** RLS makes a forbidden UPDATE match 0 rows instead of failing, so treat that as "no permission". */
function updated(res: { data: unknown[] | null; error: { message: string; code?: string } | null }) {
  const rows = check(res)
  if (!rows || rows.length === 0) throw new Error('Ndryshimi nuk u ruajt: nuk keni leje ose rreshti nuk ekziston.')
}

export const supabaseRepository: DataRepository = {
  async load() {
    const s = db()
    const [c, b, f, a] = await Promise.all([
      s.from('complex').select('*').eq('id', 1).single<ComplexRow>(),
      s.from('buildings').select('*').order('sort').returns<BuildingRow[]>(),
      s.from('facades').select('*').order('sort').returns<FacadeRow[]>(),
      s.from('apartments').select('*').returns<ApartmentRow[]>(),
    ])
    const complexRow = check(c)
    if (!complexRow) throw new Error('Tabela "complex" është bosh. Ekzekutoni supabase/seed.sql.')
    const facades = check(f) ?? []

    const complex: Complex = {
      name: complexRow.name,
      tagline: complexRow.tagline ?? '',
      location: complexRow.location ?? '',
      aerial: { image: complexRow.aerial_image, width: complexRow.aerial_width, height: complexRow.aerial_height },
    }
    const buildings: Building[] = (check(b) ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      floors: r.floors,
      polygon: r.polygon,
      facades: facades
        .filter((x) => x.building_id === r.id)
        .map((x) => ({ id: x.id, label: x.label, image: x.image, width: x.width, height: x.height })),
    }))
    const apartments: Apartment[] = (check(a) ?? []).map((r) => ({
      id: r.id,
      buildingId: r.building_id,
      floor: r.floor,
      number: r.number,
      area: Number(r.area),
      rooms: r.rooms,
      price: r.price,
      status: r.status,
      facadeId: r.facade_id,
      polygon: r.polygon,
      panoramaSceneIds: r.panorama_scene_ids ?? [],
      floorPlan: r.floor_plan ?? '',
    }))
    return { complex, buildings, apartments, scenes: structuredClone(scenesJson) as PanoramaScene[] }
  },

  async updateApartment(id, patch) {
    updated(await db().from('apartments').update(patch).eq('id', id).select('id'))
  },

  async savePolygons(data) {
    const s = db()
    const byId = new Map(data.polygons.map((p) => [p.id, p.points]))
    if (data.target.type === 'aerial') {
      updated(await s.from('complex').update({ aerial_image: data.image, aerial_width: data.width, aerial_height: data.height }).eq('id', 1).select('id'))
      const { data: rows } = await s.from('buildings').select('id')
      for (const r of rows ?? []) updated(await s.from('buildings').update({ polygon: byId.get(r.id) ?? null }).eq('id', r.id).select('id'))
    } else if (data.target.type === 'facade') {
      const { buildingId, facadeId } = data.target
      updated(await s.from('facades').update({ image: data.image, width: data.width, height: data.height }).eq('id', facadeId).select('id'))
      const rows = check(await s.from('apartments').select('id, facade_id').eq('building_id', buildingId)) as { id: string; facade_id: string | null }[]
      for (const r of rows) {
        if (byId.has(r.id)) updated(await s.from('apartments').update({ polygon: byId.get(r.id), facade_id: facadeId }).eq('id', r.id).select('id'))
        else if (r.facade_id === facadeId) updated(await s.from('apartments').update({ polygon: null, facade_id: null }).eq('id', r.id).select('id'))
      }
    } else throw new Error('Zgjidh objektivin (pamja ajrore ose fasada) para se të ruash.')
  },

  async reset() {
    throw new Error('Rikthimi i të dhënave fillestare është vetëm për modalitetin demo.')
  },

  subscribe(onChange) {
    // live updates: visitors see status/price changes without reloading
    const channel = db()
      .channel('public-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apartments' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buildings' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facades' }, onChange)
      .subscribe()
    return () => {
      void db().removeChannel(channel)
    }
  },
}
