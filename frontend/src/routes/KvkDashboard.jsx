import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SeverityBadge from '../components/common/SeverityBadge';
import SimulatedDataBadge from '../components/common/SimulatedDataBadge';
import AdvisoryReviewDrawer from '../components/kvk/AdvisoryReviewDrawer';
import AdvisoryStatusBadge from '../components/kvk/AdvisoryStatusBadge';
import HighRiskTable from '../components/kvk/HighRiskTable';
import PanchayatMap from '../components/panchayat/PanchayatMap';
import { formatPercent } from '../components/panchayat/forecastFormat';
import { ADVISORY_STATUS, DEMO_PENDING_GP, formatWorkflowTime, pluralFarmers } from '../lib/advisories';
import { useAdvisories } from '../lib/advisoryStore';
import {
  BLOCKS,
  DISTRICTS,
  LEAD_TIMES,
  PANCHAYATS,
  RISK_RANK,
  getBlockPanchayats,
  getPanchayat,
  getPeakRisk,
} from '../lib/panchayatData';

// KVK / AMFU Dashboard (/kvk): the operational view for the Krishi Vigyan Kendra
// and Agro-Meteorological Field Unit officials. Which Panchayats need attention,
// which crop advisories are waiting for review, which have been approved or sent.
// Everything is simulated: the forecasts come from lib/panchayatData.js and the
// Review -> Approve -> Send workflow is local state in lib/advisoryStore.js
// (persisted to localStorage, shared with the other advisory pages).

const MICRO = 'text-[11px] font-mono text-slate-500 uppercase tracking-wide';
const CARD = 'bg-white border border-[#D9E4EE] rounded-2xl p-5 sm:p-6 shadow-sm';
const PENDING_PREVIEW = 5;
const RECENT_PREVIEW = 6;
const DEFAULT_MAP_LEAD = 24; // where the scenario peaks, so the map opens on the interesting hour

// Peak (worst over 48 h) risk per Panchayat is a pure function of the dataset,
// so it is computed once. Table order: severity, then how far past its threshold.
const HIGH_RISK = PANCHAYATS.map((gp) => ({ gp, peak: getPeakRisk(gp.id) }))
  .filter(({ peak }) => peak && RISK_RANK[peak.risk] >= RISK_RANK.high)
  .sort(
    (a, b) =>
      RISK_RANK[b.peak.risk] - RISK_RANK[a.peak.risk] ||
      b.peak.forecast.riskScore - a.peak.forecast.riskScore ||
      a.gp.name.localeCompare(b.gp.name)
  );
const HIGH_RISK_IDS = Object.freeze(HIGH_RISK.map(({ gp }) => gp.id));
const SEVERE_COUNT = HIGH_RISK.filter(({ peak }) => peak.risk === 'severe').length;
// Opens on Vijalpor (the issue #3 example): its advisory starts pending, so the Review flow is one click away.
const DEFAULT_GP_ID = DEMO_PENDING_GP;

// Latest workflow timestamp (ms) of an approved / sent advisory: newest first in Recent.
const lastActivity = (a) => Date.parse(a.sentAt ?? a.approvedAt ?? '') || 0;

// Seeded approvals carry fixed timestamps (lib/advisories.js) that can sit ahead of the
// viewer's clock, so ordering by time alone could bury an advisory the user has just
// approved or sent below the "Show all" fold. Anything the user acted on sorts first.
const isUserAction = (a) =>
  (a.approvedAt ?? null) !== (a.initialApprovedAt ?? null) || (a.sentAt ?? null) !== (a.initialSentAt ?? null);

const segmentClass = (active) =>
  `px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
    active
      ? 'bg-white text-blue-600 border border-slate-200/80 shadow-xs'
      : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-200/60'
  }`;

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

function Kpi({ label, value, sub, tone = 'slate' }) {
  const accent = {
    slate: 'text-slate-900',
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-emerald-600',
  }[tone];
  return (
    <div className="bg-white border border-[#D9E4EE] rounded-2xl p-4 sm:p-5 shadow-sm min-w-0">
      <div className={MICRO}>{label}</div>
      <div className={`mt-1.5 text-3xl sm:text-4xl font-extrabold tabular-nums leading-none ${accent}`}>{value}</div>
      <div className="mt-2 text-xs text-slate-500 leading-snug">{sub}</div>
    </div>
  );
}

