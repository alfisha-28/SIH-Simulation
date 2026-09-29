# WARSHA Panchayat Weather Intelligence — Demo Script & Presenter Guide

This script walks through the 6-step demo narrative for judges during the live presentation of the Panchayat-level agro-meteorological weather intelligence platform (SIH26074). The value chain to keep repeating is **Block → Panchayat → Forecast → Risk → Advisory → Action**.

> **Say this early**: all Panchayat boundaries, forecasts, risk grades, advisories and farmer counts in the prototype are *simulated* (deterministic mock data). The workflow and the interface are what is being demonstrated, not real forecast skill. The KVK Dashboard has a **Reset demo** button to restore the starting state between runs.

---

## Live Walkthrough Sequence & Presenter Talking Points

### Step 1: Open `/` (Overview)
- **Action**: Navigate to `http://localhost:5173/`
- **Presenter Script**:
  > *"WARSHA turns coarse, block-level weather forecasts into Panchayat-level intelligence for farmers in Gujarat. The forecast is downscaled to a 2 to 3 kilometre grid, aggregated to Gram Panchayat boundaries with uncertainty ranges, and converted into crop advisories that KVK and AMFU officials approve before anything reaches a farmer. That is our value chain: Block, Panchayat, Forecast, Risk, Advisory, Action. The stats here are live: 50 Panchayats monitored, how many are high risk in the next 48 hours, and how many advisories are still waiting for review."*

---

### Step 2: Open `/kvk` — KVK Dashboard (Review → Approve → Send)
- **Action**: Click **"Open KVK Dashboard"**. Point at the Panchayat Risk Map and the High-Risk Panchayats table, then select **Vijalpor** (Jalalpore block, Navsari) and click **Review advisory**. In the review drawer, click **Approve advisory**, then **Send**.
- **Presenter Script**:
  > *"This is the officer's view. The map shows risk per Panchayat at the chosen lead time, and the table ranks Panchayats by their worst risk over the next 48 hours. Vijalpor has cotton at flowering and very heavy rain forecast, so the system has drafted an advisory: avoid spraying and ensure field drainage. The officer reviews the forecast with its uncertainty ranges, approves it, and only then can it be sent to the registered farmers."*
- **Note**: Approval and sending are simulated on this device only (no SMS or app delivery). Notice the red badge on the **Advisories** nav item drop by one when you approve.

---

### Step 3: Open `/panchayats` — Panchayat Explorer (Coarse vs Downscaled)
- **Action**: Click **"Open in Panchayat Explorer"** (or the **Panchayat Explorer** nav item). Toggle **Coarse Block Forecast** ↔ **Downscaled Panchayat Forecast**, change the map colouring (Risk level, Rainfall, Temperature, Wind speed, Any rain), and drag the timeline through **Now → +6h → +12h → +24h → +48h** (or press **Play Timeline**).
- **Presenter Script**:
  > *"The Explorer is our primary map interface. In the coarse view every Panchayat in a block shares one value, which hides local hotspots. Switch to the downscaled view and each Gram Panchayat gets its own forecast with a 10th to 90th percentile range and a confidence level. Scrubbing the timeline shows the rain band moving north over 48 hours. The side panel compares the block value with the Panchayat value, so you can see exactly what downscaling adds."*
- **Note**: "Any rain" is the chance of at least 2.5 mm; it is different from the risk-driving chance shown in the risk line (for example, the chance of at least 115.6 mm in 24 h).

---

### Step 4: Open `/advisories` — Crop Advisories
- **Action**: Click **Advisories** in the navigation. Filter by status (Pending Review / Approved / Sent) or risk level.
- **Presenter Script**:
  > *"Each card is a crop-aware advisory: the forecast risk combined with the crop and growth stage gives a plain recommended action, such as draining fields and postponing fertiliser for paddy at flowering, or propping banana against strong wind. The Vijalpor advisory we just approved shows its new status here, because this page and the KVK Dashboard share the same workflow state."*

---

### Step 5: Open `/system` — System / Data
- **Action**: Click **System / Data**. Show the pipeline, the data sources table and the regional forecast drivers.
- **Presenter Script**:
  > *"Under the hood, the 9-stage pipeline goes from coarse block forecasts, through bias correction, 2 to 3 kilometre downscaling and aggregation to Gram Panchayat boundaries, to uncertainty ranges, risk thresholds, crop-aware advisory drafting, KVK review and farmer delivery. We are explicit about what is simulated here and what the intended real inputs are, for example NWP ensemble forecasts, reanalysis and official Panchayat boundary layers. The backend also serves the broad regional forecast drivers, which open regional drill-down pages."*

---

### Step 6 (optional): Regional Forecast Driver Drill-Down
- **Action**: On System / Data, click **Overview**, then **Forecast** and **Risk**, on `EVT-2026-001` (Extreme Rainfall — Gujarat).
- **Presenter Script**:
  > *"For the regional context, we keep the region-scale weather system behind the forecasts: its signal, its 12 km versus 5 km downscaled fields, and its multi-hazard risk. Every one of these pages links back to the Panchayat Explorer, where the local detail lives."*
- **Note**: `/dashboard`, `/events` and `/alerts` redirect to `/kvk`, `/panchayats` and `/advisories`, so old links still work.

---

## Timed Rehearsal Checklist

| Step | Screen | Key Metric / Highlight | Target Duration |
| --- | --- | --- | --- |
| 1 | `/` | Value chain & live stats (Panchayats, high-risk, pending) | 25 sec |
| 2 | `/kvk` | Vijalpor advisory: Review → Approve → Send | 50 sec |
| 3 | `/panchayats` | Coarse vs downscaled toggle & 48 h timeline | 50 sec |
| 4 | `/advisories` | Crop-aware advisory cards, shared approval state | 25 sec |
| 5 | `/system` | Pipeline, simulated vs intended data | 25 sec |
| 6 | `/events/EVT-2026-001` | Regional drill-down (optional) | 20 sec |
| **Total** | | **Full Walkthrough** | **~3 min 15 sec** |
