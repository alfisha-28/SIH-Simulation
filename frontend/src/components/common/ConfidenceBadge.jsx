import { badgeClassName, SIZES } from '../../lib/severity';

function getConfidenceStyle(conf) {
  switch ((conf || '').toLowerCase()) {
    case 'high':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'moderate':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'low':
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
}

// label defaults to 'Confidence' so a bare value like "HIGH" can never be
// mistaken for a severity level (SeverityBadge also renders a bare "HIGH" in
// red for the 'high' risk level). Pass label={null} when the badge already
// sits under a column header or caption that says "Confidence" so the text
// does not repeat.
// `size` ('sm' | 'md' | 'lg') mirrors SeverityBadge so the two chips can be
// sized consistently side by side.
export default function ConfidenceBadge({ confidence, label = 'Confidence', size = 'sm', className = '' }) {
  // The backend's confidence field is optional. Never invent a specific
  // value such as the old hard coded "NORMAL" fallback, but a missing value
  // still has to render something: conventions.md's "Data honesty" rule
  // renders 'Unknown' for a missing field, matching SeverityBadge, instead
  // of leaving a silent gap where the chip would have been.
  const value = confidence || 'Unknown';
  const text = label ? `${label}: ${value}` : value;

  return (
    <span className={`${badgeClassName(`${SIZES[size] || SIZES.sm} ${className}`)} ${getConfidenceStyle(value)}`}>
      {text}
    </span>
  );
}
