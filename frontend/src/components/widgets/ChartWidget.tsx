import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { apiFetch } from '../../api/client'
import { useWebSocket } from '../../hooks/useWebSocket'
import { Card } from '../common/Card'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { WidgetConfig } from '../../types'

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChartWidget({ config }: { config: WidgetConfig }) {
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

  const chartData = data.map((d) => ({
    ...d,
    time: d.timestamp ? formatTimestamp(String(d.timestamp)) : '',
  }))

  const renderChart = () => {
    const commonProps = { data: chartData }

    if (config.chart_type === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Bar dataKey="online_count" fill="#22c55e" name="Online" />
          <Bar dataKey="offline_count" fill="#ef4444" name="Offline" />
        </BarChart>
      )
    }

    if (config.chart_type === 'area') {
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="online_count" stroke="#22c55e" fill="#22c55e33" name="Online" />
          <Area type="monotone" dataKey="offline_count" stroke="#ef4444" fill="#ef444433" name="Offline" />
        </AreaChart>
      )
    }

    // Default: line chart
    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="online_count" stroke="#22c55e" strokeWidth={2} dot={false} name="Online" />
        <Line type="monotone" dataKey="offline_count" stroke="#ef4444" strokeWidth={2} dot={false} name="Offline" />
        <Line type="monotone" dataKey="total_count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
      </LineChart>
    )
  }

  return (
    <Card title={config.title}>
      {chartData.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No history data yet. Waiting for scans...</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          {renderChart()}
        </ResponsiveContainer>
      )}
    </Card>
  )
}
