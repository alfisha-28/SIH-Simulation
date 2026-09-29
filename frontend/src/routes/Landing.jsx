import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { useAdvisories } from '../lib/advisoryStore';
import { BLOCKS, DISTRICTS, PANCHAYATS, RISK_RANK, getPeakRisk } from '../lib/panchayatData';
import SimulatedDataBadge from '../components/common/SimulatedDataBadge';

// Overview (/): the landing page for the SIH26074 Panchayat-level agro-meteorological
// weather intelligence prototype. The stats come from the shared mock dataset and the
// shared advisory workflow store, so they never wait for (or break with) the backend.
// The backend is only pinged for its health chip: /system lists its regional forecast
// drivers, but nothing on this page depends on it.

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

// Same definition as the KVK dashboard's High-Risk table: a Panchayat whose worst
// risk over the 48 h horizon is high or severe. Pure function of the dataset, so
// it is computed once at module load.
const HIGH_RISK_COUNT = PANCHAYATS.filter((gp) => {
  const peak = getPeakRisk(gp.id);
  return peak && RISK_RANK[peak.risk] >= RISK_RANK.high;
}).length;

const VALUE_CHAIN = [
  {
    title: 'Block',
    desc: 'Coarse weather-model forecasts arrive at block (taluka) scale, too blunt to see one village’s storm.',
  },
  {
    title: 'Panchayat',
    desc: 'They are downscaled to a 2–3 km grid and aggregated to official Gram Panchayat boundaries.',
  },
  {
    title: 'Forecast',
    desc: 'Rainfall, temperature and wind from Now to +48 h, each with an uncertainty range.',
  },
  {
    title: 'Risk',
    desc: 'Forecasts are checked against IMD-style thresholds and graded low, moderate, high or severe.',
  },
  {
    title: 'Advisory',
    desc: 'Risk plus the local crop and growth stage becomes a plain-language crop advisory draft.',
  },
  {
    title: 'Action',
    desc: 'KVK / AMFU officials review and approve it, then it is sent to the registered farmers.',
  },
];

