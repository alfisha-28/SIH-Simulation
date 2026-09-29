import {
  RISK_RANK,
  THRESHOLDS,
  getBlock,
  getForecast,
  getPanchayat,
  getPeakRisk,
} from '../../lib/panchayatData';
import SeverityBadge from '../common/SeverityBadge';
import ConfidenceBadge from '../common/ConfidenceBadge';
import {
  capitalize,
  formatDeltaOf,
  formatPercent,
  formatRainMm,
  formatRange,
  formatTempC,
  formatWindKmh,
} from './forecastFormat';

// "Selected Panchayat" side panel: identity, risk, every headline variable with
// its uncertainty range, and a coarse-vs-downscaled comparison that says what
// the downscaling changed for this Panchayat.
//
// Props
//   panchayatId    GP id (see lib/panchayatData.js); renders a neutral empty state if unknown
//   leadHours      0 | 6 | 12 | 24 | 48
//   mode           'downscaled' | 'coarse': which forecast the headline values show
//   onSelectLead   optional (hours) => void; enables the "jump to peak" button
//   className      extra classes for the card
//
// It reads the forecasts itself, so a caller only passes ids and a lead time.

const MICRO = 'text-[11px] font-mono text-slate-500 uppercase tracking-wide';
const PCT_NOTE = '10th–90th pct.';

// "87% chance of >= 64.5 mm in 24 h": what the risk-driving threshold was.
function hazardLikelihood(f) {
  if (!f || f.hazardProbability === null || !f.riskDriver) return null;
  const i = RISK_RANK[f.risk] - 1;
  const pct = `${Math.round(f.hazardProbability * 100)}%`;
  if (f.riskDriver === 'rain') return `${pct} chance of ≥ ${THRESHOLDS.rainfallMm[i]} mm in 24 h`;
  if (f.riskDriver === 'wind') return `${pct} chance of winds ≥ ${THRESHOLDS.windKmh[i]} km/h`;
  return `${pct} chance of ≥ ${THRESHOLDS.temperatureC[i]} °C`;
}

function Metric({ label, note, value, unit, range }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 min-w-0">
      <div className={MICRO}>{label}</div>
      <div className="mt-1 flex items-baseline gap-1 flex-wrap">
        <span className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none">{value}</span>
        <span className="text-xs font-mono text-slate-500">{unit}</span>
      </div>
      <div className="mt-1.5 text-[11px] font-mono text-slate-500 leading-snug">
        {range && <span className="text-slate-700 font-semibold">{range}</span>}
        {note && <span className="block">{note}</span>}
      </div>
    </div>
  );
}

function CompareRow({ label, block, gp, delta, activeColumn }) {
  const cell = (col) => (activeColumn === col ? 'bg-blue-50 font-bold text-slate-900' : 'text-slate-700');
  return (
    <tr className="border-t border-slate-100">
      <th scope="row" className="py-1.5 pr-2 text-left font-medium text-slate-500">
        {label}
      </th>
      <td className={`py-1.5 px-2 text-right tabular-nums ${cell('coarse')}`}>{block}</td>
      <td className={`py-1.5 px-2 text-right tabular-nums ${cell('downscaled')}`}>{gp}</td>
      <td className="py-1.5 pl-2 text-right tabular-nums text-slate-500">{delta}</td>
    </tr>
  );
}

