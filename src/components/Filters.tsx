import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Apartment } from '../types'
import { btnCls, inputCls } from './ui'

export interface FilterState {
  floor: number | null
  rooms: number | null
  minArea: number | null
  maxArea: number | null
  onlyAvailable: boolean
}

const KEYS = ['kati', 'dhoma', 'min', 'max', 'lira']

const num = (v: string | null) => (v === null || v === '' || isNaN(+v) ? null : +v)

/** Filters live in the URL (?kati=3&dhoma=2…) so they survive navigation and can be shared. */
export function useFilters() {
  const [params, setParams] = useSearchParams()
  const state: FilterState = {
    floor: num(params.get('kati')),
    rooms: num(params.get('dhoma')),
    minArea: num(params.get('min')),
    maxArea: num(params.get('max')),
    onlyAvailable: params.get('lira') === '1',
  }
  const set = (patch: Partial<FilterState>) => {
    const s = { ...state, ...patch }
    const next = new URLSearchParams(params)
    KEYS.forEach((k) => next.delete(k))
    if (s.floor !== null) next.set('kati', String(s.floor))
    if (s.rooms !== null) next.set('dhoma', String(s.rooms))
    if (s.minArea !== null) next.set('min', String(s.minArea))
    if (s.maxArea !== null) next.set('max', String(s.maxArea))
    if (s.onlyAvailable) next.set('lira', '1')
    setParams(next, { replace: true })
  }
  const reset = () => {
    const next = new URLSearchParams(params)
    KEYS.forEach((k) => next.delete(k))
    setParams(next, { replace: true })
  }
  const active = KEYS.some((k) => params.has(k))
  return { state, set, reset, active }
}

export function matches(a: Apartment, f: FilterState) {
  return (
    (f.floor === null || a.floor === f.floor) &&
    (f.rooms === null || a.rooms === f.rooms) &&
    (f.minArea === null || a.area >= f.minArea) &&
    (f.maxArea === null || a.area <= f.maxArea) &&
    (!f.onlyAvailable || a.status === 'available')
  )
}

interface Props {
  apartments: Apartment[]
  filters: ReturnType<typeof useFilters>
  resultCount: number
}

export default function Filters({ apartments, filters, resultCount }: Props) {
  const { state, set, reset, active } = filters
  const floors = useMemo(() => [...new Set(apartments.map((a) => a.floor))].sort((a, b) => a - b), [apartments])
  const rooms = useMemo(() => [...new Set(apartments.map((a) => a.rooms))].sort((a, b) => a - b), [apartments])

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-navy-700">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
          </svg>
          Filtro
        </h2>
        <span className="text-sm text-navy-500">
          <strong className="text-navy-900">{resultCount}</strong> apartamente
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:items-end">
        <label className="text-xs font-medium text-navy-600">
          Kati
          <select className={`${inputCls} mt-1`} value={state.floor ?? ''} onChange={(e) => set({ floor: num(e.target.value) })}>
            <option value="">Të gjithë</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                Kati {f}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-navy-600">
          Dhoma
          <select className={`${inputCls} mt-1`} value={state.rooms ?? ''} onChange={(e) => set({ rooms: num(e.target.value) })}>
            <option value="">Të gjitha</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r} {r === 1 ? 'dhomë' : 'dhoma'}
              </option>
            ))}
          </select>
        </label>
        <div className="col-span-2 text-xs font-medium text-navy-600">
          Sipërfaqja (m²)
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="nga"
              min={0}
              className={inputCls}
              value={state.minArea ?? ''}
              onChange={(e) => set({ minArea: num(e.target.value) })}
            />
            <span className="text-navy-400">–</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="deri"
              min={0}
              className={inputCls}
              value={state.maxArea ?? ''}
              onChange={(e) => set({ maxArea: num(e.target.value) })}
            />
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-1 md:flex-col md:items-stretch">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-800">
            <input
              type="checkbox"
              className="size-4 rounded accent-emerald-600"
              checked={state.onlyAvailable}
              onChange={(e) => set({ onlyAvailable: e.target.checked })}
            />
            Vetëm të lirat
          </label>
          <button className={`${btnCls.ghost} py-1.5`} onClick={reset} disabled={!active}>
            Pastro
          </button>
        </div>
      </div>
    </div>
  )
}
