import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import site from '../../data/site'
import { MD_COLS, STATUS_RGB, formatPrice } from '../../lib/format'
import ImageOverlay from '../ImageOverlay'
import { RevealHeading } from '../motion'
import { startingPrice } from '../../lib/domain'

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
      minPrice: startingPrice(free),
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
    <section className="overflow-x-clip bg-navy-950 text-white">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 pb-12 pt-32 sm:px-8 md:grid-cols-12 md:items-end md:pb-14 md:pt-40">
        <RevealHeading as="h1" immediate delay={0.1} className="font-display text-[3.1rem] leading-[0.98] sm:text-7xl md:col-span-8 lg:text-[6.2rem]">
          {site.hero.title}
        </RevealHeading>
        <div className="md:col-span-4 md:pb-2">
          <motion.p {...rise(0.55)} className="max-w-sm text-[17px] leading-relaxed text-navy-300">
            {site.hero.text}
          </motion.p>
          <motion.div {...rise(0.7)} className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            <Link to="/apartments?lira=1" className="inline-flex h-12 items-center bg-gold-500 px-6 font-medium text-navy-950 transition-colors hover:bg-gold-400">
              Shiko {totalFree} banesat e lira
            </Link>
            <Link
              to={`/apartments/${firstTour.id}`}
              className="inline-flex h-12 items-center border-b border-white/40 font-medium text-white transition-colors hover:border-white"
            >
              Tura virtuale 360°
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        ref={scroller}
        className="no-scrollbar overflow-x-auto md:overflow-hidden"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '50% 30%' }}
      >
        <ImageOverlay
          intro
          subtle
          image={complex.aerial}
          highlightId={hovered}
          className="w-[200vw] max-w-[900px] md:w-auto md:max-w-none"
          ctaLabel="Hap lamelën"
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
                <div className="font-display text-2xl text-navy-950">{s.building.name}</div>
                <div className="mt-1 text-navy-700">{s.free ? `${s.free} banesa të lira` : 'E shitur plotësisht'}</div>
                {s.minPrice && <div className="text-sm text-navy-500">nga {formatPrice(s.minPrice)}</div>}
              </>
            )
          }}
        />
      </motion.div>
      <p className="px-5 pt-4 text-sm text-navy-400 md:hidden">Rrëshqitni pamjen anash dhe prekni një lamelë.</p>

      {/* availability per wing – hover highlights the wing on the photo */}
      <div className={`mx-auto grid max-w-[1400px] px-5 pb-20 pt-6 sm:px-8 md:pt-0 ${MD_COLS[stats.length] ?? 'md:grid-cols-3'}`}>
        {stats.map((s, i) => (
          <Link
            key={s.building.id}
            to={`/buildings/${s.building.id}`}
            onMouseEnter={() => setHovered(s.building.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(s.building.id)}
            onBlur={() => setHovered(null)}
            className={`group block border-white/15 py-8 md:pt-10 ${i > 0 ? 'border-t md:border-l md:border-t-0 md:pl-10' : 'md:pr-10'}`}
          >
            <div className="flex items-end justify-between gap-4">
              <span className="font-display text-4xl transition-colors group-hover:text-gold-300 sm:text-5xl">{s.building.name}</span>
              <span className="pb-1.5 text-navy-300">{s.minPrice ? `nga ${formatPrice(s.minPrice)}` : 'E shitur'}</span>
            </div>
            <div className="mt-6 flex h-[3px] bg-white/10" role="img" aria-label={`${s.free} të lira, ${s.reserved} të rezervuara, ${s.sold} të shitura`}>
              <span className="bg-[#5fb589]" style={{ width: `${(s.free / s.total) * 100}%` }} />
              <span className="bg-[#e5c78d]" style={{ width: `${(s.reserved / s.total) * 100}%` }} />
            </div>
            <div className="mt-4 flex justify-between text-sm text-navy-300">
              <span>
                <span className="text-white">{s.free} të lira</span> · {s.reserved} të rezervuara · {s.total} gjithsej
              </span>
              <span className="text-white/70 transition-colors group-hover:text-white">Shiko katet</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