export default function PanchayatPanel({ panchayatId, leadHours, mode, onSelectLead, className = '' }) {
  const gp = getPanchayat(panchayatId);
  if (!gp) {
    return (
      <section
        aria-label="Selected Panchayat"
        className={`bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm text-center text-sm text-slate-500 ${className}`}
      >
        Select a Panchayat on the map or from the list to see its forecast.
      </section>
    );
  }

  const block = getBlock(gp.blockId);
  const isCoarse = mode === 'coarse';
  const downscaled = getForecast(gp.id, leadHours, 'downscaled');
  const coarse = getForecast(gp.id, leadHours, 'coarse');
  const active = isCoarse ? coarse : downscaled;
  const peak = getPeakRisk(gp.id, mode);

  if (!active || !downscaled || !coarse) {
    return (
      <section
        aria-label="Selected Panchayat"
        className={`bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm text-center text-sm text-slate-500 ${className}`}
      >
        Forecast unavailable for {gp.name} at this lead time.
      </section>
    );
  }

  const likelihood = hazardLikelihood(active);
  const riskShift = RISK_RANK[downscaled.risk] - RISK_RANK[coarse.risk];
  const riskDelta = riskShift === 0 ? 'same' : `${riskShift > 0 ? '▲' : '▼'} ${Math.abs(riskShift)}`;
  const [spreadLo, spreadHi] = coarse.spread.rainfallMm;

  return (
    <section
      aria-label="Selected Panchayat"
      className={`bg-white border border-[#D9E4EE] rounded-2xl p-5 shadow-sm space-y-5 ${className}`}
    >
      {/* Identity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`${MICRO} inline-flex items-center gap-1.5`}>
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Selected Panchayat
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {active.leadLabel} &middot; {active.validTime}
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight break-words">{gp.name}</h2>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className={MICRO}>Block</dt>
            <dd className="text-sm font-semibold text-slate-800">{gp.blockName}</dd>
          </div>
          <div>
            <dt className={MICRO}>District</dt>
            <dd className="text-sm font-semibold text-slate-800">{gp.districtName}</dd>
          </div>
        </dl>
      </div>

      {/* Risk */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-1.5">
        <div className={MICRO}>Risk level</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <SeverityBadge severity={active.risk} size="md" />
          <span className="text-sm font-bold text-slate-800">{active.condition}</span>
        </div>
        {likelihood && <p className="text-xs text-slate-600">{likelihood}</p>}
      </div>

      {/* Mode explanation: this is the visible core of the demo */}
      <div
        className={`rounded-xl border p-3 text-xs leading-relaxed ${
          isCoarse ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}
      >
        {isCoarse ? (
          <>
            <p>
              <span className="font-bold">Coarse block forecast.</span> These are the {block.name} block values,
              shared by all {coarse.gpCount} Gram Panchayats in it, including {gp.name}. Local differences are
              averaged out.
            </p>
            <p className="mt-1.5">
              Downscaled rainfall across the block ranges from {formatRainMm(spreadLo)} to {formatRainMm(spreadHi)} mm;
              {' '}{gp.name} is {formatRainMm(downscaled.rainfallMm)} mm.
            </p>
          </>
        ) : (
          <p>
            <span className="font-bold">Downscaled Panchayat forecast.</span> The coarse {block.name} block forecast,
            downscaled to a 2&ndash;3 km grid and aggregated to {gp.name}&apos;s boundary, with its own uncertainty
            range.
          </p>
        )}
      </div>

      {/* Headline variables */}
      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="Rainfall"
          value={formatRainMm(active.rainfallMm)}
          unit="mm / 24 h"
          range={`${formatRange(active.rainfallRange, formatRainMm)} mm`}
          note={PCT_NOTE}
        />
        <Metric
          label="Temperature"
          value={formatTempC(active.temperatureC)}
          unit={'°C'}
          range={`${formatRange(active.temperatureRange, formatTempC)} °C`}
          note={PCT_NOTE}
        />
        <Metric
          label="Wind speed"
          value={formatWindKmh(active.windKmh)}
          unit="km/h"
          range={`${formatRange(active.windRange, formatWindKmh)} km/h`}
          note={PCT_NOTE}
        />
        <Metric
          label="Rain probability"
          value={formatPercent(active.rainProbability)}
          unit=""
          range={'chance of ≥ 2.5 mm'}
        />
      </div>

      {/* Confidence */}
      <div className="space-y-2">
        <div className={MICRO}>Confidence / uncertainty</div>
        <div className="flex items-center gap-3">
          <ConfidenceBadge confidence={active.confidenceLevel} className="shrink-0" />
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-100 border border-slate-200/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.round(active.confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
              {formatPercent(active.confidence)}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Ranges show the 10th&ndash;90th percentile and widen with lead time
          {isCoarse ? '; the block range also covers the spread between its Panchayats.' : '.'}
        </p>
      </div>

      {/* Coarse vs downscaled */}
      <div className="space-y-2">
        <div className={MICRO}>What downscaling adds</div>
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-slate-500">
              <th scope="col" className="pb-1.5 pr-2 text-left font-medium">
                <span className="sr-only">Variable</span>
              </th>
              <th scope="col" className="pb-1.5 px-2 text-right font-medium">Block</th>
              <th scope="col" className="pb-1.5 px-2 text-right font-medium truncate max-w-[6rem]">{gp.name}</th>
              <th scope="col" className="pb-1.5 pl-2 text-right font-medium">Diff</th>
            </tr>
          </thead>
          <tbody>
            <CompareRow
              label="Rain mm"
              block={formatRainMm(coarse.rainfallMm)}
              gp={formatRainMm(downscaled.rainfallMm)}
              delta={formatDeltaOf(downscaled.rainfallMm, coarse.rainfallMm, formatRainMm)}
              activeColumn={mode}
            />
            <CompareRow
              label={'Temp °C'}
              block={formatTempC(coarse.temperatureC)}
              gp={formatTempC(downscaled.temperatureC)}
              delta={formatDeltaOf(downscaled.temperatureC, coarse.temperatureC, formatTempC)}
              activeColumn={mode}
            />
            <CompareRow
              label="Wind km/h"
              block={formatWindKmh(coarse.windKmh)}
              gp={formatWindKmh(downscaled.windKmh)}
              delta={formatDeltaOf(downscaled.windKmh, coarse.windKmh, formatWindKmh)}
              activeColumn={mode}
            />
            <CompareRow
              label="Risk"
              block={capitalize(coarse.risk)}
              gp={capitalize(downscaled.risk)}
              delta={riskDelta}
              activeColumn={mode}
            />
          </tbody>
        </table>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {riskShift > 0
            ? `Downscaling reveals a higher risk at ${gp.name} than the block forecast suggests.`
            : riskShift < 0
              ? `Downscaling shows ${gp.name} is calmer than the block-wide forecast suggests.`
              : `At this lead time the block value and the Panchayat value fall in the same risk level.`}
        </p>
      </div>

      {/* Peak */}
      {peak && (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <div className={MICRO}>Peak risk, next 48 h</div>
            {peak.risk === 'low' ? (
              <div className="text-xs font-semibold text-slate-700">No elevated risk expected</div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={peak.risk} />
                <span className="text-xs font-mono text-slate-600">
                  at {peak.leadLabel} &middot; {peak.forecast.condition}
                </span>
              </div>
            )}
          </div>
          {onSelectLead && peak.risk !== 'low' && peak.leadHours !== leadHours && (
            <button
              type="button"
              onClick={() => onSelectLead(peak.leadHours)}
              className="min-h-9 px-3 rounded-lg border border-blue-200 bg-white text-xs font-semibold text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Show {peak.leadLabel}
            </button>
          )}
        </div>
      )}

      {/* Crops */}
      <div className="space-y-2">
        <div className={MICRO}>Main crops</div>
        <ul className="flex flex-wrap gap-1.5">
          {gp.crops.map((c) => (
            <li
              key={`${c.crop}-${c.stage}`}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900"
            >
              <span className="font-semibold">{c.crop}</span>
              <span className="text-emerald-700"> &middot; {c.stage}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">
          {gp.farmers.toLocaleString('en-IN')} registered farmers &middot; {gp.areaKm2} km&sup2;
        </p>
      </div>
    </section>
  );
}
