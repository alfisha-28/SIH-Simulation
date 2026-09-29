import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SeverityBadge from '../components/common/SeverityBadge';
import SimulatedDataBadge from '../components/common/SimulatedDataBadge';
import AdvisoryStatusBadge from '../components/kvk/AdvisoryStatusBadge';
import AdvisoryReviewDrawer from '../components/kvk/AdvisoryReviewDrawer';
import { ADVISORY_STATUS, formatWorkflowTime, pluralFarmers } from '../lib/advisories';
import { useAdvisories } from '../lib/advisoryStore';

// Advisories page (was the event "Alerts" page). Answers the agricultural question
// "what does the forecast mean for this Panchayat and its crops?": every card is
// a crop-aware advisory drafted from the Panchayat forecast (lib/advisories.js).
//
// The View -> Approve -> Send Advisory controls run against the shared workflow
// store (lib/advisoryStore.js), the same one the KVK Dashboard uses, so a change
// made here shows up there (and in the nav badge) and survives a reload. View
// opens the same review drawer as the dashboard; Approve unlocks once the
// advisory has been viewed; Send unlocks once it is approved.
//
// The page renders from local mock data, so there is no loading or error state:
// it never waits for the backend.

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
const MICRO = 'text-[11px] font-mono text-slate-500 uppercase tracking-wide';

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: ADVISORY_STATUS.PENDING, label: 'Pending Review' },
  { key: ADVISORY_STATUS.APPROVED, label: 'Approved' },
  { key: ADVISORY_STATUS.SENT, label: 'Sent' },
];

// Worst first, so the risk filter reads in the same order as the cards.
const RISK_ORDER = ['severe', 'high', 'moderate', 'low'];

// Probability bar colour per risk level (matches the SeverityBadge hues).
const RISK_BAR = {
  severe: 'bg-red-600',
  high: 'bg-red-500',
  moderate: 'bg-amber-500',
  low: 'bg-emerald-500',
};
const RISK_PROB_BADGE = {
  severe: 'bg-red-50 text-red-700',
  high: 'bg-red-50 text-red-700',
  moderate: 'bg-amber-50 text-amber-700',
  low: 'bg-emerald-50 text-emerald-700',
};

const IconShell = ({ children }) => (
  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {children}
    </svg>
  </div>
);

// Icon per risk driver (rain | wind | heat), same glyphs as the old hazard cards.
const DriverIcon = ({ driver }) => {
  if (driver === 'rain') {
    return (
      <IconShell>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </IconShell>
    );
  }
  if (driver === 'heat') {
    return (
      <IconShell>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25M4.284 12h-2.25m15.364 6.364l-1.591-1.591M6.759 6.759L5.168 5.168m12.728 0l-1.591 1.591M6.759 17.241l-1.591 1.591M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
      </IconShell>
    );
  }
  if (driver === 'wind') {
    return (
      <IconShell>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a1.5 1.5 0 00-1.5-1.5H3m14.25-4.5h-15.75m18-4.5h-16.5m18.75 0a2.25 2.25 0 100-4.5h-1.5" />
      </IconShell>
    );
  }
  return (
    <IconShell>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </IconShell>
  );
};

const SmallIcon = ({ children }) => (
  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    {children}
  </svg>
);

