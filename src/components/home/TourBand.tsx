import { Link } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { asset } from '../../lib/format'
import { Icon } from '../icons'

export default function TourBand() {
  const { apartments, scenes } = useData()
  const apt = apartments.find((a) => a.status === 'available' && a.panoramaSceneIds.length >= 4) ?? apartments[0]
  const tourScenes = apt.panoramaSceneIds.map((id) => scenes.find((s) => s.id === id)).filter((s) => !!s)

  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-white" aria-labelledby="tour-title">
      <img src={asset(tourScenes[0]?.image ?? '')} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-45" loading="lazy" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/20" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 id="tour-title" className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Ecni nëpër banesë para se të vini në zyrë
          </h2>
          <p className="mt-4 max-w-md text-lg text-navy-200">
            Çdo banesë ka turë 360°. Rrotullohuni në çdo dhomë dhe kaloni nga dhoma ditore te kuzhina me një prekje.
          </p>
          <Link
            to={`/apartments/${apt.id}`}
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-navy-950 transition hover:bg-gold-300"
          >
            <Icon name="rotate" className="size-5" />
            Hap turën e banesës {apt.number}
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {tourScenes.map((s) => (
            <li key={s.id}>
              <Link to={`/apartments/${apt.id}`} className="group block overflow-hidden rounded-2xl ring-1 ring-white/15">
                <div className="relative aspect-[4/3]">
                  <img src={asset(s.image)} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 to-transparent px-3 pb-2 pt-8 text-sm font-medium">{s.title}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
