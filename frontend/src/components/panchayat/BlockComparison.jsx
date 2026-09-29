import {
  getBlock,
  getBlockForecast,
  getBlockPanchayats,
  getForecast,
  getPanchayat,
} from '../../lib/panchayatData';
import SeverityBadge from '../common/SeverityBadge';
import { formatRainMm } from './forecastFormat';
import { getHeatmapColor } from './heatmapScales';

// Every Gram Panchayat of the selected Panchayat's block, side by side: one
// value per GP in downscaled mode, the same block value repeated in coarse
// mode. Reading the list makes the point of the whole demo without a chart: the
// block average hides the difference between its Panchayats. Rows are real
// buttons, so it doubles as a keyboard-friendly way to pick a Panchayat.
//
// Props: panchayatId, leadHours, mode ('downscaled' | 'coarse'), variable (which
// heatmap variable the colour swatches follow), onSelect(gpId), className.

export default function BlockComparison({ panchayatId, leadHours, mode, variable = 'risk', onSelect, className = '' }) {
  const selected = getPanchayat(panchayatId);
  const block = selected ? getBlock(selected.blockId) : null;
  if (!block) return null;

  const isCoarse = mode === 'coarse';
  const blockForecast = getBlockForecast(block.id, leadHours);
  const members = getBlockPanchayats(block.id);
  const [spreadLo, spreadHi] = blockForecast.spread.rainfallMm;

  return (
    <section
      aria-label={`Panchayats in ${block.name} block`}
      className={`bg-white border border-[#D9E4EE] rounded-2xl p-5 shadow-sm space-y-4 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Panchayats in {block.name} block
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCoarse
              ? `Coarse view: all ${members.length} share the block value.`
              : `Downscaled view: each of the ${members.length} has its own value.`}
          </p>
        </div>
        <div className="sm:text-right text-xs font-mono text-slate-600">
          <div>
            Block forecast <span className="font-bold text-slate-900">{formatRainMm(blockForecast.rainfallMm)} mm</span>
          </div>
          <div className="text-slate-500">
            Panchayat spread {formatRainMm(spreadLo)}&ndash;{formatRainMm(spreadHi)} mm
          </div>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
        {members.map((gp) => {
          const f = getForecast(gp.id, leadHours, mode);
          const isSelected = gp.id === panchayatId;
          return (
            <li key={gp.id}>
              <button
                type="button"
                onClick={() => onSelect?.(gp.id)}
                aria-pressed={isSelected}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 ${
                  isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-sm border border-black/10 shrink-0"
                  style={{ backgroundColor: getHeatmapColor(variable, f) }}
                  aria-hidden="true"
                />
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm truncate ${isSelected ? 'font-bold text-blue-700' : 'font-semibold text-slate-800'}`}>
                    {gp.name}
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">{f.condition}</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 tabular-nums whitespace-nowrap">
                  {formatRainMm(f.rainfallMm)} mm
                </span>
                <SeverityBadge severity={f.risk} className="shrink-0 min-w-[5.5rem] justify-center" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
