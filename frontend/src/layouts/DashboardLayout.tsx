import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useResponsive } from '../hooks/useResponsive'
import type { PluginManifest } from '../types'

interface DashboardLayoutProps {
  plugins: PluginManifest[]
}

export function DashboardLayout({ plugins }: DashboardLayoutProps) {
  const { isMobile, isTablet } = useResponsive()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        plugins={plugins}
        collapsed={isTablet}
        hidden={isMobile && !sidebarOpen}
        onNavigate={() => isMobile && setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar
          showMenuButton={isMobile}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
