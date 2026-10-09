import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { MD_COLS, STATUS_LABELS, formatArea, formatPrice, roomsLabel } from '../../lib/format'
import type { Apartment, ApartmentStatus } from '../../types'

// sold units recede (hatched), free units stand out; status is never shown by colour alone
const CELL: Record<ApartmentStatus, string> = {
  available: 'bg-emerald-500 text-navy-950 hover:bg-emerald-400',
  reserved: 'bg-amber-300 text-navy-950 hover:bg-amber-200',
  sold: 'stack-sold text-navy-500',
}

/** Floors × units grid per building, the way sales teams track availability. */
export default function StackingPlan() {
  const { buildings, apartments } = useData()
  const [tab, setTab] = useState(buildings[0]?.id)
  const [focus, setFocus] = useState<Apartment | null>(null)

  return (
    <section className="bg-white py-20 sm:py-28" aria-labelledby="stacking-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="stacking-title" className="font-display text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl md:col-span-6">
            Çdo banesë, kat pas kati
          </h2>
          <p className="max-w-lg text-lg text-navy-600 md:col-span-6">
            Gjendja e shitjeve në kohë reale. Zgjidhni një banesë të gjelbër për ta parë nga afër.
          </p>
        </div>

        {/* phones: one building at a time */}
        <div className="mt-10 flex gap-2 md:hidden" role="tablist">
          {buildings.map((b) => (
            <button
              key={b.id}
              role="tab"
              aria-selected={tab === b.id}
              onClick={() => setTab(b.id)}
              className={`min-h-11 flex-1 rounded-full text-sm font-semibold transition ${tab === b.id ? 'bg-navy-900 text-white' : 'bg-stone-100 text-navy-700'}`}
            >
              {b.name}
            </button>
          ))}
        </div>

        <div className={`mt-6 grid gap-10 md:mt-12 md:gap-12 ${MD_COLS[buildings.length] ?? "md:grid-cols-3"}`}>
          {buildings.map((b) => {
            const list = apartments.filter((a) => a.buildingId === b.id)
            const floors = [...new Set(list.map((a) => a.floor))].sort((x, y) => y - x)
            const cols = Math.max(...floors.map((f) => list.filter((a) => a.floor === f).length))
            const free = list.filter((a) => a.status === 'available').length
            return (
              <div key={b.id} className={tab === b.id ? '' : 'hidden md:block'}>
                <div className="mb-3 flex items-baseline justify-between">
                  <Link to={`/buildings/${b.id}`} className="font-display text-xl font-semibold text-navy-900 hover:text-gold-600">
                    {b.name}
                  </Link>
                  <span className="text-sm text-navy-500">{free} të lira</span>
                </div>
                <motion.div
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: `1.75rem repeat(${cols}, minmax(0, 1fr))` }}
                  initial="hidden"
                  whileInView="shown"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={{ shown: { transition: { staggerChildren: 0.012 } } }}
                >
                  {floors.flatMap((f) => [
                    <span key={`f${f}`} className="grid place-items-center text-xs tabular-nums text-navy-400" aria-hidden="true">
                      {f}
                    </span>,
                    ...list
                      .filter((a) => a.floor === f)
                      .sort((x, y) => x.number.localeCompare(y.number))
                      .map((a) => (
                        <motion.div
                          key={a.id}
                          variants={{ hidden: { opacity: 0, scale: 0.85 }, shown: { opacity: 1, scale: 1 } }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Link
                            to={`/apartments/${a.id}`}
                            onMouseEnter={() => setFocus(a)}
                            onFocus={() => setFocus(a)}
                            aria-label={`Banesa ${a.number}, kati ${a.floor}, ${roomsLabel(a.rooms)}, ${STATUS_LABELS[a.status]}`}
                            className={`grid h-11 place-items-center rounded-md text-xs font-semibold tabular-nums transition ${CELL[a.status]} ${focus?.id === a.id ? 'ring-2 ring-navy-900 ring-offset-1' : ''}`}
                          >
                            {a.number}
                          </Link>
                        </motion.div>
                      )),
                  ])}
                </motion.div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-stone-200 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-navy-600">
            <span className="inline-flex items-center gap-2">
              <span className="size-4 rounded bg-emerald-500" /> E lirë
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-4 rounded bg-amber-300" /> E rezervuar
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="stack-sold size-4 rounded" /> E shitur
            </span>
          </div>
          <p className="min-h-6 text-sm text-navy-700" aria-live="polite">
            {focus ? (
              <>
                <strong className="font-semibold text-navy-900">Banesa {focus.id}</strong>, {roomsLabel(focus.rooms)}, {formatArea(focus.area)}
                {focus.status === 'sold' ? ', e shitur' : `, ${formatPrice(focus.price)}`}
              </>
            ) : (
              <span className="text-navy-400">
                <span className="hidden md:inline">Kaloni mbi një banesë për të parë detajet.</span>
                <span className="md:hidden">Prekni një banesë për ta hapur.</span>
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
