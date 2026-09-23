import SeverityBadge from '../common/SeverityBadge';
import { formatEventType } from '../../lib/format';

export default function ActiveEventList({
  events = [],
  selectedEventId,
  onSelectEvent,
  error = null,
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-full text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          Active Events ({error ? '--' : events.length})
        </h3>
        <span className="text-[11px] text-slate-400 font-mono font-medium">Sorted by Risk</span>
      </div>

      {/* Cards List */}
      <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
        {events.length === 0 ? (
          <div className="p-6 text-xs text-slate-500 text-center font-mono">
            {error ? 'Unable to load events.' : 'No active events reported.'}
          </div>
        ) : (
          events.map((evt) => {
            const isSelected = evt.event_id === selectedEventId;
            return (
              <div
                key={evt.event_id}
                onClick={() => onSelectEvent(evt.event_id)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer space-y-2.5 relative ${
                  isSelected
                    ? 'bg-blue-50/60 border-blue-300'
                    : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-sm hover:-translate-y-0.5'
                }`}
              >
                {/* Active Indicator Strip */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-600 rounded-r-full"></div>
                )}

                {/* Top Row: Event Type & Severity Badge */}
                <div className="flex items-center justify-between pl-1">
                  <span className="text-[11px] font-extrabold tracking-wider text-slate-800 uppercase font-mono">
                    {formatEventType(evt.type)}
                  </span>
                  <SeverityBadge severity={evt.severity} />
                </div>

                {/* Middle Row: Location Name */}
                <div className="text-sm font-bold text-slate-900 pl-1 flex items-center justify-between">
                  <span className="truncate">{evt.location_name}</span>
                  <span className="text-xs font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                    {Math.round(evt.probability * 100)}% prob
                  </span>
                </div>

                {/* Bottom Row: Metadata details */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200/60 pl-1">
                  <span className="font-semibold text-slate-600">ID: {evt.event_id}</span>
                  <span className="capitalize text-slate-500">{evt.status}</span>
                  <span className="text-slate-500">Conf: {evt.confidence}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
