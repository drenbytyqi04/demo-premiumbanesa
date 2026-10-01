import { useRef, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import ApartmentTable from '../components/ApartmentTable'
import Filters, { matches, useFilters } from '../components/Filters'
import ImageOverlay from '../components/ImageOverlay'
import { Legend, PageHeader, StatusBadge, statusLegend } from '../components/ui'
import { useData } from '../data/DataContext'
import { STATUS_RGB, formatArea, formatPrice, roomsLabel } from '../lib/format'
import NotFound from './NotFound'

export default function BuildingPage() {
  const { id } = useParams()
  const { buildings } = useData()
  const building = buildings.find((b) => b.id === id)
  if (!building) return <NotFound />
  // key → reset facade index when switching building
  return <BuildingView key={building.id} buildingId={building.id} />
}

function BuildingView({ buildingId }: { buildingId: string }) {
  const { buildings, apartments } = useData()
  const navigate = useNavigate()
  const filters = useFilters()
  const [facadeIdx, setFacadeIdx] = useState(0)
  const swipeX = useRef<number | null>(null)

  const building = buildings.find((b) => b.id === buildingId)!
  const list = apartments.filter((a) => a.buildingId === buildingId).sort((a, b) => b.floor - a.floor || a.number.localeCompare(b.number))
  const filtered = list.filter((a) => matches(a, filters.state))
  const facades = building.facades
  const facade = facades[facadeIdx]
  const onFacade = list.filter((a) => a.facadeId === facade?.id && a.polygon)
  const free = list.filter((a) => a.status === 'available').length
  const go = (d: number) => setFacadeIdx((i) => (i + d + facades.length) % facades.length)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-navy-500">
        <Link to="/" className="hover:text-navy-900">
          Ballina
        </Link>{' '}
        / <span className="text-navy-900">{building.name}</span>
      </nav>

      <PageHeader eyebrow={`${building.floors} kate · ${list.length} apartamente · ${free} të lira`} title={building.name}>
        <div className="flex gap-1 rounded-xl bg-navy-50 p-1">
          {buildings.map((b) => (
            <NavLink
              key={b.id}
              to={`/buildings/${b.id}`}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-navy-900 text-white shadow' : 'text-navy-600 hover:bg-white'}`
              }
            >
              {b.id}
            </NavLink>
          ))}
        </div>
      </PageHeader>

      <div className="mb-6">
        <Filters apartments={list} filters={filters} resultCount={filtered.length} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div>
          {facade ? (
            <div className="rounded-2xl bg-navy-50 p-2 ring-1 ring-navy-100 sm:p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
                <div className="text-sm font-medium text-navy-700">
                  {facade.label}
                  {facades.length > 1 && (
                    <span className="ml-2 text-navy-400">
                      {facadeIdx + 1}/{facades.length}
                    </span>
                  )}
                </div>
                <Legend items={statusLegend} />
              </div>
              <div
                className="relative"
                onTouchStart={(e) => (swipeX.current = e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  // swipe left/right to switch facade
                  const dx = e.changedTouches[0].clientX - (swipeX.current ?? 0)
                  if (facades.length > 1 && swipeX.current !== null && Math.abs(dx) > 60) go(dx < 0 ? 1 : -1)
                  swipeX.current = null
                }}
              >
                <ImageOverlay
                  key={facade.id}
                  image={facade}
                  className="overflow-hidden rounded-xl bg-white"
                  ctaLabel="Hap apartamentin"
                  shapes={onFacade.map((a) => ({
                    id: a.id,
                    points: a.polygon!,
                    rgb: STATUS_RGB[a.status],
                    dimmed: !matches(a, filters.state),
                    label: `Apartamenti ${a.number}, kati ${a.floor}`,
                  }))}
                  onSelect={(aid) => navigate(`/apartments/${aid}`)}
                  renderTooltip={(aid) => {
                    const a = list.find((x) => x.id === aid)!
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-display text-base font-semibold">Nr. {a.number}</span>
                          <StatusBadge status={a.status} />
                        </div>
                        <div className="text-navy-600">
                          Kati {a.floor} · {roomsLabel(a.rooms)} · {formatArea(a.area)}
                        </div>
                        {a.status !== 'sold' && <div className="font-semibold text-navy-900">{formatPrice(a.price)}</div>}
                      </div>
                    )
                  }}
                />
                {facades.length > 1 && (
                  <>
                    <FacadeArrow dir={-1} onClick={() => go(-1)} />
                    <FacadeArrow dir={1} onClick={() => go(1)} />
                  </>
                )}
              </div>
              {facades.length > 1 && (
                <div className="mt-3 flex justify-center gap-2">
                  {facades.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => setFacadeIdx(i)}
                      className={`h-2 rounded-full transition-all ${i === facadeIdx ? 'w-8 bg-navy-900' : 'w-2 bg-navy-300'}`}
                      aria-label={f.label}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-2xl bg-navy-50 p-8 text-center text-navy-500">Kjo ndërtesë nuk ka ende imazh të fasadës.</p>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-semibold">Apartamentet</h2>
          <ApartmentTable apartments={filtered} />
        </div>
      </div>
    </div>
  )
}

function FacadeArrow({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir < 0 ? 'Fasada e mëparshme' : 'Fasada tjetër'}
      className={`absolute top-1/2 z-10 grid size-9 -translate-y-1/2 sm:size-11 place-items-center rounded-full bg-white/90 text-navy-900 shadow-lg ring-1 ring-navy-900/10 backdrop-blur transition hover:scale-105 hover:bg-white ${dir < 0 ? 'left-1 sm:left-2' : 'right-1 sm:right-2'}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  )
}
