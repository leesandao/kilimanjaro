import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import type { PluginManifest } from '../types'

export function usePlugins() {
  const [plugins, setPlugins] = useState<PluginManifest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlugins = async () => {
    try {
      const data = await apiFetch<PluginManifest[]>('/plugins')
      setPlugins(data.sort((a, b) => a.frontend.sidebar_order - b.frontend.sidebar_order))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plugins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlugins()
  }, [])

  return { plugins, loading, error, refresh: fetchPlugins }
}
