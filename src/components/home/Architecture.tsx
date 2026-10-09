import site from '../../data/site.json'
import { asset } from '../../lib/format'
import { ParallaxImage, Reveal, RevealHeading } from '../motion'

/** The architectural idea in three image/text rows, alternating sides. */
export default function Architecture() {
  return (
    <section className="bg-paper py-24 sm:py-36" aria-labelledby="arch-title">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <RevealHeading id="arch-title" className="max-w-3xl font-display text-[2.6rem] leading-[1.02] text-navy-950 sm:text-6xl lg:text-7xl">{"Një ndërtesë e menduar nga oborri deri te çatia"}</RevealHeading>

        <div className="mt-16 space-y-20 sm:mt-24 sm:space-y-32">
          {site.concept.map((c, i) => (
            <article key={c.title} className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
              <ParallaxImage
                src={asset(c.image)}
                alt={c.alt}
                className={`aspect-[4/3] md:col-span-7 md:aspect-[5/4] ${i % 2 ? 'md:order-2 md:col-start-6' : ''}`}
              />
              <Reveal className={`md:col-span-4 ${i % 2 ? 'md:order-1 md:col-start-1' : 'md:col-start-9'}`} delay={0.15}>
                <h3 className="font-display text-4xl leading-[1.05] text-navy-950 sm:text-5xl">{c.title}</h3>
                <p className="mt-5 text-[17px] leading-relaxed text-navy-600">{c.text}</p>
              </Reveal>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
