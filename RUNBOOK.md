# Weather Intelligence Command Center — Demo Runbook

Quick execution instructions for demo day to start the FastAPI backend server (via Docker or Python), seed the SQLite database, and launch the React frontend application.

---

## 1. Prerequisites
- Docker & Docker Compose (Recommended) OR Python 3.10+
- Node.js (v18+) and npm installed
- Working directory: Repository root directory

---

## 2. Backend Startup Sequence

### Option A: Docker Startup (Recommended & Instant)
Run directly from repository root:
```bash
docker compose up -d --build
```
*Note: The container automatically initializes environment variables from `backend/.env` and populates the database on startup if empty.*

### Option B: Local Python Startup

#### Step 2.1: Activate Virtual Environment & Install Dependencies
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

#### Step 2.2: Seed Database (Optional / Reset Data)
To populate or reset the database with the pre-configured ensemble weather anomaly dataset:
```bash
cd backend
PYTHONPATH=. ./venv/bin/python app/services/seed.py
```

#### Step 2.3: Start FastAPI Backend Server
Start the backend server on port 8000:
```bash
cd backend
PYTHONPATH=. ./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

*Verification:*
Open `http://localhost:8000/health` in browser or curl. Response:
`{"status":"ok","service":"weather-intelligence-api"}`

---

## 3. Frontend Startup Sequence

### Step 3.1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 3.2: Verify Environment Configuration
Ensure `frontend/.env` exists (or copy from `frontend/.env.example`):
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Step 3.3: Launch Frontend Development Server
```bash
cd frontend
npm run dev
```
*Verification:*
Open `http://localhost:5173` (or the URL provided in terminal output).

---

## 4. Production Build Verification (Optional)
To verify or run the production build preview:
```bash
cd frontend
npm run build
npm run preview
```

---

## 5. Failure Recovery / Emergency Protocol
- **Backend Unreachable**: If the backend is stopped, all 8 frontend screens display a stylized, graceful error banner with recovery instructions without crashing the app.
- **Database Reset**: Re-run `PYTHONPATH=. ./venv/bin/python app/services/seed.py` inside `backend/` (or restart the docker container with auto-seed) to instantly restore standard seed events (`EVT-2026-001`, `EVT-2026-002`, `EVT-2026-003`).
