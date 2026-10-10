import { Link, useParams } from 'react-router-dom'
import PanoramaViewer from '../components/PanoramaViewer'
import { StatusBadge } from '../components/ui'
import { useData } from '../data/DataContext'
import { asset, formatArea, formatPrice, formatNumber } from '../lib/format'
import NotFound from './NotFound'
import { pricePerM2, roomType } from '../lib/domain'

export default function ApartmentPage() {
  const { id } = useParams()
  const { apartments, buildings, scenes } = useData()
  const apt = apartments.find((a) => a.id === id)
  if (!apt) return <NotFound />

  const building = buildings.find((b) => b.id === apt.buildingId)!
  const tourScenes = apt.panoramaSceneIds.map((sid) => scenes.find((s) => s.id === sid)).filter((s) => !!s)
  const siblings = apartments
    .filter((a) => a.buildingId === apt.buildingId)
    .sort((a, b) => a.floor - b.floor || a.number.localeCompare(b.number))
  const idx = siblings.findIndex((a) => a.id === apt.id)
  const prev = siblings[idx - 1]
  const next = siblings[idx + 1]

  const inquiryLink = { pathname: '/', search: `?s=kontakt&banesa=${encodeURIComponent(apt.id)}` }
  const ppm = pricePerM2(apt)
  const priceText = apt.status === 'sold' ? 'E shitur' : apt.price > 0 ? formatPrice(apt.price) : 'Çmimi sipas kërkesës'

  const rows: [string, string][] = [
    ['Ndërtesa', building.name],
    ['Kati', String(apt.floor)],
    ['Numri', apt.number],
    ['Sipërfaqja', formatArea(apt.area)],
    ['Tipi', roomType(apt.rooms)],
    ['Çmimi / m²', apt.status === 'sold' || ppm === null ? '—' : `${formatNumber(ppm)} €`],
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-5 sm:px-8 sm:pt-8 lg:pb-8">
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-navy-500">
        <Link to={`/buildings/${building.id}`} className="-ml-2 rounded-xs px-2 py-1 font-medium text-navy-700 sm:hidden">
          ← {building.name}
        </Link>
        <div className="hidden sm:block">
          <Link to="/" className="hover:text-navy-900">
            Ballina
          </Link>{' '}
          /{' '}
          <Link to={`/buildings/${building.id}`} className="hover:text-navy-900">
            {building.name}
          </Link>{' '}
          / <span className="text-navy-900">Apartamenti {apt.number}</span>
        </div>
        <div className="flex gap-2">
          {prev && (
            <Link to={`/apartments/${prev.id}`} className="rounded-xs px-2 py-1 hover:bg-navy-50">
              ← {prev.number}
            </Link>
          )}
          {next && (
            <Link to={`/apartments/${next.id}`} className="rounded-xs px-2 py-1 hover:bg-navy-50">
              {next.number} →
            </Link>
          )}
        </div>
      </nav>

      {/* phones: title + key facts first, then the tour */}
      <div className="mb-5 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-gold-600">
              {building.name} · Kati {apt.floor}
            </div>
            <h1 className="font-display text-5xl text-navy-950">Apartamenti {apt.number}</h1>
          </div>
          <StatusBadge status={apt.status} />
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {[formatArea(apt.area), `Banesë ${roomType(apt.rooms)}`, `Kati ${apt.floor}`].map((t) => (
            <span key={t} className="shrink-0 rounded-xs bg-navy-50 px-3 py-1 text-sm font-medium text-navy-700">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-3xl sm:text-4xl">Tura virtuale 360°</h2>
            <span className="hidden text-sm text-navy-500 sm:block">Tërhiqni për të parë përreth · klikoni rrathët për të lëvizur</span>
            <span className="text-xs text-navy-500 sm:hidden">Rrëshqitni me gisht · prekni rrathët</span>
          </div>
          {tourScenes.length ? (
            <PanoramaViewer scenes={tourScenes} />
          ) : (
            <p className="rounded-xs bg-navy-50 p-8 text-center text-navy-500">Tura virtuale nuk është ende në dispozicion.</p>
          )}
          <p className="text-xs text-navy-400">
            Pamjet 360° janë ilustruese (panorama CC0 nga Poly Haven) dhe nuk paraqesin apartamentin real.
          </p>
        </div>

        <aside className="min-w-0">
          <div className="rounded-xs bg-white p-5 ring-1 ring-navy-200 sm:p-6 lg:sticky lg:top-24">
            <div className="hidden items-start justify-between gap-4 lg:flex">
              <div>
                <div className="text-sm font-medium text-gold-600">
                  {building.name} · Kati {apt.floor}
                </div>
                <h1 className="font-display text-5xl text-navy-950">Apartamenti {apt.number}</h1>
              </div>
              <StatusBadge status={apt.status} />
            </div>

            <div className="rounded-xs bg-navy-900 p-4 text-white lg:mt-5">
              <div className="text-xs text-navy-300">Çmimi</div>
              <div className="font-display text-4xl">
                {priceText}
              </div>
              {apt.status !== 'sold' && apt.price > 0 && <div className="mt-1 text-xs text-navy-300">Çmim ilustrues, konfirmohet nga zyra e shitjes</div>}
              {apt.status === 'reserved' && <div className="mt-1 text-sm text-gold-300">Aktualisht e rezervuar</div>}
            </div>

            <h2 className="mt-5 text-sm font-medium text-navy-500 lg:hidden">Detajet</h2>
            <dl className="mt-2 divide-y lg:mt-5 divide-navy-100 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5">
                  <dt className="text-navy-500">{k}</dt>
                  <dd className="font-medium text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5">
              <div className="mb-2 flex items-baseline justify-between gap-3 text-sm font-medium text-navy-700">Plani i apartamentit <span className="text-xs font-normal text-navy-500">Plan ilustrues, jo projekt i miratuar</span></div>
              <a href={asset(apt.floorPlan)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xs ring-1 ring-navy-100 transition hover:ring-gold-400">
                <img src={asset(apt.floorPlan)} alt={`Plan ilustrues i banesës ${roomType(apt.rooms)}`} className="w-full bg-white" />
              </a>
            </div>

            <Link
              to={inquiryLink}
              className={`mt-6 hidden w-full lg:flex items-center justify-center rounded-xs px-4 py-3 font-semibold transition ${apt.status === 'sold' ? 'bg-navy-950 text-white hover:bg-navy-800' : 'bg-gold-500 text-navy-950 hover:bg-gold-400'}`}
            >
              {apt.status === 'sold' ? 'Pyet për banesa të ngjashme' : 'Kërko informacion'}
            </Link>
          </div>
        </aside>
      </div>

      {/* phones: sticky price + call to action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-100 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgb(15_27_45/0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-navy-500">Nr. {apt.number} · {formatArea(apt.area)}</div>
            <div className="truncate font-display text-2xl">{priceText}</div>
          </div>
          <Link
            to={inquiryLink}
            className={`shrink-0 rounded-xs px-5 py-3 text-sm font-semibold ${apt.status === 'sold' ? 'bg-navy-950 text-white' : 'bg-gold-500 text-navy-950 active:bg-gold-400'}`}
          >
            {apt.status === 'sold' ? 'Banesa të ngjashme' : 'Kërko informacion'}
          </Link>
        </div>
      </div>
    </div>
  )
}
