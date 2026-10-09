import { motion } from 'motion/react'
import site from '../../data/site.json'
import { RevealHeading } from '../motion'

const { progress } = site

/** Construction phases in order (a real sequence), with the current one marked. */
export default function ConstructionProgress() {
  const done = progress.phases.filter((p) => p.status === 'done').length
  const current = progress.phases.findIndex((p) => p.status === 'current')
  const pct = ((done + (current >= 0 ? 0.5 : 0)) / progress.phases.length) * 100

  return (
    <section className="bg-navy-950 py-24 text-white sm:py-36" aria-labelledby="progress-title">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <RevealHeading id="progress-title" className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl md:col-span-7">{progress.title}</RevealHeading>
          <p className="max-w-md text-[17px] text-white/65 md:col-span-5">
            {progress.text} Përditësimi i fundit: <span className="text-white">{progress.updated}</span>.
          </p>
        </div>

        <div className="mt-16 h-[3px] bg-white/15" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Ecuria e punimeve">
          <motion.div
            className="h-full origin-left bg-gold-400"
            style={{ width: `${pct}%` }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 1 }}
            transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
          />
        </div>

        <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {progress.phases.map((p, i) => (
            <li key={p.title} className="relative" aria-current={p.status === 'current' ? 'step' : undefined}>
              <div className="flex items-center gap-3 text-sm">
                <span
                  className={`grid size-7 place-items-center text-xs tabular-nums ${
                    p.status === 'done' ? 'bg-white text-navy-950' : p.status === 'current' ? 'bg-gold-500 text-white' : 'ring-1 ring-white/30 text-white/60'
                  }`}
                >
                  {p.status === 'done' ? (
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={p.status === 'next' ? 'text-white/50' : 'text-white/80'}>{p.date}</span>
              </div>
              <h3 className={`mt-4 text-lg leading-snug ${p.status === 'next' ? 'text-white/60' : 'text-white'}`}>{p.title}</h3>
              {p.status === 'current' && <p className="mt-1 text-sm text-gold-300">Në punë tani</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
