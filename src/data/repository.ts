/**
 * Data access layer.
 *
 * Every page talks to data only through the `DataRepository` interface below.
 * - `supabaseRepository` (supabaseRepository.ts): the real backend, used when
 *   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set. Visitors can only read;
 *   writes are allowed by the database (RLS) only for users in the `admins` table.
 * - `localRepository` (below): demo fallback – static JSON + localStorage overrides,
 *   so changes are visible only in the browser that made them.
 */
import type { Apartment, Building, Complex, PanoramaScene, Point, PolygonExport } from '../types'
import { supabase } from '../lib/supabase'
import apartmentsJson from './apartments.json'
import buildingsJson from './buildings.json'
import complexJson from './complex.json'
import scenesJson from './scenes.json'
import { supabaseRepository } from './supabaseRepository'

export interface DataSnapshot {
  complex: Complex
  buildings: Building[]
  apartments: Apartment[]
  scenes: PanoramaScene[]
}

/** Fields the admin can change. */
export type ApartmentPatch = Partial<Pick<Apartment, 'status' | 'price' | 'area' | 'rooms'>>

export interface DataRepository {
  load(): Promise<DataSnapshot>
  updateApartment(id: string, patch: ApartmentPatch): Promise<void>
  /** Save polygons drawn in the editor (for the aerial image or a facade). */
  savePolygons(data: PolygonExport): Promise<void>
  /** Discard all local changes (demo only). */
  reset(): Promise<void>
  /** Notify when data changed elsewhere (other tab, realtime, …). Returns unsubscribe. */
  subscribe(onChange: () => void): () => void
}

// ------------------------------------------------------------------ local implementation

const STORAGE_KEY = 'aurora-demo-overrides-v1'

interface PolygonSet {
  image: string
  width: number
  height: number
  polygons: Record<string, Point[]>
}

interface Overrides {
  apartments: Record<string, ApartmentPatch>
  aerial?: PolygonSet
  facades: Record<string, PolygonSet>
}

const empty = (): Overrides => ({ apartments: {}, facades: {} })

function readOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty()
  } catch {
    return empty()
  }
}

const listeners = new Set<() => void>()

function writeOverrides(o: Overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o))
  } catch (e) {
    console.warn('localStorage not available', e)
  }
  listeners.forEach((l) => l())
}

const clone = <T,>(v: T): T => structuredClone(v)

function applyOverrides(o: Overrides): DataSnapshot {
  const complex = clone(complexJson) as Complex
  const buildings = clone(buildingsJson) as Building[]
  const apartments = clone(apartmentsJson) as Apartment[]
  const scenes = clone(scenesJson) as PanoramaScene[]

  if (o.aerial) {
    complex.aerial = { image: o.aerial.image, width: o.aerial.width, height: o.aerial.height }
    for (const b of buildings) b.polygon = o.aerial.polygons[b.id] ?? null
  }

  for (const [facadeId, set] of Object.entries(o.facades)) {
    const facade = buildings.flatMap((b) => b.facades).find((f) => f.id === facadeId)
    if (!facade) continue
    Object.assign(facade, { image: set.image, width: set.width, height: set.height })
    const buildingId = buildings.find((b) => b.facades.includes(facade))!.id
    for (const a of apartments) {
      if (a.buildingId !== buildingId) continue
      if (set.polygons[a.id]) {
        a.polygon = set.polygons[a.id]
        a.facadeId = facadeId
      } else if (a.facadeId === facadeId) {
        a.polygon = null
        a.facadeId = null
      }
    }
  }

  for (const a of apartments) Object.assign(a, o.apartments[a.id])
  return { complex, buildings, apartments, scenes }
}

export const localRepository: DataRepository = {
  async load() {
    return applyOverrides(readOverrides())
  },
  async updateApartment(id, patch) {
    const o = readOverrides()
    o.apartments[id] = { ...o.apartments[id], ...patch }
    writeOverrides(o)
  },
  async savePolygons(data) {
    const o = readOverrides()
    const set: PolygonSet = {
      image: data.image,
      width: data.width,
      height: data.height,
      polygons: Object.fromEntries(data.polygons.map((p) => [p.id, p.points])),
    }
    if (data.target.type === 'aerial') o.aerial = set
    else if (data.target.type === 'facade') o.facades[data.target.facadeId] = set
    else throw new Error('Zgjidh objektivin (pamja ajrore ose fasada) para se të ruash.')
    writeOverrides(o)
  },
  async reset() {
    writeOverrides(empty())
  },
  subscribe(onChange) {
    listeners.add(onChange)
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && onChange()
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(onChange)
      window.removeEventListener('storage', onStorage)
    }
  },
}

/** The repository the app uses: Supabase when configured, otherwise the local demo. */
export const repository: DataRepository = supabase ? supabaseRepository : localRepository

