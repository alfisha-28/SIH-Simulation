import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';

const SEVERITY_ORDER = { severe: 1, moderate: 2, low: 3 };

export default function Alerts() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchAlerts() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet('/events');
        setEvents(res?.events || []);
      } catch (err) {
        console.error('Error fetching events for alerts:', err);
        setError(err.message || 'Failed to load active weather alerts');
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  // Map severity to Alert Level & Palette
  const getAlertConfig = (severity) => {
    const sev = (severity || '').toLowerCase();
    if (sev === 'severe') {
      return {
        level: 'CRITICAL',
        badgeBg: 'bg-red-500/20 border-red-500/50 text-red-400',
        cardBg: 'bg-slate-900/90 border-red-900/40 hover:border-red-600/60',
        glow: 'shadow-red-950/30',
        icon: '🚨',
      };
    } else if (sev === 'moderate') {
      return {
        level: 'HIGH',
        badgeBg: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
        cardBg: 'bg-slate-900/90 border-orange-900/40 hover:border-orange-600/60',
        glow: 'shadow-orange-950/30',
        icon: '⚠️',
      };
    } else {
      return {
        level: 'ADVISORY',
        badgeBg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
        cardBg: 'bg-slate-900/90 border-emerald-900/40 hover:border-emerald-600/60',
        glow: 'shadow-emerald-950/30',
        icon: 'ℹ️',
      };
    }
  };

  const sortedAlerts = useMemo(() => {
    return [...events].sort((a, b) => {
      const orderA = SEVERITY_ORDER[a.severity?.toLowerCase()] || 99;
      const orderB = SEVERITY_ORDER[b.severity?.toLowerCase()] || 99;
      return orderA - orderB;
    });
  }, [events]);

  const filteredAlerts = useMemo(() => {
    return sortedAlerts.filter((item) => {
      const config = getAlertConfig(item.severity);
      const matchesFilter =
        filterSeverity === 'ALL' || config.level === filterSeverity;
      const matchesSearch =
        item.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.event_id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sortedAlerts, filterSeverity, searchQuery]);

  const criticalCount = events.filter((e) => e.severity?.toLowerCase() === 'severe').length;
  const highCount = events.filter((e) => e.severity?.toLowerCase() === 'moderate').length;
  const advisoryCount = events.filter((e) => e.severity?.toLowerCase() === 'low').length;

  const formatEventType = (type) => {
    return (type || '').replace('_', ' ').toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                Emergency Alert Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 uppercase tracking-wide">
              Active Hazard Warnings & Advisories
            </h1>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <div className="px-3 py-1.5 bg-red-950/80 border border-red-800/60 rounded-lg text-red-300 font-bold flex items-center gap-1.5">
              <span>CRITICAL:</span>
              <span className="text-white bg-red-600 px-1.5 py-0.5 rounded text-[10px]">{criticalCount}</span>
            </div>
            <div className="px-3 py-1.5 bg-orange-950/80 border border-orange-800/60 rounded-lg text-orange-300 font-bold flex items-center gap-1.5">
              <span>HIGH:</span>
              <span className="text-white bg-orange-600 px-1.5 py-0.5 rounded text-[10px]">{highCount}</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-800/60 rounded-lg text-emerald-300 font-bold flex items-center gap-1.5">
              <span>ADVISORY:</span>
              <span className="text-white bg-emerald-600 px-1.5 py-0.5 rounded text-[10px]">{advisoryCount}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* Level Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            {['ALL', 'CRITICAL', 'HIGH', 'ADVISORY'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterSeverity(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  filterSeverity === lvl
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search location or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-950/60 border border-red-800 rounded-2xl text-red-200 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAlerts.length === 0 && (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <p className="text-sm font-bold text-slate-300">No active alerts found matching criteria.</p>
          <p className="text-xs font-mono text-slate-500">Try adjusting your severity filter or search query.</p>
        </div>
      )}

      {/* Alerts Grid */}
      {!loading && !error && filteredAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlerts.map((event) => {
            const config = getAlertConfig(event.severity);
            const probPct = Math.round((event.probability || 0) * 100);

            return (
              <div
                key={event.event_id}
                className={`border rounded-2xl p-6 shadow-xl backdrop-blur transition-all flex flex-col justify-between space-y-4 ${config.cardBg} ${config.glow}`}
              >
                {/* Card Header: Level Badge & Event ID */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-black font-mono uppercase tracking-wider border flex items-center gap-1.5 ${config.badgeBg}`}
                    >
                      <span>{config.icon}</span>
                      <span>{config.level}</span>
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {event.event_id}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
                      {formatEventType(event.type)}
                    </h2>
                    <p className="text-sm font-mono text-cyan-400 font-semibold mt-0.5 flex items-center gap-1">
                      📍 {event.location_name}
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  {/* Probability Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confidence / Probability:</span>
                      <span className="text-slate-200 font-bold">{probPct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          probPct >= 80
                            ? 'bg-red-500'
                            : probPct >= 60
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${probPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Valid Window & Lead Time */}
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Valid Window:</span>
                      <span className="text-slate-300 font-semibold">Current (+{event.forecast_lead_time_hours || 48}h)</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Detected: {event.detected_at ? new Date(event.detected_at).toUTCString().replace(' GMT', '') : 'Active System Window'}
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="pt-2">
                  <Link
                    to={`/events/${event.event_id}`}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <span>View Event Intelligence</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

