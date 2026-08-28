import SeverityBadge from '../common/SeverityBadge';

export default function ActiveEventList({
  events = [],
  selectedEventId,
  onSelectEvent,
}) {
  const formatEventType = (type) => {
    return (type || '').replace('_', ' ').toUpperCase();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm flex flex-col h-full text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Active Events ({events.length})
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">Sorted by Risk</span>
      </div>

      {/* Cards List */}
      <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
        {events.length === 0 ? (
          <div className="p-4 text-xs text-slate-400 text-center font-mono">
            No active events reported.
          </div>
        ) : (
          events.map((evt) => {
            const isSelected = evt.event_id === selectedEventId;
            return (
              <div
                key={evt.event_id}
                onClick={() => onSelectEvent(evt.event_id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500/50 shadow-sm ring-1 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/50'
                }`}
              >
                {/* Active Indicator Strip */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full"></div>
                )}

                {/* Top Row: Event Type & Severity Badge */}
                <div className="flex items-center justify-between pl-1">
                  <span className="text-[11px] font-extrabold tracking-wider text-slate-700 uppercase font-mono">
                    {formatEventType(evt.type)}
                  </span>
                  <SeverityBadge severity={evt.severity} />
                </div>

                {/* Middle Row: Location Name */}
                <div className="text-sm font-semibold text-slate-900 pl-1 flex items-center justify-between">
                  <span>{evt.location_name}</span>
                  <span className="text-xs font-mono text-blue-600 font-bold">
                    {Math.round(evt.probability * 100)}% prob
                  </span>
                </div>

                {/* Bottom Row: Metadata details */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200/80 pl-1">
                  <span>ID: {evt.event_id}</span>
                  <span className="capitalize">{evt.status}</span>
                  <span>Confidence: {evt.confidence}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
