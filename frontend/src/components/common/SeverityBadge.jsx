export default function SeverityBadge({ severity, className = '' }) {
  const getStyle = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'severe':
      case 'high':
      case 'critical':
      case 'alert':
        return 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]';
      case 'moderate':
      case 'warning':
        return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE047]';
      case 'low':
      case 'safe':
        return 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]';
      default:
        return 'bg-[#DBEAFE] text-[#2563EB] border-[#93C5FD]';
    }
  };

  const getIcon = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'severe':
      case 'high':
      case 'critical':
      case 'alert':
        return '🔴';
      case 'moderate':
      case 'warning':
        return '🟡';
      case 'low':
      case 'safe':
        return '🟢';
      default:
        return '🔵';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border font-mono ${getStyle(
        severity
      )} ${className}`}
    >
      <span>{getIcon(severity)}</span>
      <span>{severity || 'UNKNOWN'}</span>
    </span>
  );
}
