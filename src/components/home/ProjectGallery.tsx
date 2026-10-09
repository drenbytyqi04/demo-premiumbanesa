import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import site from '../../data/site.json'
import { asset } from '../../lib/format'

const images = site.gallery.images

/** Renders of the project in a masonry layout; opens a full-screen viewer on click. */
export default function ProjectGallery() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="bg-stone-100 py-20 sm:py-28" aria-labelledby="gallery-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="gallery-title" className="font-display text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl md:col-span-6">
            {site.gallery.title}
          </h2>
          <p className="max-w-lg text-lg text-navy-600 md:col-span-6">{site.gallery.text}</p>
        </div>

        <ul className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {images.map((img, i) => (
            <li key={img.src} className="mb-4 break-inside-avoid">
              <button
                onClick={() => setOpen(i)}
                className="group relative block w-full overflow-hidden rounded-2xl bg-stone-200 focus-visible:outline-offset-4"
                aria-label={`Hap foton: ${img.alt}`}
              >
                <img
                  src={asset(img.thumb)}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  loading="lazy"
                  className="h-auto w-full transition duration-700 group-hover:scale-[1.03]"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>{open !== null && <Lightbox index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  )
}

function Lightbox({ index, onIndex, onClose }: { index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)
  const img = images[index]
  const go = useCallback((d: number) => onIndex((index + d + images.length) % images.length), [index, onIndex])

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Galeria e projektit"
      className="fixed inset-0 z-50 flex flex-col bg-navy-950/95 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0)
        if (touchX.current !== null && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-sm tabular-nums text-navy-300">
          {index + 1} / {images.length}
        </span>
        <button ref={closeRef} onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Mbyll">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={img.src}
            src={asset(img.src)}
            alt={img.alt}
            className="max-h-full max-w-full rounded-lg object-contain"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
        <NavButton dir={-1} onClick={() => go(-1)} />
        <NavButton dir={1} onClick={() => go(1)} />
      </div>

      <p className="px-4 py-4 text-center text-sm text-navy-200 sm:px-6">{img.alt}</p>
    </motion.div>
  )
}

function NavButton({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir < 0 ? 'Foto e mëparshme' : 'Foto tjetër'}
      className={`absolute top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 transition hover:bg-white/20 sm:grid ${dir < 0 ? 'left-4' : 'right-4'}`}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  )
}
