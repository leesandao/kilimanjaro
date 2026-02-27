import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from core.database import init_db, close_db
from core.scheduler import scheduler
from core.websocket_manager import ws_manager
from core.database import async_session_factory
from core import plugin_loader
from api.system import router as system_router
from api.plugin_registry import router as registry_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Rali Kilimanjaro...")
    await init_db()
    await plugin_loader.discover_and_register(app, scheduler, async_session_factory)
    scheduler.start()
    logger.info("Startup complete. Loaded %d plugin(s).", len(plugin_loader.get_registry()))
    yield
    logger.info("Shutting down...")
    scheduler.shutdown(wait=False)
    await plugin_loader.shutdown_all()
    await close_db()


app = FastAPI(title="Rali Kilimanjaro", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system_router)
app.include_router(registry_router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
