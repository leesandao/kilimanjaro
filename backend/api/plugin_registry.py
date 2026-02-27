from fastapi import APIRouter

from core.plugin_loader import get_registry

router = APIRouter(prefix="/api", tags=["Plugin Registry"])


@router.get("/plugins")
async def list_plugins():
    """Return all registered plugin manifests."""
    return list(get_registry().values())
