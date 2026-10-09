import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Section heading whose words rise out of a mask, one after another, the first time it scrolls into view.
 * Screen readers get the plain text once (aria-label); the animated words are hidden from them.
 */
export function RevealHeading({
  children,
  id,
  className = '',
  as = 'h2',
  delay = 0,
  immediate = false,
}: {
  children: string
  id?: string
  className?: string
  as?: 'h1' | 'h2'
  delay?: number
  /** animate on mount instead of on scroll (for the hero) */
  immediate?: boolean
}) {
  const reduce = useReducedMotion()
  const Tag = as === 'h1' ? motion.h1 : motion.h2
  const words = children.replace(/ /g, ' ').split(' ')
  if (reduce)
    return (
      <Tag id={id} className={className}>
        {children}
      </Tag>
    )

  const trigger = immediate ? { animate: 'shown' } : { whileInView: 'shown', viewport: { once: true, amount: 0.6 } }
  return (
    <Tag id={id} className={className} aria-label={children} initial="hidden" {...trigger} variants={{ shown: { transition: { staggerChildren: 0.06, delayChildren: delay } } }}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-top">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '105%' }, shown: { y: '0%', transition: { duration: 0.9, ease: EASE } } }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  )
}

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ children, className = '', delay = 0, y = 28 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Image that drifts slightly slower than the page (parallax) and settles from a small zoom when it enters.
 * The wrapper clips, so the image never shows its edges.
 */
export function ParallaxImage({ src, alt, className = '', imgClassName = '', strength = 8 }: { src: string; alt: string; className?: string; imgClassName?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`])

  return (
    <div ref={ref} className={`overflow-hidden ${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        style={reduce ? undefined : { y, scale: 1 + strength / 50 }}
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 1, ease: EASE }}
        className={`size-full object-cover ${imgClassName}`}
      />
    </div>
  )
}
