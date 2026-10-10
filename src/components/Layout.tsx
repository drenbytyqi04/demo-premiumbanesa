import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useData } from '../data/DataContext'
import site, { telHref } from '../data/site'
import { Pending } from './ui'
import { scrollToTarget } from '../lib/smoothScroll'

const year = new Date().getFullYear()

const NAV = [
  { to: '/', label: 'Projekti', end: true },
  { to: '/apartments', label: 'Banesat', end: false },
  { to: { pathname: '/', search: '?s=lokacioni' }, label: 'Lokacioni', end: true, section: true },
]

const CONTACT = { pathname: '/', search: '?s=kontakt' }

export default function Layout() {
  const { complex } = useData()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const overHero = pathname === '/' // the homepage header floats over the photo

  useEffect(() => {
    setOpen(false)
    scrollToTarget(0, { immediate: true })
  }, [pathname])

  // the header slides away while scrolling down and returns when scrolling up
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  // no fade on the very first page load (the hero has its own entrance), only between pages
  const firstPage = useRef(true)
  useEffect(() => {
    firstPage.current = false
  }, [])
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      if (Math.abs(y - lastY.current) > 6) {
        setHidden(y > lastY.current && y > 400)
        lastY.current = y
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const light = overHero && !scrolled && !open // white text on the photo
  const linkCls = (active: boolean) =>
    `relative py-2 text-[15px] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:transition-transform ${
      light ? 'text-white/85 hover:text-white after:bg-white' : 'text-navy-700 hover:text-navy-950 after:bg-navy-900'
    } ${active ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}`

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className={`${overHero ? 'fixed' : 'sticky'} inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow,color,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${hidden && !open ? '-translate-y-full' : ''} ${
          light ? 'bg-gradient-to-b from-navy-950/55 to-transparent' : 'bg-paper/92 shadow-[0_1px_0_var(--color-navy-200)] backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className={`font-display text-[26px] leading-none tracking-tight ${light ? 'text-white' : 'text-navy-950'}`}>
            {complex.name}
          </Link>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Kryesore">
            {NAV.map((n) => (
              <NavLink key={n.label} to={n.to} end={n.end} className={({ isActive }) => linkCls(isActive && !n.section)}>
                {n.label}
              </NavLink>
            ))}
            <Link
              to={CONTACT}
              className={`inline-flex h-11 items-center px-5 text-[15px] font-medium transition-colors ${
                light ? 'bg-white text-navy-950 hover:bg-gold-500 hover:text-white' : 'bg-navy-950 text-white hover:bg-gold-500'
              }`}
            >
              Rezervo takim
            </Link>
          </nav>

          <button
            className={`-mr-2 grid size-11 place-items-center md:hidden ${light ? 'text-white' : 'text-navy-950'}`}
            onClick={() => setOpen((o) => !o)}
            aria-label="Menyja"
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 9h16M4 15h16" />}
            </svg>
          </button>
        </div>
        {open && (
          <nav className="border-t border-navy-200 bg-paper px-5 pb-6 pt-2 md:hidden" aria-label="Kryesore">
            {NAV.map((n) => (
              <NavLink
                key={n.label}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `block border-b border-navy-100 py-4 font-display text-3xl ${isActive && !n.section ? "text-gold-500" : "text-navy-950"}`}
              >
                {n.label}
              </NavLink>
            ))}
            <Link to={CONTACT} className="mt-6 flex h-12 items-center justify-center bg-navy-950 font-medium text-white">
              Rezervo takim
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">
        {/* page transition: each page fades in */}
        <motion.div key={pathname} initial={firstPage.current ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <Outlet />
        </motion.div>
      </main>

      <footer className="bg-navy-950 text-navy-300">
        <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-20 sm:px-8">
          <div className="grid gap-12 border-b border-white/10 pb-16 md:grid-cols-12">
            <div className="md:col-span-6">
              <div className="font-display text-5xl text-white sm:text-6xl">{complex.name}</div>
              <p className="mt-5 max-w-sm leading-relaxed">{site.location.address ?? 'Adresa: të dhënat së shpejti'}</p>
            </div>
            <nav className="md:col-span-2" aria-label="Faqet">
              <ul className="space-y-3">
                <li><Link to="/" className="hover:text-white">Projekti</Link></li>
                <li><Link to="/apartments" className="hover:text-white">Të gjitha banesat</Link></li>
                <li><Link to="/apartments?lira=1" className="hover:text-white">Banesat e lira</Link></li>
                <li><Link to={CONTACT} className="hover:text-white">Kontakti</Link></li>
              </ul>
            </nav>
            <div className="md:col-span-4">
              <div className="text-sm uppercase tracking-[0.14em] text-navy-400">Kontakti</div>
              {site.contact.phone ? (
                <a href={telHref(site.contact.phone)} className="mt-3 block font-display text-3xl text-white hover:text-gold-300">
                  {site.contact.phone}
                </a>
              ) : (
                <p className="mt-3">
                  Telefoni dhe emaili: <Pending />
                </p>
              )}
              {site.contact.email && (
                <a href={`mailto:${site.contact.email}`} className="mt-3 block hover:text-white">
                  {site.contact.email}
                </a>
              )}
              {site.contact.hours && <p className="mt-1">{site.contact.hours}</p>}
              <Link to={CONTACT} className="mt-4 inline-block text-white underline-offset-4 hover:underline">
                Na shkruani përmes formularit
              </Link>
            </div>
          </div>
          <p className="pt-8 text-sm text-navy-400">
            © {year} {complex.name}. Faqe demonstruese: çmimet, statuset, planet dhe pamjet 360° janë ilustruese. Panoramat 360°: Poly Haven (CC0).
          </p>
        </div>
      </footer>
    </div>
  )
}
