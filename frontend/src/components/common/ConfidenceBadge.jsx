export default function ConfidenceBadge({ confidence, className = '' }) {
  const getStyle = (conf) => {
    switch (conf?.toLowerCase()) {
      case 'high':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'moderate':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
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
