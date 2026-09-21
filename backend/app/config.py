import os
from pathlib import Path
from dotenv import load_dotenv

# Project base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env if present
env_file = BASE_DIR / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

# Server Settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

# Database Settings
DEFAULT_DB_PATH = BASE_DIR / "app" / "data.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# CORS Settings
raw_cors = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

# Auto-seed database on startup if empty
AUTO_SEED = os.getenv("AUTO_SEED", "true").lower() in ("true", "1", "yes")
