import { getHeatmapVariable } from './heatmapScales';

// Legend for the active heatmap variable: title with units, a one-line note
// (accumulation window / threshold basis) and one swatch per class. The
// swatches sit in a single row so the legend stays compact on a phone-sized map.
export default function MapLegend({ variable, className = '' }) {
  const def = getHeatmapVariable(variable);
  return (
    <div
      className={`bg-white/95 backdrop-blur border border-[#D9E4EE] rounded-lg shadow-md px-2.5 py-2 max-w-[calc(100%-1.5rem)] ${className}`}
      role="group"
      aria-label={`Map legend: ${def.legendTitle}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[11px] font-mono font-bold text-slate-800 uppercase tracking-wide">
          {def.legendTitle}
        </span>
        <span className="text-[10px] text-slate-500">{def.legendNote}</span>
      </div>
      <ul className="mt-1.5 flex">
        {def.classes.map((c) => (
          <li key={c.label} className="flex-1 min-w-0 sm:flex-none sm:w-12 text-center">
            <span
              className="block h-2.5 border border-white/80 first:rounded-l last:rounded-r"
              style={{ backgroundColor: c.color }}
              aria-hidden="true"
            />
            <span className="block mt-0.5 text-[9px] leading-tight font-mono text-slate-600 truncate">
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
