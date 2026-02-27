export type WSListener = (data: Record<string, unknown>) => void

class WSClient {
  private ws: WebSocket | null = null
  private listeners = new Map<string, Set<WSListener>>()
  private reconnectInterval = 3000
  private url: string

  constructor(url: string) {
    this.url = url
    this.connect()
  }

  private connect() {
    this.ws = new WebSocket(this.url)

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const { event: eventName, data } = msg
        this.listeners.get(eventName)?.forEach((cb) => cb(data))
        // Also notify wildcard listeners
        this.listeners.get('*')?.forEach((cb) => cb(msg))
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), this.reconnectInterval)
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  subscribe(event: string, callback: WSListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

const wsUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`
export const wsClient = new WSClient(wsUrl)
