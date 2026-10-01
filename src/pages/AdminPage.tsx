import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, StatusBadge, btnCls, inputCls } from '../components/ui'
import { useData } from '../data/DataContext'
import { STATUS_LABELS, formatArea, formatNumber, formatPrice } from '../lib/format'
import type { ApartmentStatus } from '../types'

const STATUSES = Object.keys(STATUS_LABELS) as ApartmentStatus[]

export default function AdminPage() {
  const { apartments, buildings, updateApartment, reset } = useData()
  const [buildingId, setBuildingId] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [q, setQ] = useState('')
  const [saved, setSaved] = useState<string | null>(null)

  const list = apartments
    .filter((a) => (!buildingId || a.buildingId === buildingId) && (!status || a.status === status) && (!q || a.id.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.buildingId.localeCompare(b.buildingId) || a.floor - b.floor || a.number.localeCompare(b.number))

  const flash = (id: string) => {
    setSaved(id)
    window.setTimeout(() => setSaved((s) => (s === id ? null : s)), 1200)
  }

  const counts = STATUSES.map((s) => [s, apartments.filter((a) => a.status === s).length] as const)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader eyebrow="Paneli i administrimit (demo)" title="Menaxho apartamentet">
        <button
          className={btnCls.danger}
          onClick={() => {
            if (confirm('Të rikthehen të gjitha të dhënat fillestare? Ndryshimet lokale (statuset, çmimet, poligonet) do të fshihen.')) reset()
          }}
        >
          Rikthe të dhënat fillestare
        </button>
      </PageHeader>

      <div className="mb-4 rounded-xl bg-gold-300/20 px-4 py-3 text-sm text-navy-800 ring-1 ring-gold-400/40">
        Ndryshimet ruhen në <code className="rounded bg-white/70 px-1">localStorage</code> të këtij shfletuesi dhe shfaqen menjëherë në
        ngjyrat e <Link to="/" className="font-semibold underline">ballinës</Link> dhe të ndërtesave. Me Supabase, këto do të ruhen në databazë.
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {counts.map(([s, n]) => (
          <button
            key={s}
            onClick={() => setStatus(status === s ? '' : s)}
            className={`rounded-xl p-3 text-left ring-1 transition ${status === s ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white ring-navy-100 hover:bg-navy-50'}`}
          >
            <div className="text-2xl font-semibold">{n}</div>
            <div className={`text-xs ${status === s ? 'text-navy-200' : 'text-navy-500'}`}>{STATUS_LABELS[s]}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input className={`${inputCls} sm:max-w-xs`} placeholder="Kërko sipas ID (p.sh. A-302)" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} sm:max-w-[180px]`} value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
          <option value="">Të gjitha ndërtesat</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select className={`${inputCls} sm:max-w-[180px]`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Të gjitha statuset</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-navy-500 sm:ml-auto">{list.length} rreshta</span>
      </div>

      {/* phones: one card per apartment */}
      <div className="space-y-3 sm:hidden">
        {list.map((a) => (
          <div key={a.id} className={`rounded-xl p-4 shadow-sm ring-1 transition ${saved === a.id ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-navy-100'}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <Link to={`/apartments/${a.id}`} className="font-semibold">
                  {a.id}
                </Link>
                <div className="text-sm text-navy-500">
                  Kati {a.floor} · {a.rooms} dh. · {formatArea(a.area)}
                </div>
              </div>
              {saved === a.id ? <span className="text-xs font-medium text-emerald-600">✓ U ruajt</span> : <StatusBadge status={a.status} />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-navy-500">
                Statusi
                <select
                  className={`${inputCls} mt-1`}
                  value={a.status}
                  onChange={async (e) => {
                    await updateApartment(a.id, { status: e.target.value as ApartmentStatus })
                    flash(a.id)
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-navy-500">
                Çmimi (€) · {formatNumber(Math.round(a.price / a.area))} €/m²
                <PriceInput
                  className="mt-1 w-full"
                  value={a.price}
                  onSave={async (price) => {
                    await updateApartment(a.id, { price })
                    flash(a.id)
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-navy-100 sm:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-navy-50 text-xs uppercase tracking-wider text-navy-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Kati</th>
              <th className="px-4 py-3">Dhoma</th>
              <th className="px-4 py-3">Sipërfaqja</th>
              <th className="px-4 py-3">Statusi</th>
              <th className="px-4 py-3">Çmimi (€)</th>
              <th className="px-4 py-3">€/m²</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {list.map((a) => (
              <tr key={a.id} className={`transition ${saved === a.id ? 'bg-emerald-50' : 'hover:bg-navy-50/50'}`}>
                <td className="px-4 py-2 font-semibold">
                  <Link to={`/apartments/${a.id}`} className="hover:text-gold-600">
                    {a.id}
                  </Link>
                </td>
                <td className="px-4 py-2">{a.floor}</td>
                <td className="px-4 py-2">{a.rooms}</td>
                <td className="px-4 py-2">{formatArea(a.area)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <select
                      className={`${inputCls} w-36 py-1.5`}
                      value={a.status}
                      onChange={async (e) => {
                        await updateApartment(a.id, { status: e.target.value as ApartmentStatus })
                        flash(a.id)
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <span className="hidden xl:inline">
                      <StatusBadge status={a.status} />
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <PriceInput
                    value={a.price}
                    onSave={async (price) => {
                      await updateApartment(a.id, { price })
                      flash(a.id)
                    }}
                  />
                </td>
                <td className="px-4 py-2 text-navy-500">{formatNumber(Math.round(a.price / a.area))}</td>
                <td className="w-16 px-4 py-2 text-right text-xs font-medium text-emerald-600">{saved === a.id ? '✓ U ruajt' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-navy-400">Çmimi ruhet kur largoheni nga fusha ose shtypni Enter. Totali: {formatPrice(list.reduce((s, a) => s + a.price, 0))}</p>
    </div>
  )
}

function PriceInput({ value, onSave, className = 'w-32' }: { value: number; onSave: (v: number) => void; className?: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const v = Math.round(Number(draft))
    if (Number.isFinite(v) && v > 0 && v !== value) onSave(v)
    setDraft(null)
  }
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={500}
      className={`${inputCls} ${className} py-1.5`}
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
