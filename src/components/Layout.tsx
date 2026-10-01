import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useData } from '../data/DataContext'

const NAV = [
  { to: '/', label: 'Ballina', end: true },
  { to: '/apartments', label: 'Apartamentet', end: false },
  { to: '/admin', label: 'Admin', end: false },
  { to: '/editor', label: 'Editori', end: false },
]

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
              <span className="block font-display text-lg font-semibold tracking-wide">{complex.name}</span>
              <span className="hidden text-[11px] uppercase tracking-[0.2em] text-navy-300 sm:block">{complex.location}</span>
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
          </nav>

          <button
            className="grid size-10 place-items-center rounded-lg hover:bg-white/10 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menyja"
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
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-950 text-navy-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {complex.name} · Projekt demonstrues me të dhëna fiktive
          </p>
          <p className="text-navy-400">Panoramat 360°: Poly Haven (CC0)</p>
        </div>
      </footer>
    </div>
  )
}
