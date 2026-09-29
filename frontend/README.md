# WARSHA Panchayat Weather Intelligence — Frontend

React + Vite + Tailwind CSS frontend for the SIH26074 Panchayat-level agro-meteorological weather intelligence prototype: block forecasts downscaled to Gram Panchayat level, crop advisories, and the KVK / AMFU review workflow. The Panchayat features run on deterministic simulated data (`src/lib/panchayatData.js`); only `/system` and the regional drill-downs call the backend.

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

The application will run on `http://localhost:5173`.

## Environment Variables

Copy `.env.example` to `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Route Structure
Main navigation: Overview · KVK Dashboard · Panchayat Explorer · Advisories · System / Data
- `/` — Overview: value chain (Block → Panchayat → Forecast → Risk → Advisory → Action), live stats, backend status
- `/kvk` — KVK Dashboard: Panchayat risk map, high-risk table, advisory queue (Review → Approve → Send, simulated)
- `/panchayats` — Panchayat Explorer: primary map interface, coarse block vs downscaled Panchayat forecast, 48 h timeline
- `/advisories` — Advisories: crop advisory cards, sharing the KVK workflow state
- `/system` — System / Data: 9-stage pipeline, simulated vs intended data sources, regional forecast drivers, backend status

Internal drill-downs (reached from System / Data, not in the navigation), backed by the API's `/events` endpoints:
- `/events/:eventId` — Regional forecast driver overview
- `/events/:eventId/forecast` — Regional 12 km vs 5 km forecast
- `/events/:eventId/risk` — Regional risk assessment

Redirects for old links: `/dashboard` → `/kvk`, `/events` → `/panchayats`, `/alerts` → `/advisories`.

## Shared modules
- `src/lib/panchayatData.js` — mock geography (districts, blocks, Gram Panchayats) and the deterministic forecast model
- `src/lib/advisories.js`, `src/lib/advisoryStore.js` — advisory rules and the shared, localStorage-backed review workflow store
- `src/components/panchayat/` — reusable Panchayat map and panels
