import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import SeverityBadge from '../components/common/SeverityBadge';
import ConfidenceBadge from '../components/common/ConfidenceBadge';

export default function EventExplorer() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Table sorting state
  const [sortField, setSortField] = useState('severity');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet('/events');
        setEvents(res.events || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError(`Failed to load events: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Filtered & Sorted events calculation
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Type filter
      if (typeFilter !== 'all' && evt.type !== typeFilter) return false;
      // Severity filter
      if (severityFilter !== 'all' && evt.severity !== severityFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && evt.status !== statusFilter) return false;
      // Search query (id or location)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchId = evt.event_id.toLowerCase().includes(q);
        const matchLoc = evt.location_name.toLowerCase().includes(q);
        const matchType = evt.type.toLowerCase().includes(q);
        if (!matchId && !matchLoc && !matchType) return false;
      }
      return true;
    });
  }, [events, typeFilter, severityFilter, statusFilter, searchQuery]);

  const sortedEvents = useMemo(() => {
    const severityOrder = { severe: 3, moderate: 2, low: 1 };
    return [...filteredEvents].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'severity') {
        valA = severityOrder[a.severity] || 0;
        valB = severityOrder[b.severity] || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEvents, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setSeverityFilter('all');
    setStatusFilter('all');
    setTimeFilter('all');
    setSearchQuery('');
  };

  const formatEventType = (type) => {
    return (type || '').replace('_', ' ').toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#D9E4EE] rounded-xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide text-slate-900 uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Event Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, filter, and inspect active extreme weather intelligence events across the region.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
            Total Detected: <strong className="text-blue-600">{events.length}</strong>
          </span>
          <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
            Showing: <strong className="text-blue-600">{sortedEvents.length}</strong>
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-xl shadow-sm">
          {error}
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="bg-white border border-[#D9E4EE] rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2.5">
          <span>Filter Parameters</span>
          <button
            onClick={resetFilters}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-mono transition-colors"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 uppercase block">Search</label>
            <input
              type="text"
              placeholder="ID, location, threat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Event Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 uppercase block">Event Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">All Types</option>
              <option value="extreme_rainfall">Extreme Rainfall</option>
              <option value="high_wind">High Wind</option>
              <option value="extreme_heat">Extreme Heat</option>
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 uppercase block">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">All Severities</option>
              <option value="severe">Severe</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 uppercase block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="dissipating">Dissipating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Time Window */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 uppercase block">Time Window</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">All Available</option>
              <option value="24h">Last 24 Hours</option>
              <option value="48h">Last 48 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-[#D9E4EE] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 space-y-3">
            <div className="w-4 h-4 rounded-full bg-blue-600 animate-ping mx-auto"></div>
            <div>Querying Event Intelligence Database...</div>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-slate-700 text-sm font-semibold">No events match the selected filters.</div>
            <p className="text-xs text-slate-500 font-mono">Try adjusting or resetting your filter criteria above.</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono transition-colors border border-slate-300"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-[#D9E4EE] text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th
                    onClick={() => handleSort('event_id')}
                    className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    Event ID {sortField === 'event_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    Threat Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('location_name')}
                    className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    Location {sortField === 'location_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('severity')}
                    className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    Severity {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('probability')}
                    className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    Probability {sortField === 'probability' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Confidence</th>
                  <th className="py-3.5 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E4EE]">
                {sortedEvents.map((evt) => (
                  <tr
                    key={evt.event_id}
                    onClick={() => {
                      localStorage.setItem('lastActiveEventId', evt.event_id);
                      navigate(`/events/${evt.event_id}`);
                    }}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group text-slate-800"
                  >
                    <td className="py-3.5 px-4 font-bold text-blue-600 group-hover:underline">
                      {evt.event_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-950">
                      {formatEventType(evt.type)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-sans font-medium">
                      {evt.location_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={evt.severity} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {Math.round(evt.probability * 100)}%
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-500">
                      {evt.status}
                    </td>
                    <td className="py-3.5 px-4">
                      <ConfidenceBadge confidence={evt.confidence} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/events/${evt.event_id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem('lastActiveEventId', evt.event_id);
                        }}
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                      >
                        Inspect Intelligence →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
