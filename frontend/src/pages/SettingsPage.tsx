import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import { Card } from '../components/common/Card'

export function SettingsPage() {
  const [info, setInfo] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    apiFetch<Record<string, unknown>>('/info').then(setInfo).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">System information and configuration</p>
      </div>

      <Card title="System Info">
        {info ? (
          <dl className="space-y-2 text-sm">
            {Object.entries(info).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-gray-500">{key}</dt>
                <dd className="text-gray-900 font-medium">{String(val)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-gray-400">Loading...</p>
        )}
      </Card>
    </div>
  )
}
