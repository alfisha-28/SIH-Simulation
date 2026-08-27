# Weather Intelligence Command Center — Backend API

FastAPI + SQLite backend for the AI-powered extreme weather anomaly tracking & hyperlocal downscaling prototype.

## Prerequisites
- Python 3.10+
- `pip` & `venv`

## Setup & Run

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
   uvicorn app.main:app --reload
   ```

The API will be accessible at `http://localhost:8000`.

## API Endpoints
- `GET /health` — System health check
- `GET /events` — Extreme weather events list (placeholder)
- `GET /events/{event_id}` — Event detail (placeholder)
- `GET /events/{event_id}/forecast` — Downscaled forecast (placeholder)
- `GET /risk` — Risk assessment (placeholder)
