import site from '../../data/site.json'
import { RevealHeading } from '../motion'

/** Frequently asked questions as native <details> (keyboard + screen-reader friendly, no JS). */
export default function Faq() {
  return (
    <section className="bg-paper py-24 sm:py-36" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <RevealHeading id="faq-title" className="font-display text-[2.6rem] leading-[1.02] text-navy-950 sm:text-6xl">{"Pyetje të shpeshta"}</RevealHeading>
          <p className="mt-5 max-w-sm text-[17px] text-navy-600">Nuk e gjeni përgjigjen? Na telefononi ose rezervoni një takim më poshtë.</p>
        </div>
        <div className="divide-y divide-navy-200 border-y border-navy-200 lg:col-span-7 lg:col-start-6">
          {site.faq.map((f) => (
            <details key={f.q} className="faq group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg text-navy-950 transition-colors hover:text-gold-500 sm:text-xl">
                {f.q}
                <span className="relative size-4 shrink-0" aria-hidden="true">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <div className="faq-body">
                <p className="max-w-2xl pb-7 text-[17px] leading-relaxed text-navy-600">{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
