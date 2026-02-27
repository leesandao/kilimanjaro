import asyncio
import json
from datetime import datetime, timezone

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            self._connections.discard(websocket)

    async def broadcast(self, event: str, data: dict | None = None):
        message = json.dumps({
            "event": event,
            "data": data or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        dead = set()
        async with self._lock:
            for ws in self._connections:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.add(ws)
            self._connections -= dead

    @property
    def connection_count(self) -> int:
        return len(self._connections)


ws_manager = WebSocketManager()
