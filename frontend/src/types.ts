export interface WidgetColumn {
  key: string
  label: string
  sortable?: boolean
}

export interface WidgetConfig {
  widget_id: string
  widget_type: 'table' | 'chart' | 'status'
  title: string
  data_endpoint: string
  refresh_event: string
  columns?: WidgetColumn[]
  chart_type?: 'line' | 'bar' | 'area'
}

export interface PluginFrontend {
  icon: string
  sidebar_label: string
  sidebar_order: number
  route_path: string
  widgets: WidgetConfig[]
}

export interface PluginManifest {
  name: string
  display_name: string
  description: string
  version: string
  enabled: boolean
  api_prefix: string
  frontend: PluginFrontend
}
