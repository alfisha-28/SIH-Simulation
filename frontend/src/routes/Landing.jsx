import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';

export default function Landing() {
  const [events, setEvents] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLandingData() {
      setLoading(true);
      setError(null);
      try {
        const [eventsRes, healthRes] = await Promise.all([
          apiGet('/events').catch((err) => {
            console.error('Failed to fetch /events on landing:', err);
            return { events: [] };
          }),
          apiGet('/health').catch((err) => {
            console.error('Failed to fetch /health on landing:', err);
            return null;
          }),
        ]);
        setEvents(eventsRes?.events || []);
        setHealth(healthRes);
      } catch (err) {
        setError(err.message || 'Failed to connect to weather intelligence system');
      } finally {
        setLoading(false);
      }
    }

    loadLandingData();
  }, []);

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
              STANDBY
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-mono">
          ⚠️ Backend Warning: {error} (Displaying available interface)
        </div>
      )}

      {/* Hero Section */}
      <div className="space-y-6 text-center sm:text-left py-4">
        <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-mono font-semibold tracking-wide">
          SIH 2026 Prototype — Next-Gen Extreme Weather Anomaly Platform
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          AI-Powered Extreme <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            WARSHA Dashboard
          </span>
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
            <span className="text-blue-600">Detect globally.</span>{' '}
            <span className="text-indigo-600">Track intelligently.</span>{' '}
            <span className="text-violet-600">Downscale selectively.</span>{' '}
            <span className="text-emerald-600">Validate physically.</span>{' '}
            <span className="text-amber-600">Alert locally.</span>
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
            <span className="text-3xl font-extrabold font-mono text-blue-600 mt-1 block">
              {loading ? '...' : activeEventsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Live anomaly instances</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-mono font-bold">
            ⚡
          </div>
        </div>

        {/* High Risk Zones Stat */}
        <div className="bg-white border border-[#D9E4EE] rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
              High-Risk Zones
            </span>
            <span className="text-3xl font-extrabold font-mono text-red-600 mt-1 block">
              {loading ? '...' : highRiskCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Severe severity zones</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-mono font-bold">
            ⚠
          </div>
        </div>

        {/* Backend / System Status Stat */}
        <div className="bg-white border border-[#D9E4EE] rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
              System Pipeline
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 mt-2 block uppercase">
              {health?.status || 'Operational'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">FastAPI backend link</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-mono font-bold">
            ✓
          </div>
        </div>
      </div>

      {/* Primary CTA Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 sm:p-8 rounded-2xl shadow-sm">
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
          className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-sm font-bold uppercase tracking-wider shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-3 whitespace-nowrap cursor-pointer"
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
