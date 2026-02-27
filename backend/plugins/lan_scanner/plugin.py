import json
import logging
from pathlib import Path

from fastapi import APIRouter

from core.database import Base, engine
from core.plugin_base import PluginBase

logger = logging.getLogger(__name__)

PLUGIN_DIR = Path(__file__).resolve().parent


class LanScannerPlugin(PluginBase):
    @property
    def name(self) -> str:
        return "lan_scanner"

    def get_manifest(self) -> dict:
        with open(PLUGIN_DIR / "manifest.json", "r", encoding="utf-8") as f:
            return json.load(f)

    def get_router(self) -> APIRouter:
        from plugins.lan_scanner.routes import router
        return router

    def register_tasks(self, scheduler) -> None:
        manifest = self.get_manifest()
        for task_def in manifest.get("scheduled_tasks", []):
            from plugins.lan_scanner.tasks import run_scan
            scheduler.add_job(
                run_scan,
                "interval",
                seconds=task_def["interval_seconds"],
                id=task_def["task_id"],
                replace_existing=True,
            )
            logger.info("Registered task %s (every %ds)", task_def["task_id"], task_def["interval_seconds"])

    async def initialize(self, db_session_factory) -> None:
        # Import models so they register with Base.metadata
        import plugins.lan_scanner.models  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("LAN Scanner plugin initialized")

    async def on_shutdown(self) -> None:
        logger.info("LAN Scanner plugin shutting down")
