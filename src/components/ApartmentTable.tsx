import { Link, useNavigate } from 'react-router-dom'
import { formatArea, formatPrice } from '../lib/format'
import type { Apartment } from '../types'
import { StatusBadge } from './ui'

export default function ApartmentTable({ apartments, showBuilding = false, compact = false }: { apartments: Apartment[]; showBuilding?: boolean; compact?: boolean }) {
  const navigate = useNavigate()
  if (!apartments.length)
    return <p className="rounded-xs bg-navy-50 p-8 text-center text-navy-500">Asnjë apartament nuk përputhet me filtrat.</p>

  return (
    <>
      {/* mobile: cards */}
      <div className="grid gap-3 sm:hidden">
        {apartments.map((a) => (
          <Link
            key={a.id}
            to={`/apartments/${a.id}`}
            className="flex items-center justify-between rounded-xs bg-white p-4 ring-1 ring-navy-200 active:bg-navy-50"
          >
            <div>
              <div className="font-semibold">
                {showBuilding && `${a.buildingId} · `}Nr. {a.number}
              </div>
              <div className="text-sm text-navy-500">
                Kati {a.floor} · {a.rooms} dh. · {formatArea(a.area)}
              </div>
            </div>
            <div className="text-right">
              <StatusBadge status={a.status} />
              <div className="mt-1 text-sm font-semibold">{a.status === 'sold' ? '—' : formatPrice(a.price)}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* desktop: table */}
      <div className="hidden overflow-hidden rounded-xs bg-white ring-1 ring-navy-200 sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              {showBuilding && <th className="px-4 py-3">Ndërtesa</th>}
              <th className="px-4 py-3">Nr.</th>
              <th className="px-4 py-3">Kati</th>
              <th className="px-4 py-3">Dhoma</th>
              <th className="px-4 py-3">Sipërfaqja</th>
              <th className="px-4 py-3">Çmimi</th>
              <th className="px-4 py-3">Statusi</th>
              {!compact && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {apartments.map((a) => (
              <tr key={a.id} className="cursor-pointer transition hover:bg-navy-50/60" onClick={() => navigate(`/apartments/${a.id}`)}>
                {showBuilding && <td className="px-4 py-3 font-medium">{a.buildingId}</td>}
                <td className="px-4 py-3 font-semibold">
                  {/* the number is the row's link for keyboard users; the whole row is clickable with the mouse */}
                  <Link to={`/apartments/${a.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-gold-500">
                    {a.number}
                  </Link>
                </td>
                <td className="px-4 py-3">{a.floor}</td>
                <td className="px-4 py-3">{a.rooms}</td>
                <td className="px-4 py-3">{formatArea(a.area)}</td>
                <td className="px-4 py-3 font-medium">{a.status === 'sold' ? '—' : formatPrice(a.price)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status} />
                </td>
                {!compact && <td className="px-4 py-3 text-right">
                  <Link to={`/apartments/${a.id}`} className="font-medium text-gold-600 hover:text-navy-900" onClick={(e) => e.stopPropagation()}>
                    Detajet
                  </Link>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