function StatTile({ to, label, value, sub, valueClass = 'text-slate-900', icon }) {
  return (
    <Link
      to={to}
      className={`group bg-white border border-[#D9E4EE] rounded-xl p-5 shadow-sm flex items-center justify-between gap-3 hover:border-blue-400 transition-colors ${FOCUS_RING}`}
    >
      <div className="min-w-0">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">{label}</span>
        <span className={`text-3xl font-extrabold font-mono mt-1 block tabular-nums ${valueClass}`}>{value}</span>
        <span className="text-[11px] text-slate-500 font-mono block">{sub}</span>
      </div>
      <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-50 border border-[#D9E4EE] flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
          {icon}
        </svg>
      </div>
    </Link>
  );
}

export default function Landing() {
  const [reloadIndex, setReloadIndex] = useState(0);
  // Tagged with the reload it belongs to, so "loading" is derived rather than set inside the effect.
  const [healthResult, setHealthResult] = useState({ key: -1, data: null });

  // Live from the shared store: approving an advisory anywhere updates this straight away.
  const { counts } = useAdvisories();

  useEffect(() => {
    let cancelled = false;
    apiGet('/health', { fresh: reloadIndex > 0 })
      .then((data) => ({ key: reloadIndex, data }))
      .catch((err) => {
        // A dead backend is an expected state for this page, not a failure to hide.
        console.error('Failed to fetch /health on overview:', err);
        return { key: reloadIndex, data: null };
      })
      .then((result) => {
        if (!cancelled) setHealthResult(result);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadIndex]);

  const health = healthResult.data;
  const loading = healthResult.key !== reloadIndex;

  const backendOffline = !loading && !health;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-10 sm:space-y-12">
      {/* Top banner: product eyebrow, data-honesty chip and backend status */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-[#D9E4EE] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
          <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
            WARSHA Panchayat Weather Intelligence
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <SimulatedDataBadge />
          <span className="text-slate-500">Backend:</span>
          {health ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {health.status?.toUpperCase() || 'OPERATIONAL'}
            </span>
          ) : loading ? (
            <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">CHECKING...</span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600">OFFLINE</span>
          )}
        </div>
      </div>

      {/* A quiet notice rather than an error panel: the Panchayat features do not need the backend. */}
      {backendOffline && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600"
        >
          <p className="leading-relaxed min-w-0">
            <strong className="text-slate-800">Backend offline.</strong> Only the regional forecast-driver list on
            System / Data needs it. The KVK Dashboard, Panchayat Explorer and Advisories run on simulated data and
            are unaffected.
          </p>
          <button
            type="button"
            onClick={() => setReloadIndex((n) => n + 1)}
            className={`inline-flex items-center justify-center min-h-11 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors ${FOCUS_RING}`}
          >
            Retry
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="space-y-6 text-center sm:text-left py-2">
        <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-mono font-semibold tracking-wide">
          SIH 2026 Prototype &middot; SIH26074 &middot; Gujarat
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight text-balance">
          Weather intelligence for every <span className="text-blue-600">Gram Panchayat</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
          WARSHA turns coarse block-level forecasts into Panchayat-level weather intelligence for agriculture in
          Gujarat: downscaled to a 2&ndash;3 km grid, aggregated to Gram Panchayat boundaries with uncertainty
          ranges, and converted into crop advisories that KVK / AMFU officials review and approve before they reach
          farmers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Link
            to="/kvk"
            className={`px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-sm font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-3 whitespace-nowrap ${FOCUS_RING}`}
          >
            <span>Open KVK Dashboard</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <Link
            to="/panchayats"
            className={`px-7 py-3.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 rounded-xl font-mono text-sm font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-3 whitespace-nowrap ${FOCUS_RING}`}
          >
            <span>Explore Panchayat Map</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Quick stats: live from the shared Panchayat dataset and advisory store */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          to="/panchayats"
          label="Panchayats Monitored"
          value={PANCHAYATS.length}
          sub={`${BLOCKS.length} blocks · ${DISTRICTS.length} districts`}
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
            />
          }
        />
        <StatTile
          to="/kvk"
          label="High-Risk Panchayats"
          value={HIGH_RISK_COUNT}
          valueClass="text-red-600"
          sub="High or severe within 48 h"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          }
        />
        <StatTile
          to="/advisories"
          label="Advisories Pending Review"
          value={counts.pending}
          valueClass={counts.pending > 0 ? 'text-amber-600' : 'text-emerald-600'}
          sub={`of ${counts.total} drafted · awaiting KVK`}
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
            />
          }
        />
      </div>

      {/* Value chain: replaces the old "Detect globally ... Alert locally" philosophy */}
      <section
        aria-labelledby="value-chain-heading"
        className="bg-white border border-[#D9E4EE] rounded-2xl p-5 sm:p-8 shadow-sm space-y-6"
      >
        <div className="border-b border-[#D9E4EE] pb-3">
          <h2 id="value-chain-heading" className="text-blue-600 font-mono text-sm font-bold uppercase tracking-wider">
            From forecast to farm action
          </h2>
        </div>

        <p className="text-lg sm:text-2xl font-bold font-mono text-slate-800 tracking-wide leading-relaxed text-center sm:text-left">
          {VALUE_CHAIN.map((step) => step.title).join(' → ')}
        </p>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
          {VALUE_CHAIN.map((step, idx) => (
            <li
              key={step.title}
              className="bg-slate-50 border border-[#D9E4EE] p-4 rounded-xl space-y-1.5 hover:border-blue-400 transition-colors"
            >
              <div className="text-xs font-mono font-bold text-blue-600 flex items-center justify-between">
                <span>0{idx + 1}</span>
                {idx < VALUE_CHAIN.length - 1 && (
                  <span className="text-slate-400 font-normal" aria-hidden="true">
                    &rarr;
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{step.title}</h3>
              <p className="text-[11px] text-slate-500 leading-snug">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Secondary CTA: the map is the primary way to explore local conditions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white border border-[#D9E4EE] p-6 sm:p-8 rounded-2xl shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider font-mono">
            See the weather village by village
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            The Panchayat Explorer maps every Gram Panchayat, and lets you compare the coarse block forecast with the
            downscaled Panchayat forecast across the next 48 hours.
          </p>
        </div>

        <Link
          to="/panchayats"
          className={`w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-sm font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-3 whitespace-nowrap ${FOCUS_RING}`}
        >
          <span>Open Panchayat Explorer</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="text-center text-xs font-mono text-slate-500 border-t border-slate-200 pt-6 space-y-1">
        <p>Smart India Hackathon 2026 &mdash; SIH26074 &middot; WARSHA prototype</p>
        <p>
          Panchayat boundaries, forecasts and advisories are simulated for demonstration.{' '}
          <Link to="/system" className={`text-blue-600 hover:underline ${FOCUS_RING}`}>
            See System / Data
          </Link>
        </p>
      </div>
    </div>
  );
}
