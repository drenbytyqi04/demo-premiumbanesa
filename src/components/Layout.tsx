import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useData } from '../data/DataContext'
import site from '../data/site.json'

const year = new Date().getFullYear()

const NAV = [
  { to: '/', label: 'Ballina', end: true },
  { to: '/apartments', label: 'Banesat', end: false },
]

// demo tools for the sales team; kept out of the public navigation
const STAFF = [
  { to: '/admin', label: 'Admin' },
  { to: '/editor', label: 'Editori i poligoneve' },
]

const CONTACT = { pathname: '/', search: '?s=kontakt' }

export default function Layout() {
  const { complex } = useData()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 bg-navy-900/95 pt-[env(safe-area-inset-top)] text-white shadow-lg shadow-navy-950/20 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-gold-500/15 ring-1 ring-gold-500/40">
              <svg viewBox="0 0 24 24" className="size-5 fill-gold-400">
                <path d="M4 20V9.5l8-6 8 6V20h-5.5v-6h-5v6z" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold">{complex.name}</span>
              <span className="hidden text-xs text-navy-300 sm:block">{complex.location}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-white/10 text-gold-300' : 'text-navy-100 hover:bg-white/5 hover:text-white'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link to={CONTACT} className="ml-3 inline-flex min-h-10 items-center rounded-full bg-gold-500 px-5 text-sm font-semibold text-navy-950 transition hover:bg-gold-400">
              Rezervo takim
            </Link>
          </nav>

          <button
            className="grid size-11 place-items-center rounded-lg hover:bg-white/10 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menyja"
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" className="size-6 stroke-white" fill="none" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
        {open && (
          <nav className="border-t border-white/10 px-4 pb-4 md:hidden">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-3 text-base ${isActive ? 'bg-white/10 text-gold-300' : 'text-navy-100'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link to={CONTACT} className="mt-2 flex min-h-12 items-center justify-center rounded-full bg-gold-500 font-semibold text-navy-950">
              Rezervo takim
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-950 text-navy-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-display text-xl font-semibold text-white">{complex.name}</div>
            <p className="mt-3 max-w-sm">{complex.tagline}. {site.location.address}.</p>
          </div>
          <nav className="md:col-span-3" aria-label="Faqet">
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-white">Ballina</Link></li>
              <li><Link to="/apartments" className="hover:text-white">Të gjitha banesat</Link></li>
              <li><Link to="/apartments?lira=1" className="hover:text-white">Banesat e lira</Link></li>
              <li><Link to={CONTACT} className="hover:text-white">Kontakti</Link></li>
            </ul>
          </nav>
          <div className="md:col-span-4">
            <a href={`tel:${site.contact.phone.replace(/\s/g, '')}`} className="block text-lg font-medium text-white hover:text-gold-300">
              {site.contact.phone}
            </a>
            <a href={`mailto:${site.contact.email}`} className="mt-1 block hover:text-white">
              {site.contact.email}
            </a>
            <p className="mt-1">{site.contact.hours}</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-navy-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© {year} {complex.name}. Projekt demonstrues me të dhëna fiktive. Panoramat 360°: Poly Haven (CC0).</p>
            <ul className="flex gap-4">
              {STAFF.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="hover:text-white">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
