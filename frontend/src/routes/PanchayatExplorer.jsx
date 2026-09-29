import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BlockComparison from '../components/panchayat/BlockComparison';
import PanchayatMap from '../components/panchayat/PanchayatMap';
import PanchayatPanel from '../components/panchayat/PanchayatPanel';
import { HEATMAP_VARIABLES } from '../components/panchayat/heatmapScales';
import SimulatedDataBadge from '../components/common/SimulatedDataBadge';
import TimelineSlider from '../components/common/TimelineSlider';
import {
  BLOCKS,
  DISTRICTS,
  LEAD_HOURS,
  PANCHAYATS,
  getBlockPanchayats,
  getDefaultPanchayatId,
  getForecastSeries,
  getPanchayat,
} from '../lib/panchayatData';

// Panchayat Explorer (/panchayats): the demo of what the downscaling system
// produces. A coarse block forecast versus the same forecast downscaled to Gram
// Panchayat boundaries, with uncertainty, over a 48 h timeline.
//
// URL contract (so other screens can deep-link here):
//   ?gp=<panchayat id>   selected Panchayat (see lib/panchayatData.js). Unknown ids
//                        fall back to the default GP with a visible notice.
//   ?t=<hours>           lead time: 0 | 6 | 12 | 24 | 48 (default 0 = Now)
// Selection writes back to the URL with `replace`, so scrubbing and clicking do
// not fill the browser history. Mode and colour variable are local UI state.

// Worst peak risk over the horizon, computed once: the data is deterministic.
const DEFAULT_GP_ID = getDefaultPanchayatId();

const MICRO = 'text-[11px] font-mono text-slate-500 uppercase tracking-wide';

const MODES = [
  { key: 'coarse', label: 'Coarse Block Forecast' },
  { key: 'downscaled', label: 'Downscaled Panchayat Forecast' },
];

const segmentClass = (active) =>
  `px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
    active
      ? 'bg-white text-blue-600 border border-slate-200/80 shadow-xs'
      : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-200/60'
  }`;

