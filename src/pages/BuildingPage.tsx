import { useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ApartmentTable from '../components/ApartmentTable'
import Filters, { matches, useFilters } from '../components/Filters'
import ImageOverlay from '../components/ImageOverlay'
import { Legend, StatusBadge, statusLegend } from '../components/ui'
import { useData } from '../data/DataContext'
import { STATUS_RGB, formatArea, formatPrice, roomsLabel } from '../lib/format'
import NotFound from './NotFound'

export default function BuildingPage() {
  const { id } = useParams()
  const { buildings } = useData()
  const building = buildings.find((b) => b.id === id)
  if (!building) return <NotFound />
  return <BuildingView key={building.id} buildingId={building.id} />
}

/**
 * Wing page: title + filters on top, the facade full-width (arrows switch to the other wing,
 * keeping the filters), the apartment list below.
 */
function BuildingView({ buildingId }: { buildingId: string }) {
  const { buildings, apartments } = useData()
  const navigate = useNavigate()
  const filters = useFilters()
  const swipeX = useRef<number | null>(null)

  const idx = buildings.findIndex((b) => b.id === buildingId)
  const building = buildings[idx]
  const list = apartments.filter((a) => a.buildingId === buildingId).sort((a, b) => b.floor - a.floor || a.number.localeCompare(b.number))
  const filtered = list.filter((a) => matches(a, filters.state))
  const facade = building.facades[0]
  const onFacade = list.filter((a) => a.facadeId === facade?.id && a.polygon)
  const free = list.filter((a) => a.status === 'available').length
  const hidden = list.length - onFacade.length

  // the arrows walk through the wings and keep the current filters
  const goWing = (d: number) => {
    const next = buildings[(idx + d + buildings.length) % buildings.length]
    navigate({ pathname: `/buildings/${next.id}`, search: window.location.hash.split('?')[1] ? `?${window.location.hash.split('?')[1]}` : '' })
  }

  return (
    <div className="pb-24">
      {/* title + filters */}
      <div className="mx-auto grid max-w-[1600px] gap-6 px-5 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:items-center">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Kthehu te projekti" className="grid size-12 shrink-0 place-items-center bg-navy-950 text-white transition-colors hover:bg-gold-500">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-display text-5xl leading-none text-navy-950 sm:text-6xl">{building.name}</h1>
            <p className="mt-2 text-sm text-navy-500">
              {building.floors} kate · {list.length} banesa · {free} të lira
            </p>
          </div>
        </div>
        <Filters apartments={list} filters={filters} resultCount={filtered.length} />
      </div>

      {/* facade, full width */}
      <div className="mx-auto mt-6 max-w-[1600px] sm:px-8">
        {facade ? (
          <>
            <div
              className="relative overflow-hidden"
              onTouchStart={(e) => (swipeX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - (swipeX.current ?? 0)
                if (buildings.length > 1 && swipeX.current !== null && Math.abs(dx) > 80) goWing(dx < 0 ? 1 : -1)
                swipeX.current = null
              }}
            >
              <ImageOverlay
                key={facade.id + building.id}
                image={facade}
                ctaLabel="Hap banesën"
                shapes={onFacade.map((a) => ({
                  id: a.id,
                  points: a.polygon!,
                  rgb: STATUS_RGB[a.status],
                  dimmed: !matches(a, filters.state),
                  label: `Banesa ${a.number}, kati ${a.floor}`,
                }))}
                onSelect={(aid) => navigate(`/apartments/${aid}`)}
                renderTooltip={(aid) => {
                  const a = list.find((x) => x.id === aid)!
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-display text-2xl">Nr. {a.number}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="text-navy-600">
                        Kati {a.floor} · {roomsLabel(a.rooms)} · {formatArea(a.area)}
                      </div>
                      {a.status !== 'sold' && <div className="font-medium text-navy-950">{formatPrice(a.price)}</div>}
                    </div>
                  )
                }}
              />
              {buildings.length > 1 && (
                <>
                  <WingArrow dir={-1} label={buildings[(idx - 1 + buildings.length) % buildings.length].name} onClick={() => goWing(-1)} />
                  <WingArrow dir={1} label={buildings[(idx + 1) % buildings.length].name} onClick={() => goWing(1)} />
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 pt-4 sm:px-0">
              <Legend items={statusLegend} />
              <p className="text-sm text-navy-500">
                {facade.label}
                {hidden > 0 && ` · ${hidden} banesa nga oborri shihen në listë`}
              </p>
            </div>
          </>
        ) : (
          <p className="bg-navy-50 p-8 text-center text-navy-500">Kjo lamelë nuk ka ende imazh të fasadës.</p>
        )}
      </div>

      {/* list */}
      <div className="mx-auto mt-16 max-w-[1600px] px-5 sm:px-8">
        <h2 className="mb-6 font-display text-4xl text-navy-950">Banesat e {building.name}</h2>
        <ApartmentTable apartments={filtered} />
      </div>
    </div>
  )
}

function WingArrow({ dir, label, onClick }: { dir: -1 | 1; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Shko te ${label}`}
      title={label}
      className={`absolute bottom-6 z-10 grid size-12 place-items-center bg-navy-950/85 text-white backdrop-blur transition-colors hover:bg-gold-500 sm:bottom-auto sm:top-1/2 sm:size-14 sm:-translate-y-1/2 ${dir < 0 ? 'left-4 sm:left-6' : 'right-4 sm:right-6'}`}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  )
}
