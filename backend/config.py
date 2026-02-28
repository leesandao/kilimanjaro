from pathlib import Path

VERSION = "0.1.0"

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DATABASE_URL = f"sqlite+aiosqlite:///{DATA_DIR / 'kilimanjaro.db'}"
PLUGINS_DIR = BASE_DIR / "plugins"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

SCAN_INTERVAL_SECONDS = 300
SCAN_TIMEOUT_SECONDS = 3
