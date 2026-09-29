import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { formatEventType } from '../lib/format';
import { BLOCKS, DISTRICTS, PANCHAYATS } from '../lib/panchayatData';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import ErrorState from '../components/common/ErrorState';
import SeverityBadge from '../components/common/SeverityBadge';
import SimulatedDataBadge from '../components/common/SimulatedDataBadge';

// System / Data (/system): how the SIH26074 pipeline is meant to work end to end,
// which inputs are simulated in this prototype versus intended real inputs, and the
// backend's regional forecast drivers (the /events data, reached through the
// drill-down pages). Only the health badge and the drivers list need the backend;
// the rest is static.

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

// `status` is deliberately blunt about what runs in this prototype (see DATA_SOURCES).
const PIPELINE_STEPS = [
  { id: '01', name: 'Coarse Forecast', role: 'Block-Scale Inputs', detail: 'Ensemble NWP fields at roughly 12 km, viewed per block (taluka)', status: 'Simulated' },
  { id: '02', name: 'Bias Correction', role: 'Local Calibration', detail: 'Correct systematic model error against observations and reanalysis', status: 'Simulated' },
  { id: '03', name: '2–3 km Downscaling', role: 'Statistical / ML Downscaling', detail: 'Sharpen the coarse fields onto a 2–3 km prototype grid', status: 'Simulated' },
  { id: '04', name: 'Panchayat Aggregation', role: 'Gram Panchayat Boundaries', detail: 'Aggregate grid cells to each official Gram Panchayat polygon', status: 'Simulated' },
  { id: '05', name: 'Uncertainty Ranges', role: 'Confidence Bands', detail: '10th–90th percentile ranges and a confidence level per Panchayat', status: 'Simulated' },
  { id: '06', name: 'Risk Thresholds', role: 'Low → Severe Grading', detail: 'IMD-style rainfall, wind and heat thresholds grade each Panchayat', status: 'Rules on simulated data' },
  { id: '07', name: 'Advisory Drafting', role: 'Crop-Aware Rules', detail: 'Risk plus crop and growth stage gives a recommended field action', status: 'Rules on simulated data' },
  { id: '08', name: 'KVK / AMFU Review', role: 'Human Approval', detail: 'Officials review, approve or hold each draft before it goes out', status: 'Simulated workflow' },
  { id: '09', name: 'Farmer Delivery', role: 'Registered Farmers', detail: 'Approved advisories reach farmers (SMS or app), not built here', status: 'Simulated' },
];

// What the prototype actually does versus what a production system would consume.
// Real sources are stated as intended / planned inputs, never as live feeds.
const DATA_SOURCES = [
  {
    item: 'Coarse forecast',
    prototype: 'A deterministic late-monsoon rain-band scenario (analytic pattern plus seeded noise). No model output is ingested.',
    intended: 'NWP ensemble forecasts such as NEPS-G (about 12 km) from the national weather service.',
  },
  {
    item: 'Bias correction baseline',
    prototype: 'Not applied. The scenario is synthetic, so there is nothing to calibrate.',
    intended: 'ERA5 / IMDAA reanalysis and IMD station or AWS observations.',
  },
  {
    item: 'Downscaling',
    prototype: 'Per-Panchayat values come from the same scenario plus smooth seeded local variation; the block value is their area-weighted mean.',
    intended: 'A trained statistical / ML downscaling model on a 2–3 km grid.',
  },
  {
    item: 'Panchayat boundaries',
    prototype: `${PANCHAYATS.length} synthetic Gram Panchayats in ${BLOCKS.length} blocks across ${DISTRICTS.length} districts (South Gujarat). Polygons and names are indicative, not official.`,
    intended: 'Official Gram Panchayat boundary layers with their codes.',
  },
  {
    item: 'Crops and growth stage',
    prototype: 'Late-kharif crops and growth stages assigned per Panchayat in the mock dataset.',
    intended: 'Crop calendars and field-reported sowing and stage data from KVK / AMFU.',
  },
  {
    item: 'Farmer registry and delivery',
    prototype: 'Registered-farmer counts are simulated. "Send" only changes a status on this device; nothing is delivered.',
    intended: 'A registered-farmer database with SMS / app notification delivery.',
  },
  {
    item: 'Regional forecast drivers',
    prototype: 'Three seeded weather systems served by the FastAPI backend. They are demonstration data too.',
    intended: 'Regional signals derived from the live forecast ensemble.',
  },
];

