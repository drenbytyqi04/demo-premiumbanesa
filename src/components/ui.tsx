import type { ReactNode } from 'react'
import { STATUS_BADGE, STATUS_LABELS, STATUS_RGB } from '../lib/format'
import type { ApartmentStatus } from '../types'

export function StatusBadge({ status }: { status: ApartmentStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[status]}`}>
      <span className="size-1.5 rounded-full" style={{ background: `rgb(${STATUS_RGB[status]})` }} />
      {STATUS_LABELS[status]}
    </span>
  )
}

export function Legend({ items }: { items: { rgb: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-600 sm:gap-x-4 sm:text-sm">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm ring-1" style={{ background: `rgb(${i.rgb} / 0.55)`, boxShadow: `inset 0 0 0 1px rgb(${i.rgb})` }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

export const statusLegend = (Object.keys(STATUS_LABELS) as ApartmentStatus[]).map((s) => ({ rgb: STATUS_RGB[s], label: STATUS_LABELS[s] }))

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-navy-50 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-navy-500">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-navy-900">{value}</div>
    </div>
  )
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-1 text-sm font-medium text-gold-600">{eyebrow}</div>}
        <h1 className="font-display text-3xl font-semibold text-navy-900 sm:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  )
}

export const inputCls =
  'w-full rounded-lg border-0 bg-white px-3 py-2 text-base sm:text-sm text-navy-900 shadow-sm ring-1 ring-navy-200 transition focus:ring-2 focus:ring-gold-500 focus:outline-none'

export const btnCls = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-navy-700 disabled:opacity-40',
  gold: 'inline-flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 shadow-sm transition hover:bg-gold-400 disabled:opacity-40',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-navy-800 shadow-sm ring-1 ring-navy-200 transition hover:bg-navy-50 disabled:opacity-40',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-40',
}
