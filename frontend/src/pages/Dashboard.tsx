import { WidgetRenderer } from '../components/widgets/WidgetRenderer'
import type { PluginManifest } from '../types'

interface DashboardProps {
  plugins: PluginManifest[]
}

export function Dashboard({ plugins }: DashboardProps) {
  // Collect first status widget from each plugin for the overview
  const summaryWidgets = plugins.flatMap((p) =>
    p.frontend.widgets.filter((w) => w.widget_type === 'status')
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Network overview and status</p>
      </div>

      {summaryWidgets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No plugins loaded</p>
          <p className="text-sm mt-1">Add plugins to backend/plugins/ and restart the server</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {summaryWidgets.map((widget) => (
            <WidgetRenderer key={widget.widget_id} widget={widget} />
          ))}
        </div>
      )}
    </div>
  )
}
