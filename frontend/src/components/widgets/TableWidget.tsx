import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../../api/client'
import { useWebSocket } from '../../hooks/useWebSocket'
import { Card } from '../common/Card'
import { DataTable } from '../common/DataTable'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { WidgetConfig } from '../../types'

export function TableWidget({ config }: { config: WidgetConfig }) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await apiFetch<Record<string, unknown>[]>(config.data_endpoint.replace('/api', ''))
      setData(result)
    } catch {
      // keep old data
    } finally {
      setLoading(false)
    }
  }, [config.data_endpoint])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useWebSocket(config.refresh_event, fetchData)

  if (loading) return <LoadingSpinner />

  return (
    <Card title={config.title}>
      <DataTable columns={config.columns || []} data={data} />
    </Card>
  )
}
