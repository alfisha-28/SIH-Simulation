import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import SeverityBadge from '../common/SeverityBadge';
import AdvisoryStatusBadge from './AdvisoryStatusBadge';
import { ADVISORY_STATUS, formatWorkflowTime, pluralFarmers } from '../../lib/advisories';
import { useAdvisories } from '../../lib/advisoryStore';
import { getForecast } from '../../lib/panchayatData';
import {
  formatPercent,
  formatRainMm,
  formatRange,
  formatTempC,
  formatWindKmh,
} from '../panchayat/forecastFormat';

// Review panel for one advisory (right-hand drawer on desktop, bottom sheet on a
// phone). It is the whole Review -> Approve -> Send flow in one place: it reads
// the live advisory from the shared store, so the primary button follows the
// status (Approve while pending, Send once approved, a summary once sent).
//
// Props
//   advisoryId  id from lib/advisories.js, or null for closed
//   onClose     () => void
//
// Accessibility: role="dialog" aria-modal, focus moves into the dialog on open and
// is trapped there, Escape and the backdrop close it, and focus returns to the
// button that opened it (or <main> if that button has since left the page, which
// happens when an approved advisory moves to another list). Opening it also
// records the advisory as "reviewed" in the store.

const MICRO = 'text-[11px] font-mono text-slate-500 uppercase tracking-wide';
const FOCUSABLE =
  'a[href], button:not([disabled]), select, textarea, input, [tabindex]:not([tabindex="-1"])';

const STEPS = [
  { key: 'review', label: 'Review' },
  { key: 'approve', label: 'Approve' },
  { key: 'send', label: 'Send' },
];

// Which step is the current one for a status: pending -> Approve is next.
const stepState = (status, index) => {
  const done = status === ADVISORY_STATUS.SENT ? 3 : status === ADVISORY_STATUS.APPROVED ? 2 : 1;
  if (index < done) return 'done';
  return index === done ? 'current' : 'todo';
};

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className={MICRO}>{title}</h3>
      {children}
    </section>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 min-w-0">
      <div className={MICRO}>{label}</div>
      <div className="mt-0.5 text-lg font-extrabold text-slate-900 tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-[11px] font-mono text-slate-500 leading-snug">{sub}</div>}
    </div>
  );
}

