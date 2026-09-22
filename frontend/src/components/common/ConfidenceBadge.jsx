export default function ConfidenceBadge({ confidence, className = '' }) {
  const getStyle = (conf) => {
    switch (conf?.toLowerCase()) {
      case 'high':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'moderate':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border font-mono ${getStyle(
        confidence
      )} ${className}`}
    >
      {confidence || 'NORMAL'}
    </span>
  );
}
