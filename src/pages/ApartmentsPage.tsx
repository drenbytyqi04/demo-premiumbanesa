import { useSearchParams } from 'react-router-dom'
import ApartmentTable from '../components/ApartmentTable'
import Filters, { matches, useFilters } from '../components/Filters'
import { PageHeader } from '../components/ui'
import { useData } from '../data/DataContext'

export default function ApartmentsPage() {
  const { apartments, buildings } = useData()
  const filters = useFilters()
  const [params, setParams] = useSearchParams()
  const buildingId = params.get('ndertesa')

  const list = apartments
    .filter((a) => !buildingId || a.buildingId === buildingId)
    .sort((a, b) => a.buildingId.localeCompare(b.buildingId) || a.floor - b.floor || a.number.localeCompare(b.number))
  const filtered = list.filter((a) => matches(a, filters.state))

  const setBuilding = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('ndertesa', id)
    else next.delete('ndertesa')
    setParams(next, { replace: true })
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
      <PageHeader eyebrow="Të gjitha ndërtesat" title="Apartamentet">
        <div className="flex gap-1 rounded-xs bg-navy-50 p-1">
          {[null, ...buildings.map((b) => b.id)].map((id) => (
            <button
              key={id ?? 'all'}
              onClick={() => setBuilding(id)}
              className={`rounded-xs px-4 py-2 text-sm font-semibold transition ${buildingId === id ? 'bg-navy-900 text-white shadow' : 'text-navy-600 hover:bg-white'}`}
            >
              {id ?? 'Të gjitha'}
            </button>
          ))}
        </div>
      </PageHeader>
      <div className="mb-6">
        <Filters apartments={list} filters={filters} resultCount={filtered.length} />
      </div>
      <ApartmentTable apartments={filtered} showBuilding />
    </div>
  )
}
