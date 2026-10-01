import site from '../../data/site.json'
import { Icon, type IconName } from '../icons'

export default function LocationFeatures() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5" aria-labelledby="location-title">
          <h2 id="location-title" className="font-display text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
            Afër gjithçkaje që ju duhet çdo ditë
          </h2>
          <p className="mt-4 text-lg text-navy-600">{site.location.intro}</p>
          <p className="mt-6 flex items-center gap-2 font-medium text-navy-900">
            <Icon name="pin" className="size-5 text-gold-600" />
            {site.location.address}
          </p>
          <dl className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
            {site.location.distances.map((d) => (
              <div key={d.place} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-navy-700">{d.place}</dt>
                <dd className="text-right font-medium tabular-nums text-navy-900">{d.time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6 lg:col-start-7" aria-labelledby="features-title">
          <h2 id="features-title" className="font-display text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
            Ndërtuar për të jetuar gjatë
          </h2>
          <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {site.features.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-stone-100 text-navy-800">
                  <Icon name={f.icon as IconName} className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-navy-900">{f.title}</h3>
                  <p className="mt-1 text-navy-600">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
