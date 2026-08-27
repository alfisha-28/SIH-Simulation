export default function SeverityBadge({ severity, className = '' }) {
  const getStyle = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'severe':
        return 'bg-red-500/20 text-red-400 border-red-500/40 shadow-red-950/20';
      case 'moderate':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-950/20';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-950/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border font-mono ${getStyle(
        severity
      )} ${className}`}
    >
      {severity || 'UNKNOWN'}
    </span>
  );
}
