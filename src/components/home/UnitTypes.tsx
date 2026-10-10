import { Link } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { asset, formatPrice, formatNumber } from '../../lib/format'
import { RevealHeading } from '../motion'
import { range, roomType, startingPrice } from '../../lib/domain'


export default function UnitTypes() {
  const { apartments } = useData()
  const areas = range(apartments.map((a) => a.area))
  const types = [...new Set(apartments.map((a) => a.rooms))]
    .sort((a, b) => a - b)
    .map((rooms) => {
      const list = apartments.filter((a) => a.rooms === rooms)
      const free = list.filter((a) => a.status === 'available')
      return {
        rooms,
        plan: list[0].floorPlan,
        minArea: Math.min(...list.map((a) => a.area)),
        maxArea: Math.max(...list.map((a) => a.area)),
        free: free.length,
        minPrice: startingPrice(free),
      }
    })

  return (
    <section className="bg-paper py-24 sm:py-36" aria-labelledby="types-title">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <RevealHeading id="types-title" className="max-w-2xl font-display text-[2.6rem] leading-[1.02] text-navy-950 sm:text-6xl">{areas ? `Katër tipologji, nga ${Math.floor(areas[0])} deri në ${Math.ceil(areas[1])} m²` : 'Katër tipologji'}</RevealHeading>
        <p className="mt-4 max-w-xl text-lg text-navy-600">Sipërfaqet, çmimet dhe planet janë ilustruese deri në konfirmimin nga investitori.</p>

        <ul className="mt-12 divide-y divide-stone-200 border-y border-stone-200">
          {types.map((t) => (
            <li key={t.rooms}>
              <Link
                to={`/apartments?dhoma=${t.rooms}&lira=1`}
                className="group grid grid-cols-[96px_1fr] items-center gap-x-4 gap-y-4 py-6 transition sm:grid-cols-[180px_1fr_auto] sm:gap-8"
              >
                <div className="overflow-hidden rounded-xs bg-white p-2 ring-1 ring-stone-200 transition group-hover:ring-gold-500">
                  <img src={asset(t.plan)} alt={`Plan ilustrues, banesë ${roomType(t.rooms)}`} className="aspect-[10/7] w-full object-contain" loading="lazy" />
                </div>
                <div>
                  <h3 className="font-display text-2xl leading-tight text-navy-950 sm:text-4xl">Banesë {roomType(t.rooms)}</h3>
                  <p className="mt-1 text-navy-600">
                    {formatNumber(t.minArea)} – {formatNumber(t.maxArea)} m²
                  </p>
                </div>
                <div className="col-span-2 flex items-end justify-between gap-6 sm:col-span-1 sm:block sm:text-right">
                  <div>
                    <div className="text-sm text-navy-500">{t.minPrice ? 'Çmimi nga (ilustrues)' : 'Asnjë e lirë tani'}</div>
                    <div className="font-display text-3xl text-navy-950">{t.minPrice ? formatPrice(t.minPrice) : '—'}</div>
                  </div>
                  <div className="text-sm font-medium text-gold-500 group-hover:text-navy-950 sm:mt-2">
                    {t.free ? `Shiko ${t.free} të lira` : 'Shiko tipologjinë'}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
