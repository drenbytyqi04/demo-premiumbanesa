import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Apartment } from '../types'

export interface FilterState {
  rooms: number[]
  minFloor: number | null
  maxFloor: number | null
  minArea: number | null
  maxArea: number | null
  onlyAvailable: boolean
}

const KEYS = ['kati', 'dhoma', 'min', 'max', 'lira']

const num = (v: string | null | undefined) => (v === null || v === undefined || v === '' || isNaN(+v) ? null : +v)

/**
 * Filters live in the URL so they survive navigation and can be shared:
 *   ?dhoma=1,3   rooms (one or more)
 *   ?kati=2-8    floor range (a single number = that floor)
 *   ?min=50&max=90   m² range,  ?lira=1  only available
 */
export function useFilters() {
  const [params, setParams] = useSearchParams()
  const [f0, f1] = (params.get('kati') ?? '').split('-')
  const state: FilterState = {
    rooms: (params.get('dhoma') ?? '').split(',').map(num).filter((n): n is number => n !== null),
    minFloor: num(f0),
    maxFloor: num(f1 ?? f0),
    minArea: num(params.get('min')),
    maxArea: num(params.get('max')),
    onlyAvailable: params.get('lira') === '1',
  }
  const set = (patch: Partial<FilterState>) => {
    const s = { ...state, ...patch }
    const next = new URLSearchParams(params)
    KEYS.forEach((k) => next.delete(k))
    if (s.rooms.length) next.set('dhoma', [...s.rooms].sort((a, b) => a - b).join(','))
    if (s.minFloor !== null || s.maxFloor !== null) {
      const lo = s.minFloor ?? s.maxFloor!
      const hi = s.maxFloor ?? s.minFloor!
      next.set('kati', lo === hi ? String(lo) : `${lo}-${hi}`)
    }
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
    (!f.rooms.length || f.rooms.includes(a.rooms)) &&
    (f.minFloor === null || a.floor >= f.minFloor) &&
    (f.maxFloor === null || a.floor <= f.maxFloor) &&
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

/** Dark filter panel: room chips, m² and floor range sliders, "only available". Applies live. */
export default function Filters({ apartments, filters, resultCount }: Props) {
  const { state, set, reset, active } = filters
  const rooms = useMemo(() => [...new Set(apartments.map((a) => a.rooms))].sort((a, b) => a - b), [apartments])
  const floorBounds = useMemo(() => bounds(apartments.map((a) => a.floor)), [apartments])
  const areaBounds = useMemo(() => {
    const [lo, hi] = bounds(apartments.map((a) => a.area))
    return [Math.floor(lo), Math.ceil(hi)] as [number, number]
  }, [apartments])
  const [open, setOpen] = useState(false) // phones: collapsed behind a toggle

  const activeCount =
    (state.rooms.length ? 1 : 0) + (state.minFloor !== null ? 1 : 0) + (state.minArea !== null || state.maxArea !== null ? 1 : 0) + (state.onlyAvailable ? 1 : 0)

  return (
    <div className="bg-navy-950 px-5 py-5 text-white sm:px-8 sm:py-7">
      <div className={`flex items-center justify-between md:mb-6 ${open ? 'mb-6' : ''}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="-m-2 flex items-center gap-3 p-2 font-display text-2xl md:pointer-events-none md:text-3xl"
        >
          Filtro banesat
          {activeCount > 0 && <span className="grid size-6 place-items-center bg-gold-500 font-sans text-xs">{activeCount}</span>}
          <svg viewBox="0 0 24 24" className={`size-5 transition md:hidden ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm text-white/60" aria-live="polite">
          <span className="text-white">{resultCount}</span> banesa
        </span>
      </div>

      <div className={`gap-x-10 gap-y-7 md:grid md:grid-cols-2 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end ${open ? 'grid' : 'hidden'}`}>
        <fieldset>
          <legend className="mb-3 text-sm text-white/60">Dhoma</legend>
          <div className="flex flex-wrap gap-2">
            {rooms.map((r) => {
              const on = state.rooms.includes(r)
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ rooms: on ? state.rooms.filter((x) => x !== r) : [...state.rooms, r] })}
                  className={`h-11 min-w-14 px-3 text-sm tabular-nums ring-1 transition-colors ${on ? 'bg-white text-navy-950 ring-white' : 'text-white ring-white/30 hover:ring-white'}`}
                  title={r === 1 ? '1 dhomë gjumi + dhoma ditore' : `${r} dhoma gjumi + dhoma ditore`}
                >
                  {r}+1
                </button>
              )
            })}
          </div>
        </fieldset>

        <RangeSlider
          label="Sipërfaqja"
          unit="m²"
          min={areaBounds[0]}
          max={areaBounds[1]}
          value={[state.minArea ?? areaBounds[0], state.maxArea ?? areaBounds[1]]}
          onChange={([lo, hi]) => set({ minArea: lo > areaBounds[0] ? lo : null, maxArea: hi < areaBounds[1] ? hi : null })}
        />

        <RangeSlider
          label="Kati"
          min={floorBounds[0]}
          max={floorBounds[1]}
          value={[state.minFloor ?? floorBounds[0], state.maxFloor ?? floorBounds[1]]}
          onChange={([lo, hi]) => {
            const full = lo <= floorBounds[0] && hi >= floorBounds[1]
            set({ minFloor: full ? null : lo, maxFloor: full ? null : hi })
          }}
        />

        <div className="flex items-center justify-between gap-6 lg:flex-col lg:items-end">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-[#2e7d56]"
              checked={state.onlyAvailable}
              onChange={(e) => set({ onlyAvailable: e.target.checked })}
            />
            Vetëm të lirat
          </label>
          <button type="button" onClick={reset} disabled={!active} className="h-11 px-5 text-sm ring-1 ring-white/30 transition-colors hover:ring-white disabled:opacity-30">
            Pastro filtrat
          </button>
        </div>
      </div>
    </div>
  )
}

function bounds(values: number[]): [number, number] {
  return values.length ? [Math.min(...values), Math.max(...values)] : [0, 0]
}

/** Two-handle range slider built from two native range inputs (keyboard + touch accessible). */
function RangeSlider({
  label,
  unit = '',
  min,
  max,
  value,
  onChange,
}: {
  label: string
  unit?: string
  min: number
  max: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  // the handles move from local state immediately; the URL (and the list) follow on each step
  const [draft, setDraft] = useState<[number, number]>(value)
  useEffect(() => setDraft(value), [value[0], value[1]]) // eslint-disable-line react-hooks/exhaustive-deps
  const [lo, hi] = [Math.max(min, Math.min(draft[0], max)), Math.min(max, Math.max(draft[1], min))]
  const update = (v: [number, number]) => {
    setDraft(v)
    onChange(v)
  }
  const pct = (v: number) => (max === min ? 0 : ((v - min) / (max - min)) * 100)
  const fmt = (v: number) => `${v}${unit ? ` ${unit}` : ''}`

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums">
          {fmt(lo)} – {fmt(hi)}
        </span>
      </div>
      <div className="range-slider relative h-11">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25" />
        <div className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-white" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          aria-label={`${label} nga`}
          onChange={(e) => update([Math.min(+e.target.value, hi), hi])}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          aria-label={`${label} deri`}
          onChange={(e) => update([lo, Math.max(+e.target.value, lo)])}
        />
      </div>
    </div>
  )
}
