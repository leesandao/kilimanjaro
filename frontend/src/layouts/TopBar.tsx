import { Menu, RefreshCw } from 'lucide-react'

interface TopBarProps {
  showMenuButton: boolean
  onMenuToggle: () => void
}

export function TopBar({ showMenuButton, onMenuToggle }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0">
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu size={20} />
        </button>
      )}
      <h1 className="text-lg font-semibold text-gray-900">Rali Kilimanjaro</h1>
      <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw size={14} />
        <span>Auto-refresh</span>
      </div>
    </header>
  )
}
