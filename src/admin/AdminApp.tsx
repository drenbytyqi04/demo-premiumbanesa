import { lazy, Suspense } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'
import LoginPage from './LoginPage'

const AdminPage = lazy(() => import('../pages/AdminPage'))
const EditorPage = lazy(() => import('../pages/EditorPage'))

const Spinner = () => (
  <div className="grid min-h-[60vh] place-items-center">
    <div className="size-10 animate-spin rounded-full border-4 border-navy-200 border-t-navy-800" />
  </div>
)

/** Everything under #/admin. Not linked from the public site; requires an admin login. */
export default function AdminApp() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

function Gate() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <LoginPage />
  return <Shell />
}

function Shell() {
  const { user, signOut, mode } = useAuth()
  const { complex } = useData()
  const tab = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white'}`

  return (
    <div className="flex min-h-dvh flex-col bg-stone-50">
      <header className="sticky top-0 z-40 bg-navy-950 pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex min-h-14 max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
          <div className="mr-2 leading-tight">
            <div className="font-display text-base font-semibold">{complex.name}</div>
            <div className="text-xs text-navy-400">Paneli i menaxhimit</div>
          </div>
          <nav className="flex gap-1">
            <NavLink to="/admin" end className={tab}>
              Banesat
            </NavLink>
            <NavLink to="/admin/poligonet" className={tab}>
              Poligonet
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            {mode === 'demo' && <span className="hidden rounded-xs bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-300 sm:inline">Demo</span>}
            <a href="#/" target="_blank" rel="noreferrer" className="rounded-xs px-3 py-2 text-navy-200 hover:bg-white/5 hover:text-white">
              Shiko faqen
            </a>
            <span className="hidden text-navy-400 md:inline">{user?.email}</span>
            <button onClick={signOut} className="min-h-10 rounded-xs px-3 font-medium text-white ring-1 ring-white/20 hover:bg-white/10">
              Dil
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route index element={<AdminPage />} />
            <Route path="poligonet" element={<EditorPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
