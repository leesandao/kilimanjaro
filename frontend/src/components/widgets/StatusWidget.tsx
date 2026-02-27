import { useState, useEffect, useCallback } from 'react'
import { Monitor, Wifi, WifiOff, Clock } from 'lucide-react'
import { apiFetch } from '../../api/client'
import { useWebSocket } from '../../hooks/useWebSocket'
import { Card } from '../common/Card'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { WidgetConfig } from '../../types'

interface SummaryData {
  total_devices: number
  online_devices: number
  offline_devices: number
  last_scan_at: string | null
  subnets: string[]
}

export function StatusWidget({ config }: { config: WidgetConfig }) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await apiFetch<SummaryData>(config.data_endpoint.replace('/api', ''))
      setData(result)
    } catch {
      // keep old data on error
    } finally {
      setLoading(false)
    }
  }, [config.data_endpoint])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useWebSocket(config.refresh_event, fetchData)

  if (loading) return <LoadingSpinner />
  if (!data) return null

  const stats = [
    { label: 'Total Devices', value: data.total_devices, icon: Monitor, color: 'text-blue-600 bg-blue-50' },
    { label: 'Online', value: data.online_devices, icon: Wifi, color: 'text-green-600 bg-green-50' },
    { label: 'Offline', value: data.offline_devices, icon: WifiOff, color: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        </Card>
      ))}
      {data.last_scan_at && (
        <div className="sm:col-span-3 flex items-center gap-2 text-xs text-gray-400 mt-1">
          <Clock size={12} />
          <span>Last scan: {new Date(data.last_scan_at).toLocaleString()}</span>
          <span className="mx-1">|</span>
          <span>Subnets: {data.subnets.join(', ')}</span>
        </div>
      )}
    </div>
  )
}
