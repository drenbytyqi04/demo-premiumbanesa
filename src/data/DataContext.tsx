import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { backendMode } from '../lib/supabase'
import type { PolygonExport } from '../types'
import type { Inquiry } from '../lib/inquiry'
import { repository, type ApartmentPatch, type DataSnapshot } from './repository'

interface DataContextValue extends DataSnapshot {
  updateApartment: (id: string, patch: ApartmentPatch) => Promise<void>
  savePolygons: (data: PolygonExport) => Promise<void>
  reset: () => Promise<void>
  submitInquiry: (inquiry: Inquiry) => Promise<void>
}

const Ctx = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  // only the newest request may update state, so a slow old response never overwrites fresh data
  const latest = useRef(0)

  const reload = useCallback(() => {
    const req = ++latest.current
    repository.load().then(
      (d) => {
        if (req !== latest.current) return
        setData(d)
        setError(null)
      },
      (e: unknown) => {
        if (req !== latest.current) return
        setError(e instanceof Error ? e.message : String(e))
      },
    )
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
        submitInquiry: repository.submitInquiry,
      },
    [data],
  )

  // Supabase configured but unreachable: say so, never fall back to demo inventory
  if (error && !data)
    return (
      <div role="alert" className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-6 text-center">
        <div>
          <p className="font-display text-4xl text-navy-950">Të dhënat nuk u ngarkuan</p>
          <p className="mt-3 text-navy-600">
            {backendMode === 'supabase'
              ? 'Lidhja me bazën e të dhënave dështoi. Disponueshmëria e banesave nuk mund të shfaqet tani.'
              : 'Ndodhi një gabim gjatë leximit të të dhënave.'}
          </p>
          <p className="mt-2 text-sm text-navy-400">{error}</p>
          <button onClick={reload} className="mt-6 min-h-11 bg-navy-950 px-6 font-medium text-white hover:bg-gold-500 hover:text-navy-950">
            Provo përsëri
          </button>
        </div>
      </div>
    )
  if (!value)
    return (
      <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Duke ngarkuar">
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
