import { ADVISORY_STATUS, STATUS_LABELS } from '../../lib/advisories';

// Status chip for the advisory review workflow (lib/advisories.js lifecycle):
// pending review = amber, approved = blue, sent = green. Sized like the
// SeverityBadge chip so the two sit side by side. Pass status={null} for a GP
// that has no advisory drafted: it renders a quiet "No advisory" instead.
const STYLES = {
  [ADVISORY_STATUS.PENDING]: 'bg-amber-50 text-amber-800 border-amber-200',
  [ADVISORY_STATUS.APPROVED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [ADVISORY_STATUS.SENT]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function AdvisoryStatusBadge({ status, className = '' }) {
  if (!status) {
    return <span className={`text-xs text-slate-500 whitespace-nowrap ${className}`}>No advisory drafted</span>;
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border font-mono whitespace-nowrap ${
        STYLES[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
      } ${className}`}
    >
      <span className="w-[0.45em] h-[0.45em] rounded-full bg-current" aria-hidden="true"></span>
      {STATUS_LABELS[status] ?? 'Unknown'}
    </span>
  );
}
