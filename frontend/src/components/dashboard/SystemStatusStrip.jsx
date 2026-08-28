export default function SystemStatusStrip({
  events = [],
  selectedEvent,
  onRefresh,
  loading = false,
}) {
  const activeCount = events.length;
  const severeCount = events.filter((e) => e.severity === 'severe').length;
  const moderateCount = events.filter((e) => e.severity === 'moderate').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-slate-800">
      {/* Title & Live Status */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-slate-900 uppercase flex items-center gap-2">
            WARSHA Dashboard
          </h1>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[11px]">OPERATIONAL RADAR ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Metrics Counters Strip */}
      <div className="flex items-center space-x-4 text-xs font-mono">
        <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg space-y-0.5">
          <span className="text-[10px] text-blue-500 uppercase block font-bold">Active Threats</span>
          <span className="text-sm font-bold text-blue-700">{activeCount} Events</span>
        </div>

        <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg space-y-0.5">
          <span className="text-[10px] text-red-500 uppercase block font-bold">Severe</span>
          <span className="text-sm font-bold text-red-700">{severeCount} Critical</span>
        </div>

        <div className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg space-y-0.5 hidden sm:block">
          <span className="text-[10px] text-yellow-600 uppercase block font-bold font-semibold">Moderate</span>
          <span className="text-sm font-bold text-yellow-700">{moderateCount} Events</span>
        </div>

        {selectedEvent && (
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5 hidden md:block">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Focused Threat</span>
            <span className="text-sm font-bold text-slate-700">
              {selectedEvent.event_id} ({selectedEvent.location_name})
            </span>
          </div>
        )}
      </div>

      {/* Manual Refresh Action */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-colors border border-slate-300"
      >
        <svg
          className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
      </button>
    </div>
  );
}
