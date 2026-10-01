import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { asset, centroid, toPoints } from '../lib/format'
import type { ImageRef, Point } from '../types'

export interface OverlayShape {
  id: string
  points: Point[]
  /** "r g b" colour triplet, e.g. "34 197 94" */
  rgb: string
  dimmed?: boolean
  label: string
}

interface Props {
  image: ImageRef
  shapes: OverlayShape[]
  renderTooltip: (id: string) => ReactNode
  onSelect: (id: string) => void
  /** CTA label shown in the tooltip on touch devices (tap once = preview, tap again = open) */
  ctaLabel?: string
  className?: string
  imgClassName?: string
  children?: ReactNode
  /** draw the outlines in one after another once the image has loaded */
  intro?: boolean
  /** highlight a shape from outside (e.g. hovering a list item) */
  highlightId?: string | null
}

interface Tip {
  id: string
  x: number
  y: number
  touch: boolean
}

/**
 * Image with an SVG overlay that uses the image's own pixel size as viewBox,
 * so polygons stay glued to the picture at every screen size.
 */
export default function ImageOverlay({ image, shapes, renderTooltip, onSelect, ctaLabel = 'Shiko', className = '', imgClassName = '', children, intro = false, highlightId = null }: Props) {
  const reduce = useReducedMotion()
  const animateIn = intro && !reduce
  const wrap = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const [loaded, setLoaded] = useState(false)
  const lastPointer = useRef<string>('mouse')

  // clear touch tooltip when tapping outside
  useEffect(() => {
    if (!tip?.touch) return
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setTip(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [tip?.touch])

  useEffect(() => setLoaded(false), [image.image])

  const rel = (clientX: number, clientY: number) => {
    const r = wrap.current!.getBoundingClientRect()
    return { x: clientX - r.left, y: clientY - r.top }
  }

  const anchorAtCentroid = (id: string, touch: boolean): Tip => {
    const shape = shapes.find((s) => s.id === id)!
    const r = wrap.current!.getBoundingClientRect()
    const [cx, cy] = centroid(shape.points)
    const minY = Math.min(...shape.points.map((p) => p[1]))
    return { id, x: (cx / image.width) * r.width, y: (((minY + cy) / 2) / image.height) * r.height, touch }
  }

  const width = wrap.current?.clientWidth ?? 0
  const tipX = tip ? Math.min(Math.max(tip.x, 110), Math.max(110, width - 110)) : 0
  const below = tip ? tip.y < 150 : false

  return (
    <div ref={wrap} className={`relative select-none ${className}`}>
      <img
        src={asset(image.image)}
        alt=""
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={`block h-auto w-full transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
      {!loaded && <div className="absolute inset-0 animate-pulse bg-navy-100" />}

      <svg
        viewBox={`0 0 ${image.width} ${image.height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        onPointerLeave={() => !tip?.touch && setTip(null)}
      >
        {shapes.map((s, i) =>
          s.points.length > 2 ? (
            <motion.polygon
              key={s.id}
              points={toPoints(s.points)}
              initial={animateIn ? { pathLength: 0, fillOpacity: 0 } : false}
              animate={animateIn && loaded ? { pathLength: 1, fillOpacity: 1 } : undefined}
              transition={{
                pathLength: { duration: 1.1, delay: 0.35 + i * 0.28, ease: [0.65, 0, 0.35, 1] },
                fillOpacity: { duration: 0.6, delay: 1.1 + i * 0.28 },
              }}
              className="overlay-shape"
              style={{ ['--shape-rgb' as string]: s.rgb }}
              data-dimmed={s.dimmed ? 'true' : 'false'}
              data-active={tip?.id === s.id || highlightId === s.id ? 'true' : 'false'}
              tabIndex={s.dimmed ? -1 : 0}
              role="link"
              aria-label={s.label}
              onPointerDown={(e) => (lastPointer.current = e.pointerType)}
              onPointerMove={(e) => {
                if (e.pointerType !== 'mouse') return
                const p = rel(e.clientX, e.clientY)
                setTip({ id: s.id, ...p, touch: false })
              }}
              onClick={() => {
                if (lastPointer.current === 'mouse') return onSelect(s.id)
                // touch / pen: first tap previews, second tap opens
                if (tip?.id === s.id && tip.touch) onSelect(s.id)
                else setTip(anchorAtCentroid(s.id, true))
              }}
              onFocus={(e) => {
                if (e.currentTarget.matches(':focus-visible')) setTip(anchorAtCentroid(s.id, false))
              }}
              onBlur={() => !tip?.touch && setTip(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(s.id)
                }
              }}
            />
          ) : null,
        )}
      </svg>

      {tip && (
        <div
          className={`absolute z-20 w-max max-w-[220px] rounded-xl bg-white/95 p-3 text-sm shadow-xl shadow-navy-900/20 ring-1 ring-navy-900/10 backdrop-blur ${tip.touch ? '' : 'pointer-events-none'}`}
          style={{
            left: tipX,
            top: tip.y,
            transform: below ? 'translate(-50%, 18px)' : 'translate(-50%, calc(-100% - 14px))',
          }}
        >
          {renderTooltip(tip.id)}
          {tip.touch && (
            <button
              onClick={() => onSelect(tip.id)}
              className="mt-2 w-full rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white active:bg-navy-700"
            >
              {ctaLabel} →
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