const COMPONENTS = [
  { label: 'Panchayat Data', value: 'Deterministic simulation', desc: 'Mock geography and forecasts, identical on every load' },
  { label: 'Advisory Workflow', value: 'Rules + local state', desc: 'Pending, approved and sent status kept in this browser only' },
  { label: 'Web Frontend', value: 'React + Leaflet', desc: 'Runs entirely on the simulated Panchayat data' },
  { label: 'Backend', value: 'FastAPI (Python)', desc: 'SQLite REST server for /health and the regional forecast drivers' },
];

function StatusTag({ status }) {
  return (
    <span className="inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase leading-none text-amber-700">
      {status}
    </span>
  );
}

function DriverCard({ ev }) {
  const base = `/events/${ev.event_id}`;
  return (
    <li className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-blue-300 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="text-[11px] font-mono font-bold text-blue-600 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded"
          title="Backend identifier of this regional weather system"
        >
          {ev.event_id}
        </span>
        <SeverityBadge severity={ev.severity} />
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900">{ev.location_name || 'Unknown region'}</h3>
        <p className="text-[11px] font-mono text-slate-500 uppercase">{formatEventType(ev.type)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-600">
        <span>
          Forecast probability:{' '}
          <strong className="text-slate-900">
            {typeof ev.probability === 'number' ? `${Math.round(ev.probability * 100)}%` : '--'}
          </strong>
        </span>
        <ConfidenceBadge confidence={ev.confidence} />
      </div>

      <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold">
        <Link
          to={base}
          className={`inline-flex items-center min-h-9 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors ${FOCUS_RING}`}
        >
          Overview
        </Link>
        <Link
          to={`${base}/forecast`}
          className={`inline-flex items-center min-h-9 px-3 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors ${FOCUS_RING}`}
        >
          Forecast
        </Link>
        <Link
          to={`${base}/risk`}
          className={`inline-flex items-center min-h-9 px-3 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors ${FOCUS_RING}`}
        >
          Risk
        </Link>
      </div>
    </li>
  );
}

export default function SystemInfo() {
  const [reloadIndex, setReloadIndex] = useState(0);
  // Each result is tagged with the reload it belongs to, so "loading" is derived
  // (result.key !== reloadIndex) instead of being set from inside the effect.
  const [healthResult, setHealthResult] = useState({ key: -1, data: null });
  const [driversResult, setDriversResult] = useState({ key: -1, list: [], error: null });

  useEffect(() => {
    let cancelled = false;
    const fresh = reloadIndex > 0;

    apiGet('/health', { fresh })
      .then((data) => ({ key: reloadIndex, data }))
      .catch((err) => {
        console.error('Failed to ping /health:', err);
        return { key: reloadIndex, data: null };
      })
      .then((result) => {
        if (!cancelled) setHealthResult(result);
      });

    // The failure is kept and shown, never swallowed into an empty list that
    // would read as "there are no regional forecast drivers".
    apiGet('/events', { fresh })
      .then((data) => ({ key: reloadIndex, list: Array.isArray(data?.events) ? data.events : [], error: null }))
      .catch((err) => {
        console.error('Failed to fetch /events on system page:', err);
        return { key: reloadIndex, list: [], error: err.message || 'Request failed' };
      })
      .then((result) => {
        if (!cancelled) setDriversResult(result);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadIndex]);

  const health = healthResult.data;
  const healthLoading = healthResult.key !== reloadIndex;
  const drivers = driversResult.list;
  const driversError = driversResult.error;
  const driversLoading = driversResult.key !== reloadIndex;

  const retry = useCallback(() => setReloadIndex((n) => n + 1), []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-slate-800">
      <title>System / Data | WARSHA</title>

      {/* Page header banner */}
      <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                Pipeline &middot; Data sources &middot; Forecast drivers
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">System / Data</h1>
          </div>

          {/* Dynamic backend status badge */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-slate-600">Backend Status:</span>
            {healthLoading ? (
              <span className="text-amber-700 font-semibold">checking...</span>
            ) : health ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                FastAPI: {(health.status || 'ok').toUpperCase()}
              </span>
            ) : (
              <span className="text-slate-500">FastAPI: Offline</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SimulatedDataBadge />
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            How WARSHA is designed to turn coarse forecasts into Panchayat-level agro-meteorological advisories, and
            exactly what this prototype simulates versus what a production system would ingest.
          </p>
        </div>
      </div>

      {/* Section 1: Pipeline */}
      <section
        aria-labelledby="pipeline-heading"
        className="bg-white border border-[#D9E4EE] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2
              id="pipeline-heading"
              className="text-base font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Panchayat Weather Pipeline (9 Stages)
            </h2>
            <p className="text-xs text-slate-500">
              From block-scale forecasts to an approved advisory in a farmer&rsquo;s hands.
            </p>
          </div>
          <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 whitespace-nowrap shrink-0">
            Block &rarr; Panchayat &rarr; Advisory
          </span>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PIPELINE_STEPS.map((step, idx) => (
            <li key={step.id} className="flex flex-col h-full">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-1 space-y-2 hover:border-blue-400 transition-colors group">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="font-bold group-hover:text-blue-700">STAGE {step.id}</span>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <span className={`${idx % 3 === 2 ? 'hidden' : 'hidden md:inline'} text-slate-400 font-bold`} aria-hidden="true">
                      &rarr;
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-800">{step.name}</h3>
                  <p className="text-[11px] font-mono text-slate-500 font-medium mt-0.5">{step.role}</p>
                </div>
                <p className="text-xs text-slate-600 leading-snug pt-2 border-t border-slate-200">{step.detail}</p>
                <StatusTag status={step.status} />
              </div>

              {/* Mobile arrow indicator */}
              {idx < PIPELINE_STEPS.length - 1 && (
                <div className="md:hidden text-center text-slate-400 text-xs py-1" aria-hidden="true">
                  &darr;
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Section 2: Data sources, simulated vs intended */}
      <section
        aria-labelledby="sources-heading"
        className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div className="border-b border-slate-100 pb-3">
          <h2
            id="sources-heading"
            className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Data Sources: Simulated vs Intended
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            No live weather feed is connected. The right-hand column lists the inputs a production system is
            intended to use, not what runs today.
          </p>
        </div>

        <div className="hidden md:grid md:grid-cols-[11rem_1fr_1fr] gap-x-6 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          <span>Input</span>
          <span>In this prototype</span>
          <span>Intended real input</span>
        </div>
        <ul className="space-y-2">
          {DATA_SOURCES.map((src) => (
            <li
              key={src.item}
              className="grid grid-cols-1 md:grid-cols-[11rem_1fr_1fr] gap-x-6 gap-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4"
            >
              <h3 className="text-sm font-bold text-slate-900">{src.item}</h3>
              <p className="text-xs text-slate-700 leading-snug">
                <span className="md:hidden block text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-0.5">
                  In this prototype
                </span>
                {src.prototype}
              </p>
              <p className="text-xs text-slate-600 leading-snug">
                <span className="md:hidden block text-[10px] font-mono uppercase tracking-wider text-blue-700 mb-0.5">
                  Intended real input
                </span>
                {src.intended}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Section 3: Regional forecast drivers from the backend */}
      <section
        aria-labelledby="drivers-heading"
        className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2
              id="drivers-heading"
              className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900 flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Regional Forecast Drivers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
              Broad, region-scale weather systems from the backend that sit behind the Panchayat forecasts. Each opens
              a regional drill-down; for Panchayat-level detail use the{' '}
              <Link to="/panchayats" className={`text-blue-600 font-semibold hover:underline ${FOCUS_RING}`}>
                Panchayat Explorer
              </Link>
              .
            </p>
          </div>
        </div>

        {driversLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="status" aria-label="Loading regional forecast drivers">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 bg-slate-50 border border-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : driversError ? (
          <ErrorState
            message="Can't load the regional forecast drivers. The Panchayat pages don't need the backend and still work."
            detail={driversError}
            onRetry={retry}
          />
        ) : drivers.length === 0 ? (
          <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-xl px-4 py-6 text-center">
            The backend reports no regional forecast drivers right now.
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {drivers.map((ev) => (
              <DriverCard key={ev.event_id} ev={ev} />
            ))}
          </ul>
        )}
      </section>

      {/* Section 4: Components and honest framing note */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              What Runs Here
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">The pieces this prototype is built from.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMPONENTS.map((comp) => (
              <div
                key={comp.label}
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1 hover:border-slate-300 transition-colors"
              >
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block">{comp.label}</span>
                <span className="text-sm font-bold font-mono text-slate-900 block">{comp.value}</span>
                <span className="text-[11px] text-slate-600 block pt-0.5">{comp.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                Prototype Note
              </h2>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-sans">
              <p>
                Every Panchayat forecast, risk grade and advisory you see is simulated so the full workflow can be
                demonstrated end to end. None of it should be read as a real forecast.
              </p>
              <p className="text-slate-500">
                The pipeline is kept modular so a real forecast feed, a downscaling model and a delivery channel can
                replace the simulated parts without changing the review workflow.
              </p>
            </div>
          </div>

          <Link
            to="/kvk"
            className={`p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] font-mono text-blue-700 flex items-center justify-between gap-1.5 hover:bg-blue-100 transition-colors ${FOCUS_RING}`}
          >
            <span>Try the review workflow</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
