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
    if (sev === 'severe' || sev === 'high') {
      return {
        level: 'SEVERE ALERT',
        badgeBg: 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]',
        cardBg: 'bg-[#FEE2E2]/60 border-[#FCA5A5] border-l-4 text-slate-800 hover:bg-[#FEE2E2]/85',
        glow: 'shadow-red-100',
        icon: '🔴',
        label: 'Extreme weather threat detected'
      };
    } else if (sev === 'moderate' || sev === 'warning') {
      return {
        level: 'MODERATE RISK',
        badgeBg: 'bg-[#FEF3C7] border-[#FDE047] text-[#D97706]',
        cardBg: 'bg-[#FEF3C7]/60 border-[#FDE047] border-l-4 text-slate-800 hover:bg-[#FEF3C7]/85',
        glow: 'shadow-yellow-100',
        icon: '🟡',
        label: 'Heavy rainfall or normal severity expected'
      };
    } else {
      return {
        level: 'LOW RISK',
        badgeBg: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
        cardBg: 'bg-[#DCFCE7]/60 border-[#86EFAC] border-l-4 text-slate-800 hover:bg-[#DCFCE7]/85',
        glow: 'shadow-green-100',
        icon: '🟢',
        label: 'No significant weather threat detected'
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
        filterSeverity === 'ALL' || 
        (filterSeverity === 'CRITICAL' && config.level === 'SEVERE ALERT') ||
        (filterSeverity === 'HIGH' && config.level === 'MODERATE RISK') ||
        (filterSeverity === 'ADVISORY' && config.level === 'LOW RISK');
      const matchesSearch =
        item.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.event_id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sortedAlerts, filterSeverity, searchQuery]);

  const criticalCount = events.filter((e) => e.severity?.toLowerCase() === 'severe' || e.severity?.toLowerCase() === 'high').length;
  const highCount = events.filter((e) => e.severity?.toLowerCase() === 'moderate' || e.severity?.toLowerCase() === 'warning').length;
  const advisoryCount = events.filter((e) => e.severity?.toLowerCase() === 'low' || e.severity?.toLowerCase() === 'safe').length;

  const formatEventType = (type) => {
    return (type || '').replace('_', ' ').toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Top Banner Header */}
      <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-650 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-red-700 uppercase">
                Emergency Alert Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wide">
              Active Hazard Warnings & Advisories
            </h1>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <div className="px-3 py-1.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg text-[#DC2626] font-bold flex items-center gap-1.5">
              <span>CRITICAL:</span>
              <span className="text-white bg-[#DC2626] px-1.5 py-0.5 rounded text-[10px]">{criticalCount}</span>
            </div>
            <div className="px-3 py-1.5 bg-[#FEF3C7] border border-[#FDE047] rounded-lg text-[#D97706] font-bold flex items-center gap-1.5">
              <span>HIGH:</span>
              <span className="text-white bg-[#D97706] px-1.5 py-0.5 rounded text-[10px]">{highCount}</span>
            </div>
            <div className="px-3 py-1.5 bg-[#DCFCE7] border border-[#86EFAC] rounded-lg text-[#15803D] font-bold flex items-center gap-1.5">
              <span>ADVISORY:</span>
              <span className="text-white bg-[#15803D] px-1.5 py-0.5 rounded text-[10px]">{advisoryCount}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* Level Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
            {['ALL', 'CRITICAL', 'HIGH', 'ADVISORY'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterSeverity(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  filterSeverity === lvl
                    ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
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
              className="w-full bg-slate-50 border border-slate-305 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAlerts.length === 0 && (
        <div className="p-12 text-center bg-white border border-[#D9E4EE] rounded-2xl space-y-2">
          <p className="text-sm font-bold text-slate-800">No active alerts found matching criteria.</p>
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
                className={`border rounded-2xl p-6 shadow-sm transition-all flex flex-col justify-between space-y-4 ${config.cardBg} ${config.glow}`}
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

                    <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                      {event.event_id}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
                      {formatEventType(event.type)}
                    </h2>
                    <p className="text-sm font-mono text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                      📍 {event.location_name}
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3 pt-2 border-t border-slate-200 text-xs font-mono">
                  {/* Custom Label */}
                  <div className="text-slate-600 text-[11px]">
                    {config.label}
                  </div>

                  {/* Probability Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-550">Confidence / Probability:</span>
                      <span className="text-slate-800 font-bold">{probPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          probPct >= 80
                            ? 'bg-[#DC2626]'
                            : probPct >= 60
                            ? 'bg-[#D97706]'
                            : 'bg-[#15803D]'
                        }`}
                        style={{ width: `${probPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Valid Window & Lead Time */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Valid Window:</span>
                      <span className="text-slate-800 font-semibold">Current (+{event.forecast_lead_time_hours || 48}h)</span>
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
                    onClick={() => localStorage.setItem('lastActiveEventId', event.event_id)}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
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
