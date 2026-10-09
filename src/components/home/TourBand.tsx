import { Link } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { asset } from '../../lib/format'

/** Full-bleed band: the living-room panorama as backdrop, one clear invitation into the 360° tour. */
export default function TourBand() {
  const { apartments, scenes } = useData()
  const apt = apartments.find((a) => a.status === 'available' && a.panoramaSceneIds.length >= 4) ?? apartments[0]
  const living = scenes.find((s) => s.id === apt.panoramaSceneIds[0])
  const rooms = apt.panoramaSceneIds.map((id) => scenes.find((s) => s.id === id)?.title).filter(Boolean)

  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-white" aria-labelledby="tour-title">
      {living && (
        <img
          src={asset(living.image)}
          alt=""
          className="absolute inset-0 -z-10 size-full scale-[1.6] object-cover object-[50%_55%] opacity-70"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/90 via-navy-950/55 to-navy-950/10" />
      <div className="mx-auto flex min-h-[78vh] max-w-[1400px] flex-col justify-end px-5 py-24 sm:px-8 sm:py-32">
        <div className="max-w-2xl">
          <h2 id="tour-title" className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl">
            Ecni nëpër banesë para se të vini në zyrë
          </h2>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/75">
            Çdo banesë ka turë 360°. Rrotullohuni në çdo dhomë dhe kaloni nga njëra te tjetra me një prekje.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link to={`/apartments/${apt.id}`} className="inline-flex h-12 items-center bg-white px-6 font-medium text-navy-950 transition-colors hover:bg-gold-500 hover:text-white">
              Hap turën 360°
            </Link>
            <span className="text-sm text-white/60">{rooms.join('  ·  ')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
