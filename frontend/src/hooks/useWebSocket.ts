import { useEffect } from 'react'
import { wsClient, type WSListener } from '../api/wsClient'

export function useWebSocket(event: string, callback: WSListener) {
  useEffect(() => {
    return wsClient.subscribe(event, callback)
  }, [event, callback])
}
