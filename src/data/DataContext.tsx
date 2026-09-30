import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PolygonExport } from '../types'
import { repository, type ApartmentPatch, type DataSnapshot } from './repository'

interface DataContextValue extends DataSnapshot {
  updateApartment: (id: string, patch: ApartmentPatch) => Promise<void>
  savePolygons: (data: PolygonExport) => Promise<void>
  reset: () => Promise<void>
}

const Ctx = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    repository.load().then(setData, (e) => setError(String(e)))
  }, [])

  useEffect(() => {
    reload()
    return repository.subscribe(reload)
  }, [reload])

  const value = useMemo<DataContextValue | null>(
    () =>
      data && {
        ...data,
        updateApartment: repository.updateApartment,
        savePolygons: repository.savePolygons,
        reset: repository.reset,
      },
    [data],
  )

  if (error) return <div className="p-10 text-center text-red-600">Gabim gjatë ngarkimit të të dhënave: {error}</div>
  if (!value)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-10 animate-spin rounded-full border-4 border-navy-200 border-t-navy-800" />
      </div>
    )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData must be used inside <DataProvider>')
  return v
}
