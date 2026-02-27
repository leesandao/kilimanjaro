import { NavLink } from 'react-router-dom'
import { Wifi, Box, Settings, LayoutDashboard } from 'lucide-react'
import clsx from 'clsx'
import type { PluginManifest } from '../types'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Wifi,
  Box,
}

interface SidebarProps {
  plugins: PluginManifest[]
  collapsed: boolean
  hidden: boolean
  onNavigate: () => void
}

export function Sidebar({ plugins, collapsed, hidden, onNavigate }: SidebarProps) {
  if (hidden) return null

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
      isActive
        ? 'bg-primary-100 text-primary-700 font-medium'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    )

  return (
    <aside
      className={clsx(
        'fixed sm:relative z-50 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">RK</span>
        </div>
        {!collapsed && <span className="font-semibold text-gray-900 truncate">Kilimanjaro</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <NavLink to="/" end className={linkClass} onClick={onNavigate}>
          <LayoutDashboard size={20} />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {plugins.map((plugin) => {
          const Icon = ICON_MAP[plugin.frontend.icon] || Box
          return (
            <NavLink
              key={plugin.name}
              to={plugin.frontend.route_path}
              className={linkClass}
              onClick={onNavigate}
            >
              <Icon size={20} />
              {!collapsed && <span>{plugin.frontend.sidebar_label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-gray-200">
        <NavLink to="/settings" className={linkClass} onClick={onNavigate}>
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  )
}
