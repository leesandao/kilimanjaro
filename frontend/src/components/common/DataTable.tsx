import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import clsx from 'clsx'
import { StatusBadge } from './StatusBadge'
import { useResponsive } from '../../hooks/useResponsive'
import type { WidgetColumn } from '../../types'

interface DataTableProps {
  columns: WidgetColumn[]
  data: Record<string, unknown>[]
}

function formatCell(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '-'
  if (key === 'status') return <StatusBadge status={String(value)} />
  if (key === 'last_seen' || key === 'first_seen') {
    return new Date(String(value)).toLocaleString()
  }
  return String(value)
}

export function DataTable({ columns, data }: DataTableProps) {
  const { isMobile } = useResponsive()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const va = String(a[sortKey] ?? '')
        const vb = String(b[sortKey] ?? '')
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
      })
    : data

  // Mobile: card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {sorted.map((row, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-1.5">
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between text-sm">
                <span className="text-gray-500">{col.label}</span>
                <span className="text-gray-900 font-medium">{formatCell(col.key, row[col.key])}</span>
              </div>
            ))}
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-gray-500 py-4">No data</p>
        )}
      </div>
    )
  }

  // Desktop: table layout
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'text-left py-2.5 px-3 text-gray-500 font-medium',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-900'
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && <ArrowUpDown size={14} className="opacity-40" />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="py-2.5 px-3 text-gray-700">
                  {formatCell(col.key, row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="text-center text-gray-500 py-8">No data</p>
      )}
    </div>
  )
}
