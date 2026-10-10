import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no IntersectionObserver / matchMedia; motion's whileInView and Lenis need them
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver ??= IO as unknown as typeof IntersectionObserver
window.matchMedia ??= ((q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia

afterEach(() => {
  cleanup()
  localStorage.clear()
})
