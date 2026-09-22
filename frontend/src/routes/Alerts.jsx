import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';

const SEVERITY_ORDER = { severe: 1, moderate: 2, low: 3 };

const EventTypeIcon = ({ type }) => {
  const t = (type || '').toLowerCase();
  if (t.includes('rain') || t.includes('flood') || t.includes('storm')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
      </div>
    );
  }
  if (t.includes('heat') || t.includes('fire') || t.includes('sun')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25M4.284 12h-2.25m15.364 6.364l-1.591-1.591M6.759 6.759L5.168 5.168m12.728 0l-1.591 1.591M6.759 17.241l-1.591 1.591M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
        </svg>
      </div>
    );
  }
  if (t.includes('wind') || t.includes('cyclone') || t.includes('gale')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a1.5 1.5 0 00-1.5-1.5H3m14.25-4.5h-15.75m18-4.5h-16.5m18.75 0a2.25 2.25 0 100-4.5h-1.5" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
  );
};

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
        badgeBg: 'bg-red-50 border-red-200 text-red-700',
        dotBg: 'bg-red-500',
        pingBg: 'bg-red-400',
        barColor: 'bg-red-500',
        probBadge: 'bg-red-50 text-red-700',
        label: 'Extreme weather threat detected'
      };
    } else if (sev === 'moderate' || sev === 'warning') {
      return {
        level: 'MODERATE RISK',
        badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
        dotBg: 'bg-amber-500',
        pingBg: 'bg-amber-400',
        barColor: 'bg-amber-500',
        probBadge: 'bg-amber-50 text-amber-700',
        label: 'Heavy weather activity or heightened risk expected'
      };
    } else {
      return {
        level: 'LOW RISK',
        badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        dotBg: 'bg-emerald-500',
        pingBg: 'bg-emerald-400',
        barColor: 'bg-emerald-500',
        probBadge: 'bg-emerald-50 text-emerald-700',
        label: 'No immediate severe weather hazard reported'
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-red-600 uppercase">
                Emergency Alert Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Active Hazard Warnings & Advisories
            </h1>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="px-3.5 py-1.5 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold flex items-center gap-2 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider font-mono">Critical:</span>
              <span className="text-xs font-mono font-bold">{criticalCount}</span>
            </div>
            <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-semibold flex items-center gap-2 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider font-mono">High:</span>
              <span className="text-xs font-mono font-bold">{highCount}</span>
            </div>
            <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold flex items-center gap-2 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider font-mono">Advisory:</span>
              <span className="text-xs font-mono font-bold">{advisoryCount}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* Level Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto">
            {['ALL', 'CRITICAL', 'HIGH', 'ADVISORY'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterSeverity(lvl)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  filterSeverity === lvl
                    ? 'bg-white text-blue-600 border border-slate-200/80 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
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
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
          <p className="text-sm font-bold text-slate-800">No active alerts found matching criteria.</p>
          <p className="text-xs text-slate-500">Try adjusting your severity filter or search query.</p>
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
                className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-5 group"
              >
                {/* Card Header: Level Badge & Event ID */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider border flex items-center gap-2 ${config.badgeBg}`}
                    >
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pingBg} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotBg}`}></span>
                      </span>
                      <span>{config.level}</span>
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                      {event.event_id}
                    </span>
                  </div>

                  {/* Title, Icon & Location */}
                  <div className="flex items-start gap-3">
                    <EventTypeIcon type={event.type} />
                    <div className="space-y-1 flex-1 min-w-0">
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors uppercase">
                        {formatEventType(event.type)}
                      </h2>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="truncate">{event.location_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Threat Description */}
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {config.label}
                </p>

                {/* Details Section: Progress & Windows */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {/* Probability Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Confidence / Probability</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${config.probBadge}`}>
                        {probPct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                      <div
                        className={`h-full rounded-full ${config.barColor} transition-all duration-500`}
                        style={{ width: `${probPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Valid Window & System Info */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Valid Window
                      </span>
                      <span className="font-semibold font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                        Current (+{event.forecast_lead_time_hours || 48}h)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/50">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Detected Window
                      </span>
                      <span className="font-mono text-slate-600">
                        {event.detected_at ? new Date(event.detected_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Active Window'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-1">
                  <Link
                    to={`/events/${event.event_id}`}
                    onClick={() => localStorage.setItem('lastActiveEventId', event.event_id)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>View Event Intelligence</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
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
