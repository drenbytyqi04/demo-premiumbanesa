import { Link, useParams } from 'react-router-dom'
import PanoramaViewer from '../components/PanoramaViewer'
import { StatusBadge } from '../components/ui'
import { useData } from '../data/DataContext'
import { asset, formatArea, formatPrice, formatNumber } from '../lib/format'
import NotFound from './NotFound'

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

  const rows: [string, string][] = [
    ['Ndërtesa', building.name],
    ['Kati', String(apt.floor)],
    ['Numri', apt.number],
    ['Sipërfaqja', formatArea(apt.area)],
    ['Dhoma', String(apt.rooms)],
    ['Çmimi / m²', apt.status === 'sold' ? '—' : `${formatNumber(Math.round(apt.price / apt.area))} €`],
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-navy-500">
        <div>
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
            <Link to={`/apartments/${prev.id}`} className="rounded-lg px-2 py-1 hover:bg-navy-50">
              ← {prev.number}
            </Link>
          )}
          {next && (
            <Link to={`/apartments/${next.id}`} className="rounded-lg px-2 py-1 hover:bg-navy-50">
              {next.number} →
            </Link>
          )}
        </div>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 space-y-4 lg:order-1">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Tura virtuale 360°</h2>
            <span className="hidden text-sm text-navy-500 sm:block">Tërhiqni për të parë përreth · klikoni rrathët për të lëvizur</span>
          </div>
          {tourScenes.length ? (
            <PanoramaViewer scenes={tourScenes} />
          ) : (
            <p className="rounded-2xl bg-navy-50 p-8 text-center text-navy-500">Tura virtuale nuk është ende në dispozicion.</p>
          )}
          <p className="text-xs text-navy-400">
            Pamjet 360° janë ilustruese (panorama CC0 nga Poly Haven) dhe nuk paraqesin apartamentin real.
          </p>
        </div>

        <aside className="order-1 min-w-0 lg:order-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy-100 lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-gold-600">
                  {building.name} · Kati {apt.floor}
                </div>
                <h1 className="font-display text-3xl font-semibold">Apartamenti {apt.number}</h1>
              </div>
              <StatusBadge status={apt.status} />
            </div>

            <div className="mt-5 rounded-xl bg-navy-900 p-4 text-white">
              <div className="text-xs uppercase tracking-wider text-navy-300">Çmimi</div>
              <div className="font-display text-3xl font-semibold">
                {apt.status === 'sold' ? 'E shitur' : formatPrice(apt.price)}
              </div>
              {apt.status === 'reserved' && <div className="mt-1 text-sm text-gold-300">Aktualisht e rezervuar</div>}
            </div>

            <dl className="mt-5 divide-y divide-navy-100 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5">
                  <dt className="text-navy-500">{k}</dt>
                  <dd className="font-medium text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-navy-700">Plani i apartamentit</div>
              <a href={asset(apt.floorPlan)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl ring-1 ring-navy-100 transition hover:ring-gold-400">
                <img src={asset(apt.floorPlan)} alt={`Plani i apartamentit ${apt.number}`} className="w-full bg-white" />
              </a>
            </div>

            <a
              href={`mailto:shitja@example.com?subject=${encodeURIComponent(`Interesim për apartamentin ${apt.id}`)}`}
              className={`mt-6 flex w-full items-center justify-center rounded-xl px-4 py-3 font-semibold transition ${apt.status === 'sold' ? 'pointer-events-none bg-navy-100 text-navy-400' : 'bg-gold-500 text-navy-950 hover:bg-gold-400'}`}
            >
              {apt.status === 'sold' ? 'Nuk është në dispozicion' : 'Kërko informacion'}
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
