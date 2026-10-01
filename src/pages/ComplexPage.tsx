import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ImageOverlay from '../components/ImageOverlay'
import { Legend } from '../components/ui'
import { useData } from '../data/DataContext'
import { STATUS_RGB, asset, formatArea, formatPrice } from '../lib/format'

export default function ComplexPage() {
  const { complex, buildings, apartments } = useData()
  const navigate = useNavigate()
  const scroller = useRef<HTMLDivElement>(null)

  // phones: start the swipeable aerial centred
  useEffect(() => {
    const el = scroller.current
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  const stats = buildings.map((b) => {
    const list = apartments.filter((a) => a.buildingId === b.id)
    const free = list.filter((a) => a.status === 'available')
    return {
      building: b,
      total: list.length,
      free: free.length,
      minPrice: free.length ? Math.min(...free.map((a) => a.price)) : null,
      areaRange: free.length ? [Math.min(...free.map((a) => a.area)), Math.max(...free.map((a) => a.area))] : null,
    }
  })
  const totalFree = stats.reduce((s, x) => s + x.free, 0)

  return (
    <>
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.25em] text-gold-400">{complex.location}</p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">{complex.tagline}</h1>
          <p className="mt-4 max-w-2xl text-navy-200">
            Zgjidhni një ndërtesë në pamjen ajrore për të parë katet dhe apartamentet e lira. {totalFree} apartamente janë ende në
            dispozicion.
          </p>
        </div>
      </section>

      <section className="bg-navy-800 pb-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {/* on phones the aerial is shown larger and can be swiped sideways */}
          <div ref={scroller} className="no-scrollbar overflow-x-auto sm:overflow-visible">
          <ImageOverlay
            image={complex.aerial}
            className="w-[200vw] max-w-[900px] overflow-hidden shadow-2xl shadow-navy-950/40 sm:w-auto sm:max-w-none sm:rounded-2xl"
            ctaLabel="Hap ndërtesën"
            shapes={stats
              .filter((s) => s.building.polygon)
              .map((s) => ({
                id: s.building.id,
                points: s.building.polygon!,
                rgb: s.free > 0 ? STATUS_RGB.available : STATUS_RGB.sold,
                label: `${s.building.name}: ${s.free} apartamente të lira`,
              }))}
            onSelect={(id) => navigate(`/buildings/${id}`)}
            renderTooltip={(id) => {
              const s = stats.find((x) => x.building.id === id)!
              return (
                <>
                  <div className="font-display text-base font-semibold text-navy-900">{s.building.name}</div>
                  <div className={s.free ? 'font-medium text-emerald-700' : 'font-medium text-red-600'}>
                    {s.free ? `${s.free} apartamente të lira` : 'E shitur plotësisht'}
                  </div>
                  <div className="text-xs text-navy-500">
                    {s.building.floors} kate · {s.total} njësi
                  </div>
                </>
              )
            }}
          >
            <div className="pointer-events-none absolute bottom-3 right-3 hidden rounded-xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur sm:block">
              <Legend
                items={[
                  { rgb: STATUS_RGB.available, label: 'Ka apartamente të lira' },
                  { rgb: STATUS_RGB.sold, label: 'E shitur' },
                ]}
              />
            </div>
          </ImageOverlay>
          </div>
          <div className="space-y-3 px-4 pt-3 sm:hidden">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/95 px-3 py-2">
              <Legend
                items={[
                  { rgb: STATUS_RGB.available, label: 'Ka të lira' },
                  { rgb: STATUS_RGB.sold, label: 'E shitur' },
                ]}
              />
              <span className="shrink-0 text-xs text-navy-400">← rrëshqit →</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {stats.map((s) => (
                <Link
                  key={s.building.id}
                  to={`/buildings/${s.building.id}`}
                  className="rounded-xl bg-white/10 px-2 py-2.5 text-center text-white ring-1 ring-white/15 active:bg-white/20"
                >
                  <div className="font-display text-lg font-semibold leading-tight">{s.building.id}</div>
                  <div className={`text-xs ${s.free ? 'text-emerald-300' : 'text-red-300'}`}>{s.free ? `${s.free} të lira` : 'E shitur'}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">Ndërtesat</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((s) => (
            <Link
              key={s.building.id}
              to={`/buildings/${s.building.id}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-900/10"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-navy-100">
                <img
                  src={asset(s.building.facades[0]?.image ?? complex.aerial.image)}
                  alt={s.building.name}
                  className="size-full object-cover object-top transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow ${s.free ? 'bg-emerald-600' : 'bg-red-600'}`}
                >
                  {s.free ? `${s.free} të lira` : 'E shitur'}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold">{s.building.name}</h3>
                <p className="mt-1 text-sm text-navy-500">{s.building.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-navy-400">Kate</dt>
                    <dd className="font-medium">{s.building.floors}</dd>
                  </div>
                  <div>
                    <dt className="text-navy-400">Sipërfaqe</dt>
                    <dd className="font-medium">{s.areaRange ? `${formatArea(s.areaRange[0])} – ${Math.round(s.areaRange[1])}` : '—'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-navy-400">Çmimi nga</dt>
                    <dd className="text-lg font-semibold text-navy-900">{s.minPrice ? formatPrice(s.minPrice) : '—'}</dd>
                  </div>
                </dl>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-600 transition group-hover:gap-2">
                  Shiko apartamentet →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
