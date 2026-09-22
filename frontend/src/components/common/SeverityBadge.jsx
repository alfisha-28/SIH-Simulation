export default function SeverityBadge({ severity, className = '' }) {
  const getStyle = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'severe':
      case 'high':
      case 'critical':
      case 'alert':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'moderate':
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
      case 'safe':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border font-mono ${getStyle(
        severity
      )} ${className}`}
    >
      <span className="w-[0.45em] h-[0.45em] rounded-full bg-current"></span>
      <span>{severity || 'UNKNOWN'}</span>
    </span>
  );
}
