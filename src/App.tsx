import { MotionConfig } from 'motion/react'
import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { DataProvider } from './data/DataContext'
import ApartmentsPage from './pages/ApartmentsPage'
import BuildingPage from './pages/BuildingPage'
import ComplexPage from './pages/ComplexPage'
import NotFound from './pages/NotFound'

// heavy routes (Pannellum, editor, admin) load on demand
const ApartmentPage = lazy(() => import('./pages/ApartmentPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const EditorPage = lazy(() => import('./pages/EditorPage'))

const Loading = () => (
  <div className="grid min-h-[60vh] place-items-center">
    <div className="size-10 animate-spin rounded-full border-4 border-navy-200 border-t-navy-800" />
  </div>
)

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <HashRouter>
      <DataProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ComplexPage />} />
            <Route path="buildings/:id" element={<BuildingPage />} />
            <Route path="apartments" element={<ApartmentsPage />} />
            <Route path="apartments/:id" element={<Suspense fallback={<Loading />}><ApartmentPage /></Suspense>} />
            <Route path="admin" element={<Suspense fallback={<Loading />}><AdminPage /></Suspense>} />
            <Route path="editor" element={<Suspense fallback={<Loading />}><EditorPage /></Suspense>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </DataProvider>
    </HashRouter>
    </MotionConfig>
  )
}
