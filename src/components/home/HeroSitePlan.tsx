import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import site from '../../data/site.json'
import { MD_COLS, STATUS_RGB, formatPrice } from '../../lib/format'
import ImageOverlay from '../ImageOverlay'

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
})

/** The site plan is the hero: the aerial photo with live, clickable building outlines. */
export default function HeroSitePlan() {
  const { complex, buildings, apartments } = useData()
  const navigate = useNavigate()
  const scroller = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const stats = buildings.map((b) => {
    const list = apartments.filter((a) => a.buildingId === b.id)
    const count = (s: string) => list.filter((a) => a.status === s).length
    const free = list.filter((a) => a.status === 'available')
    return {
      building: b,
      total: list.length,
      free: free.length,
      reserved: count('reserved'),
      sold: count('sold'),
      minPrice: free.length ? Math.min(...free.map((a) => a.price)) : null,
    }
  })
  const totalFree = stats.reduce((s, x) => s + x.free, 0)
  const firstTour = apartments.find((a) => a.status === 'available' && a.panoramaSceneIds.length >= 4) ?? apartments[0]

  // phones: start the swipeable aerial centred
  useEffect(() => {
    const el = scroller.current
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  return (
    <section className="bg-navy-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-10 sm:px-6 md:grid-cols-12 md:items-end md:pb-10 md:pt-16">
        <motion.h1 {...rise(0)} className="font-display text-[2.1rem] font-semibold leading-[1.05] sm:text-5xl md:col-span-7 lg:text-[3.6rem]">
          {site.hero.title}
        </motion.h1>
        <div className="md:col-span-5 md:pb-1">
          <motion.p {...rise(0.12)} className="max-w-md text-lg leading-relaxed text-navy-200">
            {site.hero.text}
          </motion.p>
          <motion.div {...rise(0.24)} className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/apartments?lira=1"
              className="inline-flex min-h-12 items-center rounded-full bg-gold-500 px-6 font-semibold text-navy-950 transition hover:bg-gold-400"
            >
              Shiko {totalFree} banesat e lira
            </Link>
            <Link
              to={`/apartments/${firstTour.id}`}
              className="inline-flex min-h-12 items-center rounded-full px-6 font-medium text-white ring-1 ring-white/30 transition hover:bg-white/10"
            >
              Tura virtuale 360°
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] md:px-6">
        <div ref={scroller} className="no-scrollbar overflow-x-auto md:overflow-visible">
          <ImageOverlay
            intro
            subtle
            image={complex.aerial}
            highlightId={hovered}
            className="w-[200vw] max-w-[900px] md:w-auto md:max-w-none md:overflow-hidden md:rounded-t-3xl"
            ctaLabel="Hap ndërtesën"
            shapes={stats
              .filter((s) => s.building.polygon)
              .map((s) => ({
                id: s.building.id,
                points: s.building.polygon!,
                rgb: s.free > 0 ? STATUS_RGB.available : STATUS_RGB.sold,
                label: `${s.building.name}: ${s.free} banesa të lira`,
              }))}
            onSelect={(id) => navigate(`/buildings/${id}`)}
            renderTooltip={(id) => {
              const s = stats.find((x) => x.building.id === id)!
              return (
                <>
                  <div className="font-display text-base font-semibold text-navy-900">{s.building.name}</div>
                  <div className={s.free ? 'font-medium text-emerald-700' : 'font-medium text-red-600'}>
                    {s.free ? `${s.free} banesa të lira` : 'E shitur plotësisht'}
                  </div>
                  {s.minPrice && <div className="text-xs text-navy-500">nga {formatPrice(s.minPrice)}</div>}
                </>
              )
            }}
          />
        </div>

        {/* availability per building – hover highlights the building on the plan */}
        <div className={`grid border-t border-white/10 bg-navy-800 md:rounded-b-3xl ${MD_COLS[stats.length] ?? "md:grid-cols-3"}`}>
          {stats.map((s, i) => (
            <Link
              key={s.building.id}
              to={`/buildings/${s.building.id}`}
              onMouseEnter={() => setHovered(s.building.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.building.id)}
              onBlur={() => setHovered(null)}
              className={`group flex flex-col gap-3 px-4 py-5 transition hover:bg-white/[0.04] sm:px-6 ${i > 0 ? 'border-t border-white/10 md:border-l md:border-t-0' : ''}`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-xl font-semibold">{s.building.name}</span>
                <span className="text-sm text-navy-300">{s.minPrice ? `nga ${formatPrice(s.minPrice)}` : 'E shitur'}</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`${s.free} të lira, ${s.reserved} të rezervuara, ${s.sold} të shitura`}>
                <span className="bg-emerald-500" style={{ width: `${(s.free / s.total) * 100}%` }} />
                <span className="bg-amber-400" style={{ width: `${(s.reserved / s.total) * 100}%` }} />
                <span className="bg-red-400/70" style={{ width: `${(s.sold / s.total) * 100}%` }} />
              </div>
              <div className="text-sm text-navy-200">
                <span className="font-semibold text-white">{s.free} të lira</span> nga {s.total} banesa
                <span className="text-navy-400">, {s.reserved} të rezervuara</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <p className="mx-auto max-w-7xl px-4 pb-10 pt-3 text-sm text-navy-400 sm:px-6 md:hidden">Rrëshqitni pamjen anash dhe prekni një lamelë.</p>
      <div className="hidden pb-16 md:block" />
    </section>
  )
}