function Drawer({ advisoryId, onClose }) {
  const { byId, review, approve, send } = useAdvisories();
  const advisory = byId[advisoryId] ?? null;
  const [feedback, setFeedback] = useState(null); // { ok, message } from the last action
  const dialogRef = useRef(null);
  const feedbackRef = useRef(null);
  const openerRef = useRef(null);

  // Remember what had focus so it can be restored, lock page scroll, and record
  // the review. Runs once per open (the drawer is mounted only while open).
  useEffect(() => {
    openerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    review(advisoryId);
    return () => {
      document.body.style.overflow = previousOverflow;
      const opener = openerRef.current;
      const target = opener && opener.isConnected ? opener : document.getElementById('main');
      target?.focus?.();
    };
  }, [advisoryId, review]);

  // After an action the button that was pressed is replaced, so move focus to
  // the confirmation, which screen readers also announce (role="status").
  useEffect(() => {
    if (feedback) feedbackRef.current?.focus({ preventScroll: true });
  }, [feedback]);

  // Escape is caught on the document so it works even if a click on plain text
  // left focus on <body>.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    []
  );

  if (!advisory) return null;

  const forecast = getForecast(advisory.gpId, advisory.leadHours, 'downscaled');
  const run = (action) => setFeedback(action(advisory.id));

  return (
    <div className="fixed inset-0 z-[2000]" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advisory-drawer-title"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 top-10 sm:top-0 sm:left-auto sm:right-0 sm:w-[30rem] bg-white shadow-2xl flex flex-col rounded-t-2xl sm:rounded-none outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
          <div className="min-w-0 space-y-1.5">
            <span className={MICRO}>Advisory review &middot; {advisory.id}</span>
            <h2 id="advisory-drawer-title" className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight break-words">
              {advisory.gpName}
            </h2>
            <p className="text-xs text-slate-600">
              {advisory.blockName} block &middot; {advisory.districtName} district
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <SeverityBadge severity={advisory.risk} />
              <AdvisoryStatusBadge status={advisory.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close advisory review"
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Workflow steps */}
        <ol className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60 text-xs font-mono font-bold" aria-label="Workflow progress">
          {STEPS.map((step, i) => {
            const state = stepState(advisory.status, i);
            return (
              <li key={step.key} className="flex items-center gap-2" aria-current={state === 'current' ? 'step' : undefined}>
                {i > 0 && <span className="h-px w-5 bg-slate-300" aria-hidden="true"></span>}
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    state === 'done' ? 'text-emerald-700' : state === 'current' ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                      state === 'done'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : state === 'current'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-slate-300'
                    }`}
                    aria-hidden="true"
                  >
                    {state === 'done' ? '✓' : i + 1}
                  </span>
                  {step.label}
                  <span className="sr-only">{state === 'done' ? ' (done)' : state === 'current' ? ' (next)' : ' (later)'}</span>
                </span>
              </li>
            );
          })}
        </ol>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <Section title="Forecast summary">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-base font-extrabold text-slate-900">{advisory.condition}</span>
              <span className="text-xs font-mono text-slate-500">
                {advisory.leadLabel} &middot; {advisory.validTime}
              </span>
            </div>
            <p className="text-sm text-slate-700">{advisory.probabilityLabel}</p>
            {forecast && (
              <div className="grid grid-cols-3 gap-2">
                <Stat
                  label="Rain 24 h"
                  value={`${formatRainMm(forecast.rainfallMm)} mm`}
                  sub={`${formatRange(forecast.rainfallRange, formatRainMm)} mm`}
                />
                <Stat
                  label="Wind"
                  value={`${formatWindKmh(forecast.windKmh)} km/h`}
                  sub={`${formatRange(forecast.windRange, formatWindKmh)} km/h`}
                />
                <Stat
                  label="Temp."
                  value={`${formatTempC(forecast.temperatureC)} °C`}
                  sub={`${formatRange(forecast.temperatureRange, formatTempC)} °C`}
                />
              </div>
            )}
            <p className="text-[11px] text-slate-500 leading-snug">
              Downscaled Panchayat forecast with 10th&ndash;90th percentile ranges. Chance of any rain (&ge;&nbsp;2.5&nbsp;mm){' '}
              {forecast ? formatPercent(forecast.rainProbability) : '--'}, confidence {forecast?.confidenceLevel ?? '--'}.
              Simulated data.
            </p>
          </Section>

          <Section title="Crop &amp; stage">
            <p className="text-sm text-slate-800">
              <span className="font-bold">{advisory.crop}</span> &mdash; {advisory.stage} stage
            </p>
          </Section>

          <Section title="Recommended action">
            <p className="text-sm font-bold text-slate-900">{advisory.action}</p>
            <p className="text-sm text-slate-600 leading-relaxed">{advisory.detail}</p>
          </Section>

          <Section title="Farmer message preview (SMS)">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-800 leading-relaxed">{advisory.message}</p>
              <p className="mt-2 text-[11px] font-mono text-slate-500">{advisory.message.length} characters</p>
            </div>
          </Section>

          <Section title="Target farmers">
            <p className="text-sm text-slate-800">
              <span className="font-bold tabular-nums">{pluralFarmers(advisory.farmers)}</span> in {advisory.gpName}, by SMS.
            </p>
          </Section>

          <Link
            to={`/panchayats?gp=${encodeURIComponent(advisory.gpId)}&t=${advisory.leadHours}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-sm"
          >
            Open in Panchayat Explorer <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Footer: the action follows the status */}
        <div className="border-t border-slate-200/80 px-5 py-4 space-y-3 bg-white">
          <div ref={feedbackRef} tabIndex={-1} role="status" aria-live="polite" className="outline-none">
            {feedback && (
              <p
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  feedback.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {feedback.message}
              </p>
            )}
          </div>

          {advisory.status === ADVISORY_STATUS.PENDING && (
            <button
              key="approve"
              type="button"
              onClick={() => run(approve)}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Approve advisory
            </button>
          )}
          {advisory.status === ADVISORY_STATUS.APPROVED && (
            <>
              <p className="text-xs text-slate-600">Approved {formatWorkflowTime(advisory.approvedAt)}.</p>
              <button
                key="send"
                type="button"
                onClick={() => run(send)}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
              >
                Send to {pluralFarmers(advisory.farmers)} (SMS)
              </button>
            </>
          )}
          {advisory.status === ADVISORY_STATUS.SENT && (
            <p className="text-xs text-slate-600">
              Sent via {advisory.channel} to {pluralFarmers(advisory.farmersReached)} at {formatWorkflowTime(advisory.sentAt)}.
              Simulated: no message left this browser.
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdvisoryReviewDrawer({ advisoryId, onClose }) {
  if (!advisoryId) return null;
  // Portalled so it stacks above the Leaflet panes and the sticky nav.
  return createPortal(<Drawer key={advisoryId} advisoryId={advisoryId} onClose={onClose} />, document.body);
}