export default function PanchayatExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState('downscaled');
  const [variable, setVariable] = useState('risk');

  const requestedGp = searchParams.get('gp');
  const requestedIsValid = Boolean(requestedGp && getPanchayat(requestedGp));
  const selectedId = requestedIsValid ? requestedGp : DEFAULT_GP_ID;
  const selected = getPanchayat(selectedId);

  const requestedLead = Number(searchParams.get('t'));
  const leadHours = LEAD_HOURS.includes(requestedLead) ? requestedLead : 0;
  const leadIndex = LEAD_HOURS.indexOf(leadHours);

  const updateParams = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === null) next.delete(key);
            else next.set(key, value);
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selectPanchayat = useCallback((id) => updateParams({ gp: id }), [updateParams]);
  const selectLeadHours = useCallback(
    (hours) => updateParams({ t: hours === 0 ? null : String(hours) }),
    [updateParams]
  );
  const selectLeadIndex = useCallback((index) => selectLeadHours(LEAD_HOURS[index] ?? 0), [selectLeadHours]);

  // TimelineSlider's item shape. Rebuilt only when the GP or mode changes, so
  // stepping through lead times does not reset its Play button.
  const timeline = useMemo(
    () =>
      getForecastSeries(selectedId, mode).map((f) => ({
        timestep_label: f.leadLabel,
        timestep_hours_offset: f.leadHours,
        probability: f.rainProbability,
        risk_level: f.risk,
      })),
    [selectedId, mode]
  );

  const blockComparison = (
    <BlockComparison
      panchayatId={selectedId}
      leadHours={leadHours}
      mode={mode}
      variable={variable}
      onSelect={selectPanchayat}
    />
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Header */}
      <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                Panchayat-Level Weather Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Panchayat Explorer
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SimulatedDataBadge />
            <Link
              to="/system"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Pipeline &amp; data sources
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          A coarse block forecast is downscaled to a 2&ndash;3&nbsp;km prototype grid and aggregated to Gram
          Panchayat boundaries, with an uncertainty range for each. Pick a Panchayat, scrub the 48&nbsp;h timeline
          and flip the toggle to see what the downscaling adds over the block forecast.
        </p>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-xs">
          {[
            [PANCHAYATS.length, 'Gram Panchayats'],
            [BLOCKS.length, 'blocks'],
            [DISTRICTS.length, 'districts (South Gujarat)'],
          ].map(([count, label]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <dt className="sr-only">{label}</dt>
              <dd className="text-base font-extrabold text-slate-900 font-mono">{count}</dd>
              <span className="text-slate-500" aria-hidden="true">{label}</span>
            </div>
          ))}
        </dl>
      </div>

      {/* Controls */}
      <div className="bg-white border border-[#D9E4EE] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-1.5">
            <span className={`${MICRO} block`} id="mode-label">Forecast view</span>
            <div
              role="group"
              aria-labelledby="mode-label"
              className="grid grid-cols-2 sm:inline-grid gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto"
            >
              {MODES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  aria-pressed={mode === key}
                  className={`${segmentClass(mode === key)} leading-tight`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 lg:w-80">
            <label htmlFor="panchayat-select" className={`${MICRO} block`}>
              Panchayat
            </label>
            <select
              id="panchayat-select"
              value={selectedId}
              onChange={(e) => selectPanchayat(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            >
              {DISTRICTS.map((district) =>
                district.blockIds.map((blockId) => {
                  const block = BLOCKS.find((b) => b.id === blockId);
                  return (
                    <optgroup key={blockId} label={`${district.name} district · ${block.name} block`}>
                      {getBlockPanchayats(blockId).map((gp) => (
                        <option key={gp.id} value={gp.id}>
                          {gp.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })
              )}
            </select>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-slate-100 pt-4">
          <span className={MICRO} id="variable-label">Colour map by</span>
          <div
            role="group"
            aria-labelledby="variable-label"
            className="flex flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 w-full sm:w-fit"
          >
            {HEATMAP_VARIABLES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setVariable(key)}
                aria-pressed={variable === key}
                className={segmentClass(variable === key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {requestedGp && !requestedIsValid && (
          <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            No Panchayat with id &ldquo;{requestedGp}&rdquo; in this dataset. Showing {selected.name} instead.
          </p>
        )}
      </div>

      {/* Map + panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <PanchayatMap
            mode={mode}
            variable={variable}
            leadHours={leadHours}
            selectedId={selectedId}
            onSelect={selectPanchayat}
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            {mode === 'coarse'
              ? 'Coarse view: each block is one colour. Click inside a block to select a Panchayat and compare it with the block value.'
              : 'Downscaled view: each Gram Panchayat has its own value. Click a polygon or use the Panchayat list to select it.'}
          </p>
          <TimelineSlider
            timeline={timeline}
            selectedIndex={leadIndex}
            onSelectIndex={selectLeadIndex}
            title={`Forecast timeline · ${selected.name}`}
            stepGridClassName="grid-cols-5"
            showStepOffsets={false}
          />
          <p className="text-xs text-slate-500">
            Percentages under each step are the rain probability (chance of at least 2.5&nbsp;mm in the 24&nbsp;h
            ending at that time) for the selected Panchayat.
          </p>
          {/* Wide layout: sits under the timeline. Narrow layout renders it after the panel instead (below). */}
          <div className="hidden lg:block">{blockComparison}</div>
        </div>

        <div className="min-w-0 space-y-6">
          <PanchayatPanel
            panchayatId={selectedId}
            leadHours={leadHours}
            mode={mode}
            onSelectLead={selectLeadHours}
          />
          <div className="lg:hidden">{blockComparison}</div>
        </div>
      </div>
    </div>
  );
}
