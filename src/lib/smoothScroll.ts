import Lenis from 'lenis'

let instance: Lenis | null = null

/** Scroll to an element or position, through Lenis when it is running. */
export function scrollToTarget(target: HTMLElement | number, opts: { immediate?: boolean; offset?: number } = {}) {
  if (instance) {
    instance.resize() // the page height may have just changed (route change, images)
    const offset = opts.offset ?? 0
    const lenis = instance
    return lenis.scrollTo(target, {
      offset,
      immediate: opts.immediate,
      duration: 1.4,
      // content above can still grow while we travel (lazy images); land exactly on the target
      onComplete: () => {
        if (typeof target === 'number') return
        const miss = target.getBoundingClientRect().top + offset
        if (Math.abs(miss) > 4) {
          lenis.resize()
          lenis.scrollTo(target, { offset, duration: 0.6 })
        }
      },
    })
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: opts.immediate ? 'instant' : 'smooth' })
  else target.scrollIntoView({ behavior: opts.immediate ? 'instant' : 'smooth' })
}

/**
 * Smooth, inertial page scrolling (desktop mouse/trackpad only).
 * Off on touch devices (native scrolling feels better there) and with "reduce motion".
 */
export function startSmoothScroll() {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!window.matchMedia('(pointer: fine)').matches) return

  const lenis = (instance = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3), anchors: false }))
  const raf = (time: number) => {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)
  return lenis
}

/** Pause page scrolling while a full-screen overlay is open. */
export function setScrollLocked(locked: boolean) {
  if (locked) instance?.stop()
  else instance?.start()
}
