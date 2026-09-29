import { useState } from 'react';
import SeverityBadge from '../common/SeverityBadge';
import AdvisoryStatusBadge from './AdvisoryStatusBadge';
import { formatPercent } from '../panchayat/forecastFormat';

// High-Risk Panchayats table for the KVK dashboard.
//
// Props
//   rows         [{ gp, peak: { risk, leadLabel, forecast }, advisory }] already sorted by
//                severity (advisory = merged workflow advisory or null)
//   selectedId   GP id to highlight (or null)
//   onSelect     (gpId) => void; called by clicking a row or its Panchayat name
//   initialCount rows shown before "Show all" (default 10). A selected GP further
//                down the list expands the table so the highlight is never hidden.
//
// The table scrolls inside its own container on narrow screens, so the page
// itself never overflows; the Panchayat column stays pinned while it scrolls.

const HEAD = 'px-3 py-2.5 text-left text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50';

export default function HighRiskTable({ rows, selectedId, onSelect, initialCount = 10 }) {
  const [expanded, setExpanded] = useState(false);
  const selectedIndex = rows.findIndex((r) => r.gp.id === selectedId);
  const showAll = expanded || selectedIndex >= initialCount;
  const visible = showAll ? rows : rows.slice(0, initialCount);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full min-w-[860px] text-sm border-collapse">
          <caption className="sr-only">
            High-risk Panchayats, most severe first. Select a row to show the Panchayat on the map.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={`${HEAD} sticky left-0 z-10 border-r border-slate-200/80`}>Panchayat</th>
              <th scope="col" className={HEAD}>Block</th>
              <th scope="col" className={HEAD}>District</th>
              <th scope="col" className={HEAD}>Peak risk</th>
              <th scope="col" className={HEAD}>Condition</th>
              <th scope="col" className={HEAD}>When</th>
              <th scope="col" className={HEAD} title="Chance of any rain (at least 2.5 mm) at the peak lead time, not the chance of the peak-risk threshold">
                Any rain
              </th>
              <th scope="col" className={HEAD}>Key crop</th>
              <th scope="col" className={HEAD}>Advisory</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ gp, peak, advisory }) => {
              const selected = gp.id === selectedId;
              const bg = selected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50';
              const keyCrop = gp.crops[0];
              return (
                <tr
                  key={gp.id}
                  onClick={() => onSelect(gp.id)}
                  aria-current={selected ? 'true' : undefined}
                  className={`border-t border-slate-100 cursor-pointer transition-colors ${bg}`}
                >
                  <th
                    scope="row"
                    className={`px-3 py-2 text-left font-bold text-slate-900 whitespace-nowrap sticky left-0 z-10 border-r border-slate-100 ${
                      selected ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(gp.id);
                      }}
                      aria-pressed={selected}
                      title="Show on the map"
                      className="text-left font-bold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-sm"
                    >
                      {gp.name}
                    </button>
                  </th>
                  <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{gp.blockName}</td>
                  <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{gp.districtName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <SeverityBadge severity={peak.risk} />
                  </td>
                  <td className="px-3 py-2 text-slate-800 whitespace-nowrap">{peak.forecast.condition}</td>
                  {/* Lead time over valid time (and crop over stage below): stacking keeps the
                      table inside its card at desktop widths, so the Advisory column is never clipped. */}
                  <td className="px-3 py-2 text-slate-700 font-mono text-xs">
                    <span className="block whitespace-nowrap font-semibold">{peak.leadLabel}</span>
                    <span className="block whitespace-nowrap text-slate-500">{peak.forecast.validTime}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-700 tabular-nums font-mono text-xs">
                    {formatPercent(peak.forecast.rainProbability)}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {keyCrop ? (
                      <>
                        <span className="block whitespace-nowrap">{keyCrop.crop}</span>
                        <span className="block whitespace-nowrap text-xs text-slate-500">{keyCrop.stage}</span>
                      </>
                    ) : (
                      '--'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <AdvisoryStatusBadge status={advisory?.status ?? null} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length > initialCount && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-500">
            Showing {visible.length} of {rows.length} high-risk Panchayats
          </span>
          {selectedIndex < initialCount && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={showAll}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              {showAll ? 'Show fewer' : `Show all ${rows.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
