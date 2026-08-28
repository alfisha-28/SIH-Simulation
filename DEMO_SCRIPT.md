# Weather Intelligence Command Center — Demo Script & Presenter Guide

This script walks through the 9-step demo narrative for judges during the live presentation of the AI-Powered Extreme Weather Intelligence platform.

---

## Live Walkthrough Sequence & Presenter Talking Points

### Step 1: Open `/` (Landing Page) & System Overview
- **Action**: Navigate to `http://localhost:5173/`
- **Presenter Script**:
  > *"Welcome to the AI-Powered Extreme Weather Intelligence platform. Our core operational philosophy is simple: Detect globally, track intelligently, downscale selectively, validate physically, and alert locally. Notice our real-time system stats showing active global anomaly scans."*

---

### Step 2: Open `/dashboard` — Live Anomaly Command Center
- **Action**: Click **"Open Live Dashboard"** or navigate to `/dashboard`
- **Presenter Script**:
  > *"Here on the primary command center dashboard, active extreme weather anomalies are displayed across India and surrounding ocean basins. The interactive Leaflet map overlays uncertainty radii and intensity centroids directly from our ensemble pipeline."*

---

### Step 3: Select Primary Event — "Extreme Rainfall — Gujarat"
- **Action**: Click on **EVT-2026-001 (Extreme Rainfall — Gujarat)** in the active events table or on the map.
- **Presenter Script**:
  > *"Selecting the Gujarat extreme rainfall event brings up our GNN tracking telemetry. Notice the 0.91 Rainfall EFI and 87% multi-model ensemble consensus — confirming high atmospheric instability before localized flooding occurs."*

---

### Step 4: Event Intelligence & Trajectory Telemetry
- **Action**: Navigate to **Event Intelligence** (`/events/EVT-2026-001`)
- **Presenter Script**:
  > *"The Event Intelligence view breaks down the primary anomaly drivers. The system flags this event due to extreme rainfall anomaly signatures moving North-East at 18 km/h over the next 48 hours."*

---

### Step 5: Advance Timeline & Propagation Dynamics
- **Action**: Use the **Timeline Slider** to move from `NOW` → `+6h` → `+12h` → `+18h`
- **Presenter Script**:
  > *"As we advance the timeline to +18h, observe how the uncertainty bounding box and impact radius dynamically expand toward Vadodara and the Mahi River Basin, reaching peak intensity of 214 mm/h."*

---

### Step 6: Open Localized Forecast — Conditional Diffusion Downscaling
- **Action**: Click **"View Localized Forecast"** (`/events/EVT-2026-001/forecast`)
- **Presenter Script**:
  > *"This is our selective downscaling module. Rather than spending massive compute to downscale the entire continent, our conditional diffusion model downscales only this targeted high-risk region from 12km NWP resolution to 5km grid resolution while preserving physics conservation laws."*

---

### Step 7: Open Risk Details — Multi-Hazard Impact Assessment
- **Action**: Click **"View Risk Details"** (`/events/EVT-2026-001/risk`)
- **Presenter Script**:
  > *"Our impact engine translates downscaled meteorological fields into actionable disaster risk. At +18h, severe flood risk peaks at 88% probability in Panchmahal and Dahod, providing emergency responders with hyper-targeted lead time."*

---

### Step 8: Open Alert Center — Actionable Operational Advisories
- **Action**: Navigate to `/alerts`
- **Presenter Script**:
  > *"The Alert Center automatically distills active hazards into operational emergency warnings. Here, the Gujarat extreme rainfall is flagged as CRITICAL, linking emergency managers directly to detailed risk assessments."*

---

### Step 9: Open `/system` — Architecture & ML Pipeline
- **Action**: (If asked by judges) Navigate to `/system`
- **Presenter Script**:
  > *"Under the hood, our end-to-end 9-stage pipeline processes raw NEPS-G ensemble data through GNN trajectory tracking, conditional diffusion super-resolution, and physics-informed mass/energy conservation bounds. The architecture is fully decoupled, ready for live ML model integration."*

---

## Timed Rehearsal Checklist

| Step | Screen | Key Metric / Highlight | Target Duration |
| font-mono | --- | --- | --- |
| 1 | `/` | Operational Philosophy & Live Stats | 15 sec |
| 2 | `/dashboard` | Interactive Map & Active Events List | 20 sec |
| 3 | `/events/EVT-2026-001` | Primary Anomaly EFI (0.91) & 87% Agreement | 25 sec |
| 4 | `/events/EVT-2026-001` | Trajectory Vector (NE_E @ 18 km/h) | 15 sec |
| 5 | `/events/EVT-2026-001` | Timeline Slider (+18h Peak) | 20 sec |
| 6 | `/events/EVT-2026-001/forecast` | 12km vs 5km Grid Downscaling | 30 sec |
| 7 | `/events/EVT-2026-001/risk` | Headline Flood Risk (88% Severe) | 25 sec |
| 8 | `/alerts` | Severity-sorted Emergency Advisories | 15 sec |
| 9 | `/system` | 9-Stage ML Pipeline Architecture | 20 sec |
| **Total** | | **Full Walkthrough** | **~3 min 05 sec** |
