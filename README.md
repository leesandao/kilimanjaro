# Kilimanjaro

> **Version: 0.1.0**

A modular, real-time home network dashboard built with **FastAPI** and **React**. Monitor your local network devices through an extensible plugin architecture with live WebSocket updates.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

**[中文文档](./README_CN.md)**

## Features

- **Plugin Architecture** - Drop-in plugins with auto-discovery, each with its own routes, database models, scheduled tasks, and frontend widgets
- **Real-time Updates** - WebSocket-based live data push, no manual refresh needed
- **LAN Scanner Plugin** - Discover all devices on your local network via ARP/ping scanning with vendor identification
- **Dynamic Widget System** - Plugins declare their UI through manifest files; the frontend renders them automatically (status cards, charts, tables)
- **Responsive Design** - Mobile-first layout with collapsible sidebar, adapts to phone, tablet, and desktop
- **Scheduled Tasks** - Built-in APScheduler for periodic background jobs (e.g., network scan every 5 minutes)
- **Async Everything** - Fully async backend with SQLAlchemy 2.0 + aiosqlite

## Tech Stack

| Layer    | Technology                                      |
|----------|------------------------------------------------|
| Backend  | Python 3.11+, FastAPI, SQLAlchemy 2.0, APScheduler |
| Frontend | React 19, TypeScript, Tailwind CSS, Recharts   |
| Database | SQLite (async via aiosqlite)                   |
| Network  | Scapy (ARP scan), concurrent ping sweep        |
| Build    | Vite 5, ESLint, PostCSS                        |

## Project Structure

```
kilimanjaro/
├── backend/
│   ├── main.py                 # FastAPI entry point & lifespan
│   ├── config.py               # Global configuration
│   ├── requirements.txt
│   ├── core/
│   │   ├── database.py         # SQLAlchemy async engine & session
│   │   ├── plugin_base.py      # Abstract plugin interface
│   │   ├── plugin_loader.py    # Plugin auto-discovery & registration
│   │   ├── scheduler.py        # APScheduler instance
│   │   └── websocket_manager.py # WebSocket broadcast manager
│   ├── api/
│   │   ├── system.py           # /api/health, /api/info
│   │   └── plugin_registry.py  # /api/plugins
│   └── plugins/
│       ├── _template/          # Boilerplate for new plugins
│       └── lan_scanner/        # LAN scanning plugin
│           ├── manifest.json   # Plugin metadata & widget config
│           ├── plugin.py       # Plugin lifecycle
│           ├── scanner.py      # ARP & ping scan logic
│           ├── tasks.py        # Periodic scan task
│           ├── models.py       # Device, ScanRecord, DeviceHistory
│           ├── routes.py       # REST API endpoints
│           └── schemas.py      # Pydantic models
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Router setup
│   │   ├── pages/              # Dashboard, PluginPage, Settings
│   │   ├── layouts/            # DashboardLayout, Sidebar, TopBar
│   │   ├── components/
│   │   │   ├── widgets/        # StatusWidget, ChartWidget, TableWidget
│   │   │   └── common/         # Card, DataTable, StatusBadge, etc.
│   │   ├── hooks/              # usePlugins, useWebSocket, useResponsive
│   │   └── api/                # HTTP client & WebSocket client
│   ├── package.json
│   └── vite.config.ts
└── .gitignore
```

## Getting Started

### Prerequisites

- **Python** >= 3.11
- **Node.js** >= 18
- **npm** >= 9

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> **Note:** For full ARP scanning capabilities, run with `sudo`. Without root privileges, the scanner falls back to ping sweep mode.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to the backend at `http://localhost:8000`.

## API Reference

### System Endpoints

| Method | Endpoint        | Description             |
|--------|----------------|-------------------------|
| GET    | `/api/health`  | Health check            |
| GET    | `/api/info`    | System information      |
| GET    | `/api/plugins` | List all loaded plugins |

