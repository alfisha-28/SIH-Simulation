# WARSHA — Panchayat Weather Intelligence (SIH 2026 Prototype, SIH26074)

Panchayat-level agro-meteorological weather intelligence for Gujarat

> **Value chain**: *Block → Panchayat → Forecast → Risk → Advisory → Action*

---

## 🌟 Overview
**WARSHA** is a 5-screen operational prototype built for Smart India Hackathon 2026 (problem statement SIH26074). It takes coarse, block-level weather forecasts, downscales them to a 2–3 km prototype grid, aggregates them to official **Gram Panchayat (GP)** boundaries with uncertainty ranges, grades the local risk, and drafts **crop-aware advisories** that **KVK (Krishi Vigyan Kendra) / AMFU (Agro-Meteorological Field Unit)** officials review and approve before they are sent to registered farmers.

> **Prototype note**: the Panchayat boundaries, forecasts, risk grades, advisories and farmer counts are **simulated** (deterministic mock data generated in the frontend) so the whole workflow can be demonstrated end to end. There is no live weather feed and no real SMS / app delivery. The System / Data screen lists what is simulated and which real inputs are intended.

The backend (FastAPI + SQLite) serves `/health` and three seeded *regional forecast drivers* (broad, region-scale weather systems) that are shown on System / Data and its drill-down pages.

---

## 🚀 Quick Start Instructions

Refer to [RUNBOOK.md](./RUNBOOK.md) for detailed setup and demo execution commands.

### 1. Start FastAPI Backend
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. ./venv/bin/python app/services/seed.py
PYTHONPATH=. ./venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

### 2. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser. The Overview, KVK Dashboard, Panchayat Explorer and Advisories screens work even if the backend is not running.

---

## 📱 Application Screens

Main navigation: **Overview · KVK Dashboard · Panchayat Explorer · Advisories · System / Data**

1. **`/` — Overview**: Product summary, the Block → Panchayat → Forecast → Risk → Advisory → Action value chain, live stats (Panchayats monitored, high-risk Panchayats, advisories pending review), backend status, and shortcuts to the KVK Dashboard and Panchayat Explorer.
2. **`/kvk` — KVK Dashboard**: Operational view for KVK / AMFU officials: Panchayat risk map, high-risk Panchayat table, and the advisory queue with the Review → Approve → Send workflow (simulated), plus a "Reset demo" control.
3. **`/panchayats` — Panchayat Explorer**: The primary map-based interface. Explore rainfall, temperature, wind, chance of any rain and risk per Gram Panchayat, switch between the coarse block forecast and the downscaled Panchayat forecast, and step through Now → +48 h. Deep link: `/panchayats?gp=<id>&t=<hours>`.
4. **`/advisories` — Advisories**: Crop advisory cards (paddy, sugarcane, cotton, banana, mango and more) with recommended field actions. Shares its approval state with the KVK Dashboard.
5. **`/system` — System / Data**: The 9-stage Panchayat weather pipeline, an honest simulated-vs-intended data sources table, and the backend's regional forecast drivers with backend status.

Internal drill-downs (reached from System / Data, not in the main navigation) show the backend's regional forecast drivers in detail:
- `/events/:eventId` — Regional forecast driver overview (signal breakdown, footprint and movement)
- `/events/:eventId/forecast` — Regional 12 km vs 5 km downscaled forecast comparison
- `/events/:eventId/risk` — Regional multi-hazard risk assessment

Legacy redirects: `/dashboard` → `/kvk`, `/events` → `/panchayats`, `/alerts` → `/advisories`.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, JSX, Tailwind CSS v4, Leaflet / React-Leaflet, React Router v7
- **Backend**: FastAPI (Python), SQLite, SQLAlchemy, Pydantic v2, Uvicorn
- **Architecture**: Panchayat features run entirely on deterministic simulated data in the frontend; the decoupled REST backend serves the regional forecast drivers.

---

## 📖 Presentation Resources
- **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)**: Timed demo walkthrough script with presenter talking points for judges.
- **[RUNBOOK.md](./RUNBOOK.md)**: Demo day startup & disaster recovery protocol.
