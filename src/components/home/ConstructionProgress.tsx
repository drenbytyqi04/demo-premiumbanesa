import { motion } from 'motion/react'
import site from '../../data/site'
import { progressPercent } from '../../lib/domain'
import { Icon } from '../icons'
import { RevealHeading } from '../motion'
import { IllustrativeTag, Pending } from '../ui'

const { progress } = site

/**
 * Construction phases in order (a real sequence). Dates, states and the progress bar appear only
 * once they are configured in site.json; until then each phase shows "Të dhënat së shpejti".
 */
export default function ConstructionProgress() {
  const pct = progressPercent(progress.phases)

  return (
    <section className="bg-navy-950 py-24 text-white sm:py-36" aria-labelledby="progress-title">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <RevealHeading id="progress-title" className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl md:col-span-7">{progress.title}</RevealHeading>
          <div className="max-w-md text-[17px] text-white/65 md:col-span-5">
            <p>
              {progress.text}
              {progress.updated && (
                <>
                  {' '}
                  Përditësimi i fundit: <span className="text-white">{progress.updated}</span>.
                </>
              )}
            </p>
            {progress.illustrative && (
              <p className="mt-4">
                <IllustrativeTag dark>Fazat ilustruese</IllustrativeTag>
              </p>
            )}
          </div>
        </div>

        {pct === null ? (
          <div className="mt-16 h-px bg-white/15" aria-hidden="true" />
        ) : (
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
        )}

        <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {progress.phases.map((p, i) => (
            <li key={p.title} className="relative" aria-current={p.status === 'current' ? 'step' : undefined}>
              <div className="flex items-center gap-3 text-sm">
                <span
                  className={`grid size-7 shrink-0 place-items-center text-xs tabular-nums ${
                    p.status === 'done' ? 'bg-white text-navy-950' : p.status === 'current' ? 'bg-gold-500 text-navy-950' : 'text-white/60 ring-1 ring-white/30'
                  }`}
                >
                  {p.status === 'done' ? <Icon name="check" className="size-4" strokeWidth={2.2} /> : i + 1}
                  {p.status === 'done' && <span className="sr-only">E përfunduar</span>}
                </span>
                <span className="text-white/60">{p.date ?? <Pending />}</span>
              </div>
              <h3 className={`mt-4 text-lg leading-snug ${p.status === 'done' || p.status === 'current' ? 'text-white' : 'text-white/70'}`}>{p.title}</h3>
              {p.status === 'current' && <p className="mt-1 text-sm text-gold-300">Në punë tani</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
