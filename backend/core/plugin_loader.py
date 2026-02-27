import importlib
import json
import logging
import sys
from pathlib import Path

from fastapi import FastAPI

from config import PLUGINS_DIR
from core.plugin_base import PluginBase

logger = logging.getLogger(__name__)

_registry: dict[str, dict] = {}
_instances: dict[str, PluginBase] = {}


def get_registry() -> dict[str, dict]:
    return _registry


def get_plugin(name: str) -> PluginBase | None:
    return _instances.get(name)


async def discover_and_register(app: FastAPI, scheduler, db_session_factory):
    """Scan plugins directory, load enabled plugins, register routes and tasks."""
    if not PLUGINS_DIR.exists():
        logger.warning("Plugins directory does not exist: %s", PLUGINS_DIR)
        return

    # Ensure backend dir is on sys.path so `plugins.xxx` imports work
    backend_dir = str(PLUGINS_DIR.parent)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    for plugin_dir in sorted(PLUGINS_DIR.iterdir()):
        if not plugin_dir.is_dir():
            continue
        if plugin_dir.name.startswith("_"):
            continue

        manifest_path = plugin_dir / "manifest.json"
        init_path = plugin_dir / "__init__.py"

        if not manifest_path.exists() or not init_path.exists():
            logger.debug("Skipping %s: missing manifest.json or __init__.py", plugin_dir.name)
            continue

        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception as e:
            logger.error("Failed to read manifest for %s: %s", plugin_dir.name, e)
            continue

        if not manifest.get("enabled", True):
            logger.info("Plugin %s is disabled, skipping", manifest.get("name", plugin_dir.name))
            continue

        try:
            module = importlib.import_module(f"plugins.{plugin_dir.name}")
            plugin_instance: PluginBase = getattr(module, "plugin_instance")
        except Exception as e:
            logger.error("Failed to load plugin %s: %s", plugin_dir.name, e)
            continue

        try:
            await plugin_instance.initialize(db_session_factory)
            api_prefix = manifest.get("api_prefix", f"/api/plugins/{plugin_instance.name}")
            app.include_router(plugin_instance.get_router(), prefix=api_prefix, tags=[manifest.get("display_name", plugin_instance.name)])
            plugin_instance.register_tasks(scheduler)
            _registry[plugin_instance.name] = manifest
            _instances[plugin_instance.name] = plugin_instance
            logger.info("Loaded plugin: %s v%s", manifest.get("display_name"), manifest.get("version"))
        except Exception as e:
            logger.error("Failed to initialize plugin %s: %s", plugin_dir.name, e)


async def shutdown_all():
    for name, instance in _instances.items():
        try:
            await instance.on_shutdown()
        except Exception as e:
            logger.error("Error shutting down plugin %s: %s", name, e)
    _registry.clear()
    _instances.clear()
