import { DATASET_LABEL, DATASET_NOTE } from '../../lib/panchayatData';

// Small honesty chip for every screen that shows the mock Panchayat forecast
// (lib/panchayatData.js). The prototype has no real NWP / downscaling output
// behind it, and this keeps that visible instead of implied. `title` carries
// the longer explanation for hover / long-press.
export default function SimulatedDataBadge({ label = DATASET_LABEL, className = '' }) {
  return (
    <span
      title={DATASET_NOTE}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wide border bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap ${className}`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5m4.75-11.396c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
      {label}
    </span>
  );
}
