import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './layouts/DashboardLayout'
import { Dashboard } from './pages/Dashboard'
import { PluginPage } from './pages/PluginPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFound } from './pages/NotFound'
import { LoadingSpinner } from './components/common/LoadingSpinner'
import { usePlugins } from './hooks/usePlugins'

function App() {
  const { plugins, loading } = usePlugins()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-500 mt-2 text-sm">Loading Rali Kilimanjaro...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout plugins={plugins} />}>
          <Route index element={<Dashboard plugins={plugins} />} />
          {plugins.map((plugin) => (
            <Route
              key={plugin.name}
              path={plugin.frontend.route_path}
              element={<PluginPage manifest={plugin} />}
            />
          ))}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
