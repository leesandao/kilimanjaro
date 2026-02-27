from fastapi import APIRouter

from core.websocket_manager import ws_manager

router = APIRouter(prefix="/api", tags=["System"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/info")
async def info():
    return {
        "name": "Rali Kilimanjaro",
        "description": "Network Management Platform",
        "version": "0.1.0",
        "websocket_clients": ws_manager.connection_count,
    }