function SectionHeading({ id, title, count, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <h2 id={id} className="text-lg font-extrabold text-slate-900 tracking-tight">
          {title}
        </h2>
        {count !== undefined && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-600 tabular-nums">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ title, children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center">
      <svg className="mx-auto h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="mt-2 text-sm font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">{children}</p>
    </div>
  );
}

function ShowMore({ total, shown, onToggle, expanded, noun }) {
  if (total <= shown && !expanded) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors ${FOCUS_RING}`}
    >
      {expanded ? 'Show fewer' : `Show all ${total} ${noun}`}
    </button>
  );
}

export default function KvkDashboard() {
  const { advisories, counts, byGpId, reset, send } = useAdvisories();

  const [selectedId, setSelectedId] = useState(DEFAULT_GP_ID);
  const [mapLead, setMapLead] = useState(DEFAULT_MAP_LEAD);
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [reviewId, setReviewId] = useState(null);
  const [pendingExpanded, setPendingExpanded] = useState(false);
  const [recentExpanded, setRecentExpanded] = useState(false);
  const [resetNote, setResetNote] = useState('');
  const [sendNote, setSendNote] = useState(null); // { ok, message } from the last inline Send

  // Confirmations disappear by themselves; the timers are cleared on unmount.
  useEffect(() => {
    if (!resetNote) return undefined;
    const timer = setTimeout(() => setResetNote(''), 4000);
    return () => clearTimeout(timer);
  }, [resetNote]);
  useEffect(() => {
    if (!sendNote) return undefined;
    const timer = setTimeout(() => setSendNote(null), 6000);
    return () => clearTimeout(timer);
  }, [sendNote]);

  const rows = useMemo(
    () => HIGH_RISK.map((row) => ({ ...row, advisory: byGpId[row.gp.id] ?? null })),
    [byGpId]
  );

  const pending = useMemo(() => advisories.filter((a) => a.status === ADVISORY_STATUS.PENDING), [advisories]);
  const recent = useMemo(
    () =>
      advisories
        .filter((a) => a.status !== ADVISORY_STATUS.PENDING)
        .sort(
          (a, b) =>
            Number(isUserAction(b)) - Number(isUserAction(a)) ||
            lastActivity(b) - lastActivity(a) ||
            b.riskScore - a.riskScore
        ),
    [advisories]
  );
  const farmersReached = useMemo(
    () => advisories.reduce((sum, a) => sum + (a.farmersReached ?? 0), 0),
    [advisories]
  );

  const selected = getPanchayat(selectedId);
  const selectedPeak = selected ? getPeakRisk(selected.id) : null;
  const selectedAdvisory = selected ? byGpId[selected.id] ?? null : null;

  const visiblePending = pendingExpanded ? pending : pending.slice(0, PENDING_PREVIEW);
  const visibleRecent = recentExpanded ? recent : recent.slice(0, RECENT_PREVIEW);

  const handleReset = () => {
    setReviewId(null);
    setResetNote(reset().message);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Header */}
      <div className={`${CARD} space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                KVK / AMFU Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">KVK Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SimulatedDataBadge />
            <button
              type="button"
              onClick={handleReset}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors ${FOCUS_RING}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Reset demo
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          The Agro-Meteorological Field Unit at Navsari Agricultural University and KVK Navsari watch the
          Panchayat forecasts for {DISTRICTS.length} South Gujarat districts, review the crop advisories the system
          drafts for high-risk Panchayats, and approve them before they are sent to registered farmers.
        </p>
        <div role="status" aria-live="polite">
          {resetNote && <p className="text-xs font-semibold text-emerald-700">{resetNote}</p>}
        </div>
      </div>

      {/* KPIs */}
      <section aria-label="Key figures" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi
          label="Panchayats Monitored"
          value={PANCHAYATS.length}
          sub={`${DISTRICTS.length} districts · ${BLOCKS.length} blocks`}
        />
        <Kpi
          label="High-Risk Panchayats"
          value={HIGH_RISK.length}
          tone="red"
          sub={`High or severe within 48 h · ${SEVERE_COUNT} severe`}
        />
        <Kpi
          label="Advisories Pending Review"
          value={counts.pending}
          tone={counts.pending > 0 ? 'amber' : 'green'}
          sub={`of ${counts.total} advisories · ${counts.approved} approved, not yet sent`}
        />
        <Kpi
          label="Advisories Sent"
          value={counts.sent}
          tone="green"
          sub={counts.sent > 0 ? `${new Intl.NumberFormat('en-IN').format(farmersReached)} farmers reached` : 'None sent yet'}
        />
      </section>

      {/* Map + selected Panchayat */}
      <section aria-labelledby="risk-map-heading" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className={`${CARD} lg:col-span-2 space-y-4 min-w-0`}>
          <SectionHeading id="risk-map-heading" title="Panchayat Risk Map" />
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="space-y-1.5">
              <span className={`${MICRO} block`} id="map-lead-label">Risk at lead time</span>
              <div
                role="group"
                aria-labelledby="map-lead-label"
                className="flex flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80"
              >
                {LEAD_TIMES.map(({ hours, label }) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setMapLead(hours)}
                    aria-pressed={mapLead === hours}
                    className={segmentClass(mapLead === hours)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHighRiskOnly((v) => !v)}
              aria-pressed={highRiskOnly}
              className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-colors ${
                highRiskOnly
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              } ${FOCUS_RING}`}
            >
              Highlight high-risk only
            </button>
          </div>
          <PanchayatMap
            mode="downscaled"
            variable="risk"
            leadHours={mapLead}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emphasisIds={highRiskOnly ? HIGH_RISK_IDS : undefined}
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            Map colours show risk at the chosen lead time; the table below ranks each Panchayat by its worst risk
            over the 48 h horizon. Click a Panchayat, or pick one from the list on the right.
          </p>
        </div>

        <section aria-label="Selected Panchayat" className={`${CARD} space-y-4 min-w-0`}>
          <div className="space-y-1.5">
            <label htmlFor="kvk-gp-select" className={`${MICRO} block`}>
              Panchayat
            </label>
            <select
              id="kvk-gp-select"
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value || null)}
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

          {selected && selectedPeak ? (
            <>
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight break-words">
                  {selected.name}
                </h3>
                <p className="text-xs text-slate-600">
                  {selected.blockName} block &middot; {selected.districtName} district
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2">
                <div className={MICRO}>Peak risk in 48 h</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <SeverityBadge severity={selectedPeak.risk} size="md" />
                  <span className="text-sm font-bold text-slate-800">{selectedPeak.forecast.condition}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {selectedPeak.risk === 'low' ? 'Stays low' : `Around ${selectedPeak.leadLabel} (${selectedPeak.forecast.validTime})`}
                  {' '}&middot; chance of any rain (&ge;&nbsp;2.5&nbsp;mm) {formatPercent(selectedPeak.forecast.rainProbability)}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="min-w-0">
                  <dt className={MICRO}>Key crop</dt>
                  <dd className="font-semibold text-slate-800">
                    {selected.crops[0] ? `${selected.crops[0].crop} · ${selected.crops[0].stage}` : '--'}
                  </dd>
                </div>
                <div>
                  <dt className={MICRO}>Registered farmers</dt>
                  <dd className="font-semibold text-slate-800 tabular-nums">
                    {new Intl.NumberFormat('en-IN').format(selected.farmers)}
                  </dd>
                </div>
              </dl>
              <div className="space-y-1.5">
                <div className={MICRO}>Advisory</div>
                <AdvisoryStatusBadge status={selectedAdvisory?.status ?? null} />
                {selectedAdvisory && (
                  <p className="text-xs text-slate-600 leading-snug">{selectedAdvisory.action}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedAdvisory && (
                  <button
                    type="button"
                    onClick={() => setReviewId(selectedAdvisory.id)}
                    className={`rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors ${FOCUS_RING}`}
                  >
                    {selectedAdvisory.status === ADVISORY_STATUS.PENDING ? 'Review advisory' : 'View advisory'}
                  </button>
                )}
                <Link
                  to={`/panchayats?gp=${encodeURIComponent(selected.id)}${
                    selectedPeak.risk === 'low' ? '' : `&t=${selectedPeak.leadHours}`
                  }`}
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors ${FOCUS_RING}`}
                >
                  Open in Panchayat Explorer <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a Panchayat on the map or from the list.</p>
          )}
        </section>
      </section>

      {/* High-risk table */}
      <section aria-labelledby="high-risk-heading" className={`${CARD} space-y-4`}>
        <SectionHeading id="high-risk-heading" title="High-Risk Panchayats" count={HIGH_RISK.length}>
          <span className="text-xs text-slate-500">Worst risk over the next 48 h, most severe first</span>
        </SectionHeading>
        <HighRiskTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        <p className="text-xs text-slate-500 leading-relaxed">
          To keep the demo manageable, advisories are drafted for the {counts.total} most urgent Panchayats: every
          severe one, then the highest-ranked high-risk ones with at most 3 per block.
        </p>
      </section>

      {/* Pending + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <section aria-labelledby="pending-heading" className={`${CARD} lg:col-span-3 space-y-4 min-w-0`}>
          <SectionHeading id="pending-heading" title="Pending Advisory Review" count={pending.length} />
          {pending.length === 0 ? (
            <EmptyState title="All advisories reviewed">
              Nothing is waiting for KVK approval. Approved advisories are listed under Recent Approved Advisories.
            </EmptyState>
          ) : (
            <>
              <ul className="space-y-2.5">
                {visiblePending.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-slate-200/80 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <SeverityBadge severity={a.risk} />
                        <span className="text-sm font-extrabold text-slate-900">{a.gpName}</span>
                        <span className="text-xs text-slate-500">
                          {a.blockName} &middot; {a.districtName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{a.condition}</span> {a.leadLabel} &middot;{' '}
                        {a.probabilityLabel}
                      </p>
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">
                          {a.crop} &middot; {a.stage}
                        </span>
                        : {a.action}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewId(a.id)}
                      aria-label={`Review advisory for ${a.gpName}`}
                      className={`shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors ${FOCUS_RING}`}
                    >
                      Review
                    </button>
                  </li>
                ))}
              </ul>
              <ShowMore
                total={pending.length}
                shown={PENDING_PREVIEW}
                expanded={pendingExpanded}
                onToggle={() => setPendingExpanded((v) => !v)}
                noun="pending advisories"
              />
            </>
          )}
        </section>

        <section aria-labelledby="recent-heading" className={`${CARD} lg:col-span-2 space-y-4 min-w-0`}>
          <SectionHeading id="recent-heading" title="Recent Approved Advisories" count={recent.length} />
          {recent.length === 0 ? (
            <EmptyState title="Nothing approved yet">
              Approve an advisory from the pending list and it will appear here, ready to send.
            </EmptyState>
          ) : (
            <>
              <div role="status" aria-live="polite">
                {sendNote && (
                  <p
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                      sendNote.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {sendNote.message}
                  </p>
                )}
              </div>
              <ul className="space-y-2.5">
                {visibleRecent.map((a) => (
                  <li key={a.id} className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{a.gpName}</span>
                      <AdvisoryStatusBadge status={a.status} />
                    </div>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {a.crop} &middot; {a.stage}
                      </span>
                      : {a.action}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 leading-snug">
                      Approved {formatWorkflowTime(a.approvedAt)}
                      {a.status === ADVISORY_STATUS.SENT &&
                        ` · Sent ${formatWorkflowTime(a.sentAt)} via ${a.channel} to ${pluralFarmers(a.farmersReached)}`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {a.status === ADVISORY_STATUS.APPROVED && (
                        <button
                          type="button"
                          onClick={() => setSendNote(send(a.id))}
                          aria-label={`Send advisory for ${a.gpName} to ${pluralFarmers(a.farmers)}`}
                          className={`rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors ${FOCUS_RING}`}
                        >
                          Send
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setReviewId(a.id)}
                        aria-label={`View advisory for ${a.gpName}`}
                        className={`rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors ${FOCUS_RING}`}
                      >
                        View
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <ShowMore
                total={recent.length}
                shown={RECENT_PREVIEW}
                expanded={recentExpanded}
                onToggle={() => setRecentExpanded((v) => !v)}
                noun="advisories"
              />
            </>
          )}
        </section>
      </div>

      <AdvisoryReviewDrawer advisoryId={reviewId} onClose={() => setReviewId(null)} />
    </div>
  );
}
