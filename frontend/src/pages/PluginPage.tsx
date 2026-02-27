import { useCallback } from 'react'
import { Play } from 'lucide-react'
import { WidgetRenderer } from '../components/widgets/WidgetRenderer'
import type { PluginManifest } from '../types'

interface PluginPageProps {
  manifest: PluginManifest
}

export function PluginPage({ manifest }: PluginPageProps) {
  const handleManualScan = useCallback(async () => {
    try {
      await fetch(`${manifest.api_prefix}/scan`, { method: 'POST' })
    } catch {
      // ignore
    }
  }, [manifest.api_prefix])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{manifest.display_name}</h2>
          <p className="text-sm text-gray-500 mt-1">{manifest.description}</p>
        </div>
        <button
          onClick={handleManualScan}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Play size={16} />
          Scan Now
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {manifest.frontend.widgets.map((widget) => (
          <WidgetRenderer key={widget.widget_id} widget={widget} />
        ))}
      </div>
    </div>
  )
}