// View -> Approve -> Send progress, so it is obvious which control is live and why.
function WorkflowSteps({ viewed, status }) {
  const approved = status !== ADVISORY_STATUS.PENDING;
  const sent = status === ADVISORY_STATUS.SENT;
  const steps = [
    { label: 'View', done: viewed },
    { label: 'Approve', done: approved },
    { label: 'Send', done: sent },
  ];
  const nextIndex = steps.findIndex((s) => !s.done);
  return (
    <ol className="flex items-center gap-1.5 text-[11px] font-mono font-bold" aria-label="Workflow progress">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-1.5">
          {i > 0 && <span className="h-px w-3 bg-slate-300" aria-hidden="true"></span>}
          <span
            className={`inline-flex items-center gap-1 ${
              step.done ? 'text-emerald-700' : i === nextIndex ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] ${
                step.done
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : i === nextIndex
                    ? 'border-blue-600 text-blue-600'
                    : 'border-slate-300'
              }`}
              aria-hidden="true"
            >
              {step.done ? '✓' : i + 1}
            </span>
            {step.label}
            <span className="sr-only">{step.done ? ' (done)' : i === nextIndex ? ' (next)' : ' (later)'}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function AdvisoryCard({ advisory, onView, onApprove, onSend }) {
  const { status, risk } = advisory;
  const probPct = Math.round((advisory.probability || 0) * 100);
  const viewed = Boolean(advisory.reviewedAt) || status !== ADVISORY_STATUS.PENDING;
  const primaryRef = useRef(null);
  const actedRef = useRef(false);

  // Approve turns into Send on the same card, so hand focus to the new button
  // instead of letting it fall back to <body> (keyboard and screen reader users).
  useEffect(() => {
    if (actedRef.current) {
      actedRef.current = false;
      primaryRef.current?.focus();
    }
  }, [status]);

  const act = (handler) => () => {
    actedRef.current = true;
    handler(advisory.id);
  };

  const primaryBase = `w-full py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${FOCUS_RING}`;
  const darkBtn = `${primaryBase} bg-slate-900 hover:bg-slate-700 text-white`;

  return (
    <article
      aria-label={`${advisory.condition} advisory for ${advisory.gpName}`}
      className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-5 group"
    >
      <div className="space-y-4">
        {/* Card Header: risk level & advisory ID */}
        <div className="flex items-center justify-between gap-2">
          <SeverityBadge severity={risk} suffix="risk" />
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs truncate">
            {advisory.id}
          </span>
        </div>

        {/* Title, icon & Panchayat */}
        <div className="flex items-start gap-3">
          <DriverIcon driver={advisory.driver} />
          <div className="space-y-1 flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug uppercase break-words">
              {advisory.condition}
            </h2>
            <div className="inline-flex max-w-full items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
              <SmallIcon>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </SmallIcon>
              <span className="sr-only">Panchayat: </span>
              <span className="truncate font-semibold">{advisory.gpName}</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500">
              {advisory.blockName} block &middot; {advisory.districtName}
            </p>
          </div>
        </div>

        {/* Crop and the action it calls for: the point of the page */}
        <dl className="space-y-3">
          <div className="space-y-0.5">
            <dt className={MICRO}>Crop / stage</dt>
            <dd className="text-sm font-bold text-slate-900">
              {advisory.crop} &mdash; {advisory.stage} stage
            </dd>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 space-y-0.5">
            <dt className={`${MICRO} text-blue-700`}>Recommended action</dt>
            <dd className="text-sm font-semibold text-slate-900 leading-snug">{advisory.action}</dd>
          </div>
        </dl>
      </div>

      {/* Details Section: probability & window */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Forecast probability</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${RISK_PROB_BADGE[risk] ?? 'bg-slate-100 text-slate-700'}`}>
              {probPct}%
            </span>
          </div>
          <div
            className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50"
            role="img"
            aria-label={`${probPct}% probability: ${advisory.probabilityLabel}`}
          >
            <div
              className={`h-full rounded-full ${RISK_BAR[risk] ?? 'bg-slate-500'} transition-all duration-500`}
              style={{ width: `${probPct}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">{advisory.probabilityLabel}</p>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
              <SmallIcon>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </SmallIcon>
              Valid window
            </span>
            <span className="font-semibold font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs text-right">
              {advisory.leadLabel} &middot; {advisory.validTime}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/50">
            <span className="flex items-center gap-1.5">
              <SmallIcon>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </SmallIcon>
              Registered farmers
            </span>
            <span className="font-mono text-slate-700 tabular-nums">{advisory.farmers.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Advisory status + workflow progress */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2">
            <span className={MICRO}>Status</span>
            <AdvisoryStatusBadge status={status} />
          </div>
          <WorkflowSteps viewed={viewed} status={status} />
        </div>
      </div>

      {/* Card actions: View -> Approve -> Send Advisory */}
      <div className="space-y-2.5 pt-1">
        {status === ADVISORY_STATUS.SENT && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 leading-snug">
            Sent via {advisory.channel} to {pluralFarmers(advisory.farmersReached)} &middot; {formatWorkflowTime(advisory.sentAt)}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onView(advisory.id)}
            aria-label={`View advisory for ${advisory.gpName}`}
            className={`py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold tracking-wide text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 ${FOCUS_RING}`}
          >
            <SmallIcon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </SmallIcon>
            View
          </button>

          {status === ADVISORY_STATUS.PENDING && (
            <button
              key="approve"
              ref={primaryRef}
              type="button"
              disabled={!viewed}
              aria-describedby={viewed ? undefined : `${advisory.id}-hint`}
              aria-label={`Approve advisory for ${advisory.gpName}`}
              onClick={act(onApprove)}
              className={`${primaryBase} ${
                viewed ? 'bg-slate-900 hover:bg-slate-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              Approve
            </button>
          )}
          {status === ADVISORY_STATUS.APPROVED && (
            <button
              key="send"
              ref={primaryRef}
              type="button"
              onClick={act(onSend)}
              aria-label={`Send advisory for ${advisory.gpName} to ${pluralFarmers(advisory.farmers)}`}
              className={darkBtn}
            >
              <span>Send Advisory</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          )}
          {status === ADVISORY_STATUS.SENT && (
            <span className="py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1.5">
              <span aria-hidden="true">✓</span> Sent
            </span>
          )}
        </div>

        {status === ADVISORY_STATUS.PENDING && !viewed && (
          <p id={`${advisory.id}-hint`} className="text-[11px] text-slate-500 leading-snug">
            View the advisory first to unlock Approve.
          </p>
        )}
        {status === ADVISORY_STATUS.APPROVED && (
          <p className="text-[11px] text-slate-500 leading-snug">Approved {formatWorkflowTime(advisory.approvedAt)}. Ready to send.</p>
        )}

        <Link
          to={`/panchayats?gp=${encodeURIComponent(advisory.gpId)}&t=${advisory.leadHours}`}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline rounded-sm ${FOCUS_RING}`}
        >
          View Panchayat forecast <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}

const segmentClass = (active, disabled) =>
  `px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${FOCUS_RING} ${
    active
      ? 'bg-white text-blue-600 border border-slate-200/80 shadow-xs'
      : disabled
        ? 'text-slate-400 cursor-not-allowed'
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
  }`;

export default function Advisories() {
  const { advisories, counts, approve, send, reset } = useAdvisories();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewId, setViewId] = useState(null);
  const [note, setNote] = useState('');
  const noteRef = useRef(null);

  // Announce the result of Approve / Send / Reset, and keep focus on the page when
  // the acted-on card left the filtered list (an approved card leaves "Pending").
  useEffect(() => {
    if (!note) return undefined;
    if (!document.activeElement || document.activeElement === document.body) {
      noteRef.current?.focus({ preventScroll: true });
    }
    const timer = setTimeout(() => setNote(''), 6000);
    return () => clearTimeout(timer);
  }, [note]);

  const query = searchQuery.trim().toLowerCase();
  const matchesSearch = (a) =>
    !query ||
    [a.gpName, a.blockName, a.districtName, a.crop, a.stage, a.condition, a.id]
      .join(' ')
      .toLowerCase()
      .includes(query);

  // Each filter's counts respect the other filter and the search, so a tab's
  // number is what you would see after clicking it.
  const searched = advisories.filter(matchesSearch);
  const byRisk = (list) => (filterRisk === 'ALL' ? list : list.filter((a) => a.risk === filterRisk));
  const byStatus = (list) => (filterStatus === 'ALL' ? list : list.filter((a) => a.status === filterStatus));
  const visible = byStatus(byRisk(searched));

  const statusCounts = { ALL: byRisk(searched).length };
  for (const a of byRisk(searched)) statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  const riskCounts = { ALL: byStatus(searched).length };
  for (const a of byStatus(searched)) riskCounts[a.risk] = (riskCounts[a.risk] ?? 0) + 1;

  const riskTabs = [
    { key: 'ALL', label: 'All risks' },
    ...RISK_ORDER.filter((r) => advisories.some((a) => a.risk === r)).map((r) => ({
      key: r,
      label: r.charAt(0).toUpperCase() + r.slice(1),
    })),
  ];

  const filtersActive = filterStatus !== 'ALL' || filterRisk !== 'ALL' || query !== '';
  const clearFilters = () => {
    setFilterStatus('ALL');
    setFilterRisk('ALL');
    setSearchQuery('');
  };

  const handleApprove = (id) => setNote(approve(id).message);
  const handleSend = (id) => setNote(send(id).message);
  const handleReset = () => {
    setNote(reset().message);
    clearFilters();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                KVK Advisory Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Panchayat Forecast &amp; Crop Advisories
            </h1>
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
          What does the forecast mean for this Panchayat and its crops? Each advisory turns a Gram Panchayat
          forecast into an action for the crop and stage growing there. KVK / AMFU officials view and approve
          it before it is sent to registered farmers.{' '}
          <span className="font-semibold text-slate-700">
            {counts.pending} of {counts.total} waiting for KVK review.
          </span>
        </p>

        <div role="status" aria-live="polite">
          <p
            ref={noteRef}
            tabIndex={-1}
            className={`outline-none text-xs font-semibold text-emerald-700 ${note ? '' : 'sr-only'}`}
          >
            {note}
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
            {/* Status tabs, each carrying its own live count */}
            <div className="flex items-center flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto" role="group" aria-label="Filter by advisory status">
              {STATUS_TABS.map(({ key, label }) => {
                const count = statusCounts[key] ?? 0;
                const active = filterStatus === key;
                const isZero = count === 0 && key !== 'ALL';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterStatus(key)}
                    aria-pressed={active}
                    disabled={isZero && !active}
                    className={segmentClass(active, isZero)}
                  >
                    {label} {count}
                  </button>
                );
              })}
            </div>

            {/* Optional risk filter */}
            <div className="flex items-center flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto" role="group" aria-label="Filter by risk level">
              {riskTabs.map(({ key, label }) => {
                const count = riskCounts[key] ?? 0;
                const active = filterRisk === key;
                const isZero = count === 0 && key !== 'ALL';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterRisk(key)}
                    aria-pressed={active}
                    disabled={isZero && !active}
                    className={segmentClass(active, isZero)}
                  >
                    {label} {count}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full lg:w-72 shrink-0">
            <label htmlFor="advisory-search" className="sr-only">
              Search advisories by Panchayat, block, district, crop or condition
            </label>
            <input
              id="advisory-search"
              type="search"
              placeholder="Search Panchayat, crop or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {filtersActive && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>
              Showing {visible.length} of {counts.total} advisories
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className={`font-semibold text-blue-600 hover:underline rounded-sm ${FOCUS_RING}`}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {visible.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
          <p className="text-sm font-bold text-slate-800">
            {filtersActive ? 'No advisories match your filters.' : 'No advisories to show.'}
          </p>
          <p className="text-xs text-slate-500">
            {filterStatus === ADVISORY_STATUS.PENDING && filterRisk === 'ALL' && !query
              ? 'Nothing is waiting for KVK review. Approved advisories are under the Approved tab.'
              : 'Try adjusting the status or risk filter, or the search text.'}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className={`mt-2 inline-flex px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 ${FOCUS_RING}`}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Advisories Grid */}
      {visible.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((advisory) => (
            <AdvisoryCard
              key={advisory.id}
              advisory={advisory}
              onView={setViewId}
              onApprove={handleApprove}
              onSend={handleSend}
            />
          ))}
        </div>
      )}

      <AdvisoryReviewDrawer advisoryId={viewId} onClose={() => setViewId(null)} />
    </div>
  );
}
