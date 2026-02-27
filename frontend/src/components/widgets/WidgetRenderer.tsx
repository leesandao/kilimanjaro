import clsx from 'clsx'
import { StatusWidget } from './StatusWidget'
import { ChartWidget } from './ChartWidget'
import { TableWidget } from './TableWidget'
import { ErrorBoundary } from '../common/ErrorBoundary'
import type { WidgetConfig } from '../../types'

const WIDGET_MAP: Record<string, React.ComponentType<{ config: WidgetConfig }>> = {
  table: TableWidget,
  chart: ChartWidget,
  status: StatusWidget,
}

export function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  const Component = WIDGET_MAP[widget.widget_type]
  if (!Component) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
        Unknown widget type: {widget.widget_type}
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div
        className={clsx(
          widget.widget_type === 'table' && 'sm:col-span-2 lg:col-span-3',
          widget.widget_type === 'chart' && 'sm:col-span-2',
          widget.widget_type === 'status' && 'sm:col-span-2 lg:col-span-3',
        )}
      >
        <Component config={widget} />
      </div>
    </ErrorBoundary>
  )
}
