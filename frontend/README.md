# Weather Intelligence Command Center — Frontend

React + Vite + Tailwind CSS frontend for the AI-powered extreme weather anomaly tracking & hyperlocal downscaling prototype.

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
- `/` — Landing / System Overview & Health Check
- `/dashboard` — Main Monitoring Dashboard (Phase 3)
- `/events` — Event Explorer (Phase 2)
- `/events/:eventId` — Event Detail (Phase 2)
- `/events/:eventId/forecast` — Event Forecast Downscaling (Phase 2)
- `/events/:eventId/risk` — Event Risk Assessment (Phase 2)
- `/alerts` — Active Alerts (Phase 3)
- `/system` — System Information & Pipeline Status (Phase 3)
