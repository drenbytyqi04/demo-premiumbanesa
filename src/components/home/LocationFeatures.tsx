import site from '../../data/site'
import { Icon, isIconName } from '../icons'
import { RevealHeading } from '../motion'
import { Pending } from '../ui'

const { address, map } = site.location

function mapUrls(m: NonNullable<typeof map>) {
  const { lat, lng, zoom } = m
  const d = 0.012 / Math.pow(2, zoom - 15)
  return {
    embed: `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d * 1.6},${lat - d},${lng + d * 1.6},${lat + d}&layer=mapnik&marker=${lat},${lng}`,
    link: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom + 2}/${lat}/${lng}`,
  }
}
const urls = map && mapUrls(map)

export default function LocationFeatures() {
  return (
    <section id="lokacioni" className="bg-paper py-24 sm:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-20 px-5 sm:px-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5" aria-labelledby="location-title">
          <RevealHeading id="location-title" className="font-display text-[2.6rem] leading-[1.02] text-navy-950 sm:text-6xl">{"Lokacioni"}</RevealHeading>
          <p className="mt-4 text-lg text-navy-600">{site.location.intro}</p>
          <p className="mt-6 flex items-center gap-2 font-medium text-navy-900">
            <Icon name="pin" className="size-5 text-gold-600" />
            {address ?? <Pending />}
          </p>
          <dl className="mt-8 divide-y divide-navy-200 border-y border-navy-200">
            {site.location.distances.length === 0 && (
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-navy-700">Distancat deri te shërbimet</dt>
                <dd className="text-right text-navy-500"><Pending /></dd>
              </div>
            )}
            {site.location.distances.map((d) => (
              <div key={d.place} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-navy-700">{d.place}</dt>
                <dd className="text-right font-medium tabular-nums text-navy-900">{d.time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6 lg:col-start-7" aria-labelledby="features-title">
          <RevealHeading id="features-title" className="font-display text-[2.6rem] leading-[1.02] text-navy-950 sm:text-6xl">{"Çfarë e dallon projektin"}</RevealHeading>
          <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {site.features.map((f) => (
              <li key={f.title} className="flex gap-4 border-t border-navy-200 pt-5">
                <Icon name={isIconName(f.icon) ? f.icon : 'check'} className="mt-0.5 size-5 shrink-0 text-gold-600" />
                <div>
                  <h3 className="font-semibold text-navy-900">{f.title}</h3>
                  <p className="mt-1 text-navy-600">{f.text ?? <Pending />}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* map (OpenStreetMap, no API key); loads only when scrolled near. Hidden until the location is confirmed. */}
      <div className="mx-auto mt-20 max-w-[1400px] px-5 sm:px-8">
        {urls ? (
          <>
            <div className="relative aspect-[4/3] overflow-hidden bg-navy-100 sm:aspect-[21/9]">
              <iframe title={`Harta: ${address ?? 'lokacioni i projektit'}`} src={urls.embed} loading="lazy" className="absolute inset-0 size-full border-0 grayscale-[35%]" />
            </div>
            <a href={urls.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-navy-500 underline-offset-4 hover:text-navy-950 hover:underline">
              Hape hartën më të madhe
            </a>
          </>
        ) : (
          <div className="grid aspect-[4/3] place-items-center bg-stone-100 px-6 text-center ring-1 ring-inset ring-navy-200 sm:aspect-[21/9]">
            <div>
              <Icon name="pin" className="mx-auto size-7 text-gold-600" />
              <p className="mt-4 font-display text-3xl text-navy-950 sm:text-4xl">Harta e lokacionit</p>
              <p className="mt-2 text-navy-500">
                <Pending />
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
