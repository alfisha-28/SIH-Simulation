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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            Weather Intelligence Command Center
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-500">System Status:</span>
          {health ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {health.status?.toUpperCase() || 'OPERATIONAL'}
            </span>
          ) : loading ? (
            <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-800/60 text-amber-400">
              CHECKING...
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              STANDBY
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs font-mono">
          ⚠️ Backend Warning: {error} (Displaying available interface)
        </div>
      )}

      {/* Hero Section */}
      <div className="space-y-6 text-center sm:text-left py-4">
        <div className="inline-block px-3 py-1 bg-cyan-950/60 border border-cyan-800/50 rounded-full text-cyan-300 text-xs font-mono font-semibold tracking-wide">
          SIH 2026 Prototype — Next-Gen Extreme Weather Anomaly Platform
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
          AI-Powered Extreme <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
            Weather Intelligence
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Real-time global anomaly detection, graph neural network trajectory tracking, and physics-validated conditional diffusion downscaling for extreme atmospheric hazards.
        </p>
      </div>

      {/* Prominent Philosophy Statement Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <span className="text-cyan-400 font-mono text-sm font-bold uppercase tracking-wider">
            Operational Philosophy
          </span>
        </div>

        {/* 5-Line Philosophy Headline */}
        <div className="text-center sm:text-left">
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-200 tracking-wide leading-relaxed">
            <span className="text-cyan-400">Detect globally.</span>{' '}
            <span className="text-blue-400">Track intelligently.</span>{' '}
            <span className="text-indigo-400">Downscale selectively.</span>{' '}
            <span className="text-emerald-400">Validate physically.</span>{' '}
            <span className="text-amber-400">Alert locally.</span>
          </p>
        </div>

        {/* 5-Step Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {philosophySteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-1.5 hover:border-cyan-800/60 transition-colors"
            >
              <div className="text-xs font-mono font-bold text-cyan-400 flex items-center justify-between">
                <span>0{idx + 1}</span>
                <span className="text-slate-600 font-normal">→</span>
              </div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{step.title}</h3>
              <p className="text-[11px] text-slate-400 leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Events Stat */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Active Events
            </span>
            <span className="text-3xl font-extrabold font-mono text-cyan-400 mt-1 block">
              {loading ? '...' : activeEventsCount}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Live anomaly instances</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 font-mono font-bold">
            ⚡
          </div>
        </div>

        {/* High Risk Zones Stat */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              High-Risk Zones
            </span>
            <span className="text-3xl font-extrabold font-mono text-red-400 mt-1 block">
              {loading ? '...' : highRiskCount}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Severe severity zones</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-800/50 flex items-center justify-center text-red-400 font-mono font-bold">
            ⚠
          </div>
        </div>

        {/* Backend / System Status Stat */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              System Pipeline
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-2 block uppercase">
              {health?.status || 'Operational'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">FastAPI backend link</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 font-mono font-bold">
            ✓
          </div>
        </div>
      </div>

      {/* Primary CTA Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-900/40 p-6 sm:p-8 rounded-2xl shadow-2xl">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider font-mono">
            Ready to explore live atmospheric intelligence?
          </h2>
          <p className="text-xs text-slate-400">
            Access the primary command center dashboard for interactive trajectory mapping and risk assessment.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="w-full sm:w-auto px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-mono text-sm font-bold uppercase tracking-wider shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-3 whitespace-nowrap cursor-pointer"
        >
          <span>Open Live Dashboard</span>
          <span className="text-lg">→</span>
        </Link>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs font-mono text-slate-500 border-t border-slate-900 pt-6">
        Smart India Hackathon 2026 — Weather Intelligence Prototype Architecture
      </div>
    </div>
  );
}

