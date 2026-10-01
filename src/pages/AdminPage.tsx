import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { StatusBadge, inputCls } from '../components/ui'
import { useData } from '../data/DataContext'
import type { ApartmentPatch } from '../data/repository'
import { STATUS_LABELS, formatNumber, formatPrice } from '../lib/format'
import type { Apartment, ApartmentStatus } from '../types'

const STATUSES = Object.keys(STATUS_LABELS) as ApartmentStatus[]
const ROOMS = [1, 2, 3, 4, 5, 6]
// shared input style without its fixed width, so each column can size its own control
const ctrl = inputCls.replace('w-full ', '')

type RowState = { id: string; kind: 'saving' | 'saved' | 'error'; message?: string }

/** Management table: the admin changes status, m², rooms and price; visitors see it right away. */
export default function AdminPage() {
  const { apartments, buildings, updateApartment, reset } = useData()
  const { mode } = useAuth()
  const [buildingId, setBuildingId] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [row, setRow] = useState<RowState | null>(null)

  const list = apartments
    .filter((a) => (!buildingId || a.buildingId === buildingId) && (!status || a.status === status) && (!q || a.id.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.buildingId.localeCompare(b.buildingId) || a.floor - b.floor || a.number.localeCompare(b.number))

  const save = async (a: Apartment, patch: ApartmentPatch) => {
    setRow({ id: a.id, kind: 'saving' })
    try {
      await updateApartment(a.id, patch)
      setRow({ id: a.id, kind: 'saved' })
      window.setTimeout(() => setRow((r) => (r?.id === a.id && r.kind === 'saved' ? null : r)), 1500)
    } catch (e) {
      setRow({ id: a.id, kind: 'error', message: (e as Error).message })
    }
  }

  const counts = STATUSES.map((s) => [s, apartments.filter((a) => a.status === s).length] as const)

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">Banesat</h1>
          <p className="mt-1 text-sm text-navy-500">
            {mode === 'supabase'
              ? 'Ndryshimet ruhen në databazë dhe vizitorët i shohin menjëherë.'
              : 'Modaliteti demo: ndryshimet ruhen vetëm në këtë shfletues. Lidheni Supabase që t’i shohin të gjithë.'}
          </p>
        </div>
        {mode === 'demo' && (
          <button
            className="min-h-10 self-start rounded-lg px-3 text-sm font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50 sm:self-auto"
            onClick={() => confirm('Të rikthehen të dhënat fillestare? Ndryshimet lokale do të fshihen.') && reset()}
          >
            Rikthe të dhënat fillestare
          </button>
        )}
      </div>

      {row?.kind === 'error' && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          <span>
            <strong>{row.id}:</strong> {row.message}
          </span>
          <button onClick={() => setRow(null)} className="font-medium hover:underline">
            Mbyll
          </button>
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
        {counts.map(([s, n]) => (
          <button
            key={s}
            onClick={() => setStatus(status === s ? '' : s)}
            aria-pressed={status === s}
            className={`rounded-xl p-3 text-left ring-1 transition ${status === s ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white ring-stone-200 hover:bg-stone-100'}`}
          >
            <div className="text-2xl font-semibold tabular-nums">{n}</div>
            <div className={`text-xs ${status === s ? 'text-navy-200' : 'text-navy-500'}`}>{STATUS_LABELS[s]}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input className={`${inputCls} sm:max-w-xs`} placeholder="Kërko sipas ID (p.sh. A-302)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Kërko" />
        <select className={`${inputCls} sm:max-w-[200px]`} value={buildingId} onChange={(e) => setBuildingId(e.target.value)} aria-label="Ndërtesa">
          <option value="">Të gjitha ndërtesat</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select className={`${inputCls} sm:max-w-[200px]`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Statusi">
          <option value="">Të gjitha statuset</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-navy-500 sm:ml-auto">{list.length} banesa</span>
      </div>

      {/* phones: cards */}
      <div className="space-y-3 md:hidden">
        {list.map((a) => (
          <div key={a.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{a.id}</div>
                <div className="text-sm text-navy-500">Kati {a.floor}</div>
              </div>
              <RowStatus row={row} a={a} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Statusi">
                <StatusSelect a={a} onSave={save} />
              </Labeled>
              <Labeled label="Dhoma">
                <RoomsSelect a={a} onSave={save} />
              </Labeled>
              <Labeled label="Sipërfaqja (m²)">
                <NumberInput value={a.area} step={0.1} decimals onSave={(area) => save(a, { area })} label={`Sipërfaqja ${a.id}`} />
              </Labeled>
              <Labeled label={`Çmimi (€) · ${formatNumber(Math.round(a.price / a.area))} €/m²`}>
                <NumberInput value={a.price} step={500} onSave={(price) => save(a, { price })} label={`Çmimi ${a.id}`} />
              </Labeled>
            </div>
          </div>
        ))}
      </div>

      {/* desktop: table */}
      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-100 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 font-medium">Banesa</th>
              <th className="px-4 py-3 font-medium">Kati</th>
              <th className="px-4 py-3 font-medium">Statusi</th>
              <th className="px-4 py-3 font-medium">Dhoma</th>
              <th className="px-4 py-3 font-medium">Sipërfaqja (m²)</th>
              <th className="px-4 py-3 font-medium">Çmimi (€)</th>
              <th className="px-4 py-3 font-medium">€/m²</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {list.map((a) => (
              <tr key={a.id} className={row?.id === a.id && row.kind === 'saved' ? 'bg-emerald-50' : 'hover:bg-stone-50'}>
                <td className="px-4 py-2 font-semibold">{a.id}</td>
                <td className="px-4 py-2 tabular-nums">{a.floor}</td>
                <td className="px-4 py-2">
                  <StatusSelect a={a} onSave={save} className="w-36" />
                </td>
                <td className="px-4 py-2">
                  <RoomsSelect a={a} onSave={save} className="w-20" />
                </td>
                <td className="px-4 py-2">
                  <NumberInput value={a.area} step={0.1} decimals onSave={(area) => save(a, { area })} className="w-28" label={`Sipërfaqja ${a.id}`} />
                </td>
                <td className="px-4 py-2">
                  <NumberInput value={a.price} step={500} onSave={(price) => save(a, { price })} className="w-32" label={`Çmimi ${a.id}`} />
                </td>
                <td className="px-4 py-2 tabular-nums text-navy-500">{formatNumber(Math.round(a.price / a.area))}</td>
                <td className="w-32 px-4 py-2 text-right">
                  <RowStatus row={row} a={a} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-navy-400">
        Fushat numerike ruhen kur largoheni nga fusha ose shtypni Enter. Vlera e banesave të listuara: {formatPrice(list.reduce((s, a) => s + a.price, 0))}
      </p>
    </div>
  )
}

function RowStatus({ row, a }: { row: RowState | null; a: Apartment }) {
  if (row?.id === a.id && row.kind === 'saving') return <span className="text-xs text-navy-500">Duke ruajtur…</span>
  if (row?.id === a.id && row.kind === 'saved') return <span className="text-xs font-medium text-emerald-700">U ruajt</span>
  if (row?.id === a.id && row.kind === 'error') return <span className="text-xs font-medium text-red-600">Nuk u ruajt</span>
  return <StatusBadge status={a.status} />
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs text-navy-500">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}

function StatusSelect({ a, onSave, className = 'w-full' }: { a: Apartment; onSave: (a: Apartment, p: ApartmentPatch) => void; className?: string }) {
  return (
    <select className={`${ctrl} ${className}`} value={a.status} aria-label={`Statusi ${a.id}`} onChange={(e) => onSave(a, { status: e.target.value as ApartmentStatus })}>
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}

function RoomsSelect({ a, onSave, className = 'w-full' }: { a: Apartment; onSave: (a: Apartment, p: ApartmentPatch) => void; className?: string }) {
  return (
    <select className={`${ctrl} ${className}`} value={a.rooms} aria-label={`Dhoma ${a.id}`} onChange={(e) => onSave(a, { rooms: Number(e.target.value) })}>
      {ROOMS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  )
}

function NumberInput({
  value,
  onSave,
  step,
  decimals = false,
  className = 'w-full',
  label,
}: {
  value: number
  onSave: (v: number) => void
  step: number
  decimals?: boolean
  className?: string
  label: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const n = Number(draft.replace(',', '.'))
    const v = decimals ? Math.round(n * 10) / 10 : Math.round(n)
    if (Number.isFinite(v) && v > 0 && v !== value) onSave(v)
    setDraft(null)
  }
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step={step}
      aria-label={label}
      className={`${ctrl} ${className}`}
      value={draft ?? value}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') setDraft(null)
      }}
    />
  )
}
