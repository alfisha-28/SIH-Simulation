# Weather Intelligence Command Center — Backend API

FastAPI + SQLite backend for the AI-powered extreme weather anomaly tracking & hyperlocal downscaling prototype.

## Prerequisites
- Python 3.10+ (or Docker)
- `pip` & `venv`

## Environment Configuration
The backend loads configuration from `.env` file (copied from `.env.example` if needed).

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=sqlite:///app/data.db

# CORS Configuration
CORS_ORIGINS=*

# Auto-seed database on startup if empty
AUTO_SEED=true
```

## Running with Docker (Recommended)

Start the backend container easily using Docker Compose:

```bash
# From repository root or backend directory:
docker compose up -d --build
```

Or build and run using Docker CLI:

```bash
cd backend
docker build -t weather-backend .
docker run -d -p 8000:8000 --env-file .env --name weather-backend weather-backend
```

The API will be accessible at `http://localhost:8000`.

## Local Setup without Docker

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```bash
   python -m app.main
   ```
   or
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints
- `GET /health` — System health check
- `GET /events` — Extreme weather events list
- `GET /events/{event_id}` — Event detail and EFI breakdown
- `GET /events/{event_id}/forecast` — Dual-resolution downscaled forecast (12km & 5km)
- `GET /events/{event_id}/risk` — Risk assessment by timestep
- `GET /risk` — Hyperlocal spatial risk lookup by lat/lon
