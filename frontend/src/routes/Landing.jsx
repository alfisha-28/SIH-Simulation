import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import ErrorState from '../components/common/ErrorState';

export default function Landing() {
  const [events, setEvents] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    async function loadLandingData() {
      setLoading(true);
      setError(null);
      let failureDetail = null;

      // Each request catches its own failure so one down endpoint does not
      // block the other, but the failure is recorded here instead of being
      // swallowed, so the outage actually reaches the UI below.
      const [eventsRes, healthRes] = await Promise.all([
        apiGet('/events').catch((err) => {
          console.error('Failed to fetch /events on landing:', err);
          failureDetail = failureDetail || err.message || 'Request failed';
          return null;
        }),
        apiGet('/health').catch((err) => {
          console.error('Failed to fetch /health on landing:', err);
          failureDetail = failureDetail || err.message || 'Request failed';
          return null;
        }),
      ]);

      setEvents(eventsRes?.events || []);
      setHealth(healthRes);
      setError(failureDetail);
      setLoading(false);
    }

    loadLandingData();
  }, [reloadIndex]);

  const activeEventsCount = events.length;
  const highRiskCount = events.filter(
    (e) => (e.severity || '').toLowerCase() === 'severe'
  ).length;

  const philosophySteps = [
    { title: 'Detect globally', desc: 'Scan global NWP models (NEPS-G) for early EFI anomaly signals' },
    { title: 'Track intelligently', desc: 'Spatio-temporal GNN predicts event trajectory and intensity' },
    { title: 'Downscale selectively', desc: 'Conditional diffusion model sharpens 12km fields down to 5km resolution' },
    { title: 'Validate physically', desc: 'Enforce atmospheric physics and mass/energy conservation bounds' },
    { title: 'Alert locally', desc: 'Generate actionable risk scores for targeted emergency response' },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-between p-6 sm:p-10 max-w-6xl mx-auto space-y-12">
      {/* Top Banner: Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E4EE] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
          <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
            WARSHA Command Center
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-500">System Status:</span>
          {health ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {health.status?.toUpperCase() || 'OPERATIONAL'}
            </span>
          ) : loading ? (
            <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">
              CHECKING...
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600">
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {error && (
        <ErrorState detail={error} onRetry={() => setReloadIndex((n) => n + 1)} />
      )}

      {/* Hero Section */}
      <div className="space-y-6 text-center sm:text-left py-4">
        <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-mono font-semibold tracking-wide">
          SIH 2026 Prototype — Next-Gen Extreme Weather Anomaly Platform
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          AI-Powered Extreme <br className="hidden sm:inline" />
          <span className="text-blue-600">WARSHA Dashboard</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Real-time global anomaly detection, graph neural network trajectory tracking, and physics-validated conditional diffusion downscaling for extreme atmospheric hazards.
        </p>
      </div>

      {/* Prominent Philosophy Statement Section */}
      <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 border-b border-[#D9E4EE] pb-3">
          <span className="text-blue-600 font-mono text-sm font-bold uppercase tracking-wider">
            Operational Philosophy
          </span>
        </div>

        {/* 5-Line Philosophy Headline */}
        <div className="text-center sm:text-left">
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-800 tracking-wide leading-relaxed">
            Detect globally. Track intelligently. Downscale selectively. Validate physically. Alert locally.
          </p>
        </div>

        {/* 5-Step Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {philosophySteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-[#D9E4EE] p-4 rounded-xl space-y-1.5 hover:border-blue-400 transition-colors"
            >
              <div className="text-xs font-mono font-bold text-blue-600 flex items-center justify-between">
                <span>0{idx + 1}</span>
                <span className="text-slate-400 font-normal">→</span>
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{step.title}</h3>
              <p className="text-[11px] text-slate-500 leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Events Stat */}
        <div className="bg-white border border-[#D9E4EE] rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
              Active Events
            </span>
            <span className="text-3xl font-extrabold font-mono text-slate-900 mt-1 block">
              {loading || error ? '--' : activeEventsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Live anomaly instances</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-[#D9E4EE] flex items-center justify-center text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
        </div>

        {/* High Risk Zones Stat */}
        <div className="bg-white border border-[#D9E4EE] rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
              High-Risk Zones
            </span>
            <span className="text-3xl font-extrabold font-mono text-red-600 mt-1 block">
              {loading || error ? '--' : highRiskCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Severe severity zones</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-[#D9E4EE] flex items-center justify-center text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>

        {/* Backend / System Status Stat */}
        <div className="bg-white border border-[#D9E4EE] rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
              System Pipeline
            </span>
            <span
              className={`text-xl font-bold font-mono mt-2 block uppercase ${
                loading ? 'text-amber-600' : health ? 'text-emerald-600' : 'text-slate-600'
              }`}
            >
              {loading ? 'Checking' : health ? health.status : 'Offline'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">FastAPI backend link</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-[#D9E4EE] flex items-center justify-center text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Primary CTA Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white border border-[#D9E4EE] p-6 sm:p-8 rounded-2xl shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider font-mono">
            Ready to explore live atmospheric intelligence?
          </h2>
          <p className="text-xs text-slate-500">
            Access the primary command center dashboard for interactive trajectory mapping and risk assessment.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-sm font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-3 whitespace-nowrap cursor-pointer"
        >
          <span>Open Live Dashboard</span>
          <span className="text-lg">→</span>
        </Link>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs font-mono text-slate-400 border-t border-slate-200 pt-6">
        Smart India Hackathon 2026 — WARSHA Prototype Architecture
      </div>
    </div>
  );
}
