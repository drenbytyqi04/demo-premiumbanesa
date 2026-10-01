import { Link } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { asset, formatPrice, formatNumber } from '../../lib/format'

const NAMES: Record<number, string> = {
  1: 'Garsonierë me një dhomë gjumi',
  2: 'Banesë me dy dhoma',
  3: 'Banesë me tri dhoma',
  4: 'Banesë familjare me katër dhoma',
}

export default function UnitTypes() {
  const { apartments } = useData()
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
        minPrice: free.length ? Math.min(...free.map((a) => a.price)) : null,
      }
    })

  return (
    <section className="bg-stone-100 py-20 sm:py-28" aria-labelledby="types-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 id="types-title" className="max-w-2xl font-display text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
          Katër tipologji, nga 45 deri në 130 m²
        </h2>
        <p className="mt-4 max-w-xl text-lg text-navy-600">Të gjitha banesat kanë ballkon, dritare në dy anë dhe depo në bodrum.</p>

        <ul className="mt-12 divide-y divide-stone-200 border-y border-stone-200">
          {types.map((t) => (
            <li key={t.rooms}>
              <Link
                to={`/apartments?dhoma=${t.rooms}&lira=1`}
                className="group grid grid-cols-[96px_1fr] items-center gap-x-4 gap-y-4 py-6 transition sm:grid-cols-[180px_1fr_auto] sm:gap-8"
              >
                <div className="overflow-hidden rounded-xl bg-white p-2 ring-1 ring-stone-200 transition group-hover:ring-gold-500">
                  <img src={asset(t.plan)} alt={`Plani ilustrues, ${t.rooms} dhoma`} className="aspect-[10/7] w-full object-contain" loading="lazy" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold leading-snug text-navy-900 sm:text-2xl">{NAMES[t.rooms] ?? `${t.rooms} dhoma`}</h3>
                  <p className="mt-1 text-navy-600">
                    {formatNumber(t.minArea)} – {formatNumber(t.maxArea)} m²
                  </p>
                </div>
                <div className="col-span-2 flex items-end justify-between gap-6 sm:col-span-1 sm:block sm:text-right">
                  <div>
                    <div className="text-sm text-navy-500">{t.minPrice ? 'Çmimi nga' : 'Të gjitha të shitura'}</div>
                    <div className="font-display text-2xl font-semibold text-navy-900">{t.minPrice ? formatPrice(t.minPrice) : '—'}</div>
                  </div>
                  <div className="text-sm font-semibold text-gold-600 group-hover:text-navy-900 sm:mt-2">
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
