import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { DataProvider } from './data/DataContext'
import AdminPage from './pages/AdminPage'
import ApartmentPage from './pages/ApartmentPage'
import ApartmentsPage from './pages/ApartmentsPage'
import BuildingPage from './pages/BuildingPage'
import ComplexPage from './pages/ComplexPage'
import EditorPage from './pages/EditorPage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ComplexPage />} />
            <Route path="buildings/:id" element={<BuildingPage />} />
            <Route path="apartments" element={<ApartmentsPage />} />
            <Route path="apartments/:id" element={<ApartmentPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="editor" element={<EditorPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </DataProvider>
    </HashRouter>
  )
}
