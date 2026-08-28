# Weather Intelligence Command Center (SIH 2026 Prototype)

AI-Powered Extreme Weather Anomaly Tracking & Hyperlocal Downscaling Platform

> **Philosophy**: *Detect globally. Track intelligently. Downscale selectively. Validate physically. Alert locally.*

---

## 🌟 Overview
The **Weather Intelligence Command Center** is a 8-screen operational prototype built for Smart India Hackathon 2026. It processes multi-model global NWP ensemble data (NEPS-G) to detect extreme weather anomaly signatures, track spatial trajectory propagation via Spatio-Temporal Graph Neural Networks (GNN), selectively downscale high-risk sub-regions using Conditional Diffusion models (12km → 5km), enforce atmospheric mass/energy physics conservation bounds, and generate actionable multi-hazard disaster alerts.

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

Visit `http://localhost:5173` in your browser.

---

## 📱 Application Screens (8 Routes)

1. **`/` — Landing / System Overview**: Product philosophy, live active event stats, system operational status, CTA button.
2. **`/dashboard` — Dashboard**: Interactive Leaflet anomaly map, active events list, timeline slider, system status strip.
3. **`/events` — Event Explorer**: Tabular/grid explorer filtering events by type, location, severity, and probability.
4. **`/events/:eventId` — Event Detail**: EFI anomaly breakdown, multi-model ensemble agreement, centroid tracking trajectory.
5. **`/events/:eventId/forecast` — Event Forecast**: 12km NWP vs 5km downscaled weather fields comparison across timesteps.
6. **`/events/:eventId/risk` — Event Risk**: Multi-hazard (flood, wind, heat) exposure assessment and impact regions.
7. **`/alerts` — Alert Center**: Severity-sorted operational emergency hazard warnings and advisories.
8. **`/system` — System Intelligence**: 9-stage end-to-end processing pipeline diagram and core ML model component summary.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, JSX, Tailwind CSS v4, Leaflet / React-Leaflet, React Router v7
- **Backend**: FastAPI (Python), SQLite, SQLAlchemy, Pydantic v2, Uvicorn
- **Architecture**: Decoupled REST API with structured, physically consistent ensemble simulation seed data.

---

## 📖 Presentation Resources
- **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)**: 9-step timed demo walkthrough script with presenter talking points for judges.
- **[RUNBOOK.md](./RUNBOOK.md)**: Demo day startup & disaster recovery protocol.
