import { MotionConfig } from 'motion/react'
import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { DataProvider } from './data/DataContext'
import ApartmentsPage from './pages/ApartmentsPage'
import BuildingPage from './pages/BuildingPage'
import ComplexPage from './pages/ComplexPage'
import NotFound from './pages/NotFound'

// heavy routes load on demand; the admin area (login, editing) is its own chunk
// that public visitors never download unless they open #/admin themselves
const ApartmentPage = lazy(() => import('./pages/ApartmentPage'))
const AdminApp = lazy(() => import('./admin/AdminApp'))

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
            {/* public, read-only website */}
            <Route element={<Layout />}>
              <Route index element={<ComplexPage />} />
              <Route path="buildings/:id" element={<BuildingPage />} />
              <Route path="apartments" element={<ApartmentsPage />} />
              <Route
                path="apartments/:id"
                element={
                  <Suspense fallback={<Loading />}>
                    <ApartmentPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* management area: login required */}
            <Route
              path="admin/*"
              element={
                <Suspense fallback={<Loading />}>
                  <AdminApp />
                </Suspense>
              }
            />
            <Route path="editor" element={<Navigate to="/admin/poligonet" replace />} />
          </Routes>
        </DataProvider>
      </HashRouter>
    </MotionConfig>
  )
}
