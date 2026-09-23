import { getSeverityStyle, getSeverityLabel, badgeClassName, SIZES } from '../../lib/severity';

// `size` ('sm' | 'md' | 'lg') covers callers that want a named chip size;
// `className` still accepts a raw utility override on top of it. Both
// resolve through badgeClassName() so neither loses to the base classes.
export default function SeverityBadge({ severity, suffix = '', size = 'sm', className = '' }) {
  return (
    <span className={`${badgeClassName(`${SIZES[size] || SIZES.sm} ${className}`)} ${getSeverityStyle(severity)}`}>
      <span className="w-[0.45em] h-[0.45em] rounded-full bg-current" aria-hidden="true"></span>
      <span>{getSeverityLabel(severity, suffix)}</span>
    </span>
  );
}
