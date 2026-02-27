from abc import ABC, abstractmethod

from fastapi import APIRouter


class PluginBase(ABC):
    """Abstract base class that every plugin must implement."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique plugin identifier string."""
        ...

    @abstractmethod
    def get_manifest(self) -> dict:
        """Return the parsed manifest.json contents."""
        ...

    @abstractmethod
    def get_router(self) -> APIRouter:
        """Return the FastAPI router with all plugin endpoints."""
        ...

    @abstractmethod
    def register_tasks(self, scheduler) -> None:
        """Register any periodic/scheduled tasks with the global scheduler."""
        ...

    @abstractmethod
    async def initialize(self, db_session_factory) -> None:
        """Called once during startup -- create tables, seed data, etc."""
        ...

    @abstractmethod
    async def on_shutdown(self) -> None:
        """Cleanup when the application shuts down."""
        ...
