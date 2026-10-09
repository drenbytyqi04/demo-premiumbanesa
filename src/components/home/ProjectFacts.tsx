import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useData } from '../../data/DataContext'
import site from '../../data/site.json'

/** The project in numbers: live counts from the data + a few facts from site.json. */
export default function ProjectFacts() {
  const { buildings, apartments } = useData()
  const floors = Math.max(...buildings.map((b) => b.floors))
  const free = apartments.filter((a) => a.status === 'available').length

  const facts: { value: string | number; label: string }[] = [
    { value: buildings.length, label: buildings.length === 1 ? 'Lamelë' : 'Lamela të lidhura në majë' },
    { value: floors, label: 'Kate banimi mbi dyqanet' },
    { value: apartments.length, label: `Banesa, ${free} ende të lira` },
    ...site.highlights,
  ]

  return (
    <section className="border-b border-navy-200 bg-paper" aria-label="Projekti në shifra">
      <dl className="mx-auto grid max-w-[1400px] grid-cols-2 px-5 sm:px-8 md:grid-cols-3 lg:grid-cols-6">
        {facts.map((f, i) => (
          <div
            key={f.label}
            className={`flex flex-col border-navy-200 py-10 pr-4 ${i % 2 ? 'pl-5 max-md:border-l' : ''} md:border-l md:pl-6 md:first:border-l-0 md:first:pl-0 lg:py-14 ${i >= 2 ? 'max-md:border-t' : ''} ${i >= 3 ? 'md:max-lg:border-t' : ''} ${i === 3 ? 'md:max-lg:border-l-0 md:max-lg:pl-0' : ''}`}
          >
            <dt className="order-2 mt-2 text-sm leading-snug text-navy-500">{f.label}</dt>
            <dd className="font-display text-5xl leading-none text-navy-950 sm:text-6xl">
              {typeof f.value === 'number' ? <CountUp to={f.value} /> : f.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** Counts up once when scrolled into view; shows the final number straight away with reduced motion. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? to : 0)

  useEffect(() => {
    if (!inView || reduce) return setN(to)
    const c = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [inView, reduce, to])

  return (
    <span ref={ref} className="tabular-nums">
      {n}
    </span>
  )
}