### LAN Scanner Plugin

| Method | Endpoint                              | Description                          |
|--------|---------------------------------------|--------------------------------------|
| GET    | `/api/plugins/lan_scanner/devices`    | List discovered devices              |
| GET    | `/api/plugins/lan_scanner/devices/{ip}` | Get device by IP address          |
| GET    | `/api/plugins/lan_scanner/summary`    | Network summary (total/online/offline) |
| GET    | `/api/plugins/lan_scanner/history`    | Device count over time               |
| GET    | `/api/plugins/lan_scanner/scans`      | Past scan records                    |
| POST   | `/api/plugins/lan_scanner/scan`       | Trigger manual scan                  |
| GET    | `/api/plugins/lan_scanner/subnets`    | List detected subnets                |

### WebSocket

Connect to `ws://localhost:8000/ws` for real-time events:

```json
{
  "event": "lan_scanner:scan_complete",
  "data": { "devices_found": 12, "new_devices": 2 }
}
```

## Creating a Plugin

Kilimanjaro uses a plugin system that auto-discovers and loads plugins at startup. To create a new plugin:

**1. Copy the template:**

```bash
cp -r backend/plugins/_template backend/plugins/my_plugin
```

**2. Define the manifest** (`manifest.json`):

```json
{
  "name": "my_plugin",
  "display_name": "My Plugin",
  "version": "1.0.0",
  "enabled": true,
  "api_prefix": "/api/plugins/my_plugin",
  "frontend": {
    "icon": "Box",
    "sidebar_label": "My Plugin",
    "route_path": "/my-plugin",
    "widgets": []
  }
}
```

**3. Implement the plugin class** by extending `PluginBase`:

```python
from core.plugin_base import PluginBase

class MyPlugin(PluginBase):
    @property
    def name(self) -> str:
        return "my_plugin"

    def get_manifest(self) -> dict: ...
    def get_router(self) -> APIRouter: ...
    def register_tasks(self, scheduler) -> None: ...
    async def initialize(self, db_session_factory) -> None: ...
    async def on_shutdown(self) -> None: ...
```

**4. Export the instance** in `__init__.py`:

```python
from .plugin import MyPlugin
plugin = MyPlugin()
```

The core system will automatically pick up the plugin, mount its routes, register scheduled tasks, and render its frontend widgets.

## Configuration

Key settings in `backend/config.py`:

| Variable               | Default | Description                    |
|------------------------|---------|--------------------------------|
| `DATABASE_URL`         | SQLite  | Database connection string     |
| `CORS_ORIGINS`         | localhost:5173 | Allowed frontend origins |
| `SCAN_INTERVAL_SECONDS`| 300     | LAN scan interval (seconds)   |
| `SCAN_TIMEOUT_SECONDS` | 3       | Per-host ping timeout          |

## Roadmap

- [ ] Additional plugins (port scanner, system monitor, speed test)
- [ ] User authentication & role management
- [ ] Dark mode toggle
- [ ] Device custom naming & notes UI
- [ ] Data export (CSV / JSON)
- [ ] Docker deployment
- [ ] Unit & integration tests
- [ ] Notification & alerting system

## Changelog

### v0.1.0 (2026-02-28)

**Initial Release**

- Project scaffolding with full-stack architecture (FastAPI + React + TypeScript)
- Plugin system with abstract base class, auto-discovery, and manifest-based configuration
- LAN Scanner plugin: ARP/ping network scanning, device tracking, vendor identification
- Dynamic frontend widget system (status cards, charts, sortable tables)
- Real-time WebSocket updates with auto-reconnect
- Responsive dashboard layout (mobile / tablet / desktop)
- SQLite async database with SQLAlchemy 2.0
- APScheduler for periodic background tasks
- REST API with 10 endpoints (3 system + 7 plugin)
- Project README with full documentation

## License

This project is licensed under the MIT License.
