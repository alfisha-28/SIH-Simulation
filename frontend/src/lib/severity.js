// Single source of truth for severity / risk level styling and labels.
// Import from here instead of re-declaring a color map in a component
// (SeverityBadge, TimelineSlider, KeyMetricsPanel, Alerts, mapIcons all
// need the same four buckets to stay in sync).
//
// Backend vocabulary is severe | moderate | low. 'high' and legacy aliases
// (critical, alert, warning, safe) are also handled so older data and the
// four level risk scale (low/moderate/high/severe) both render correctly.

/**
 * getSeverityStyle(value: string | null | undefined) -> string
 * Tailwind classes (background, text, border) for a severity/risk chip.
 * 'severe' gets a solid red fill so it stays visually distinct from the
 * softer red used for 'high' (see finding F59: both used to render the
 * same bg-red-50, making a 4 level scale look like 2).
 */
export function getSeverityStyle(value) {
  switch ((value || '').toLowerCase()) {
    case 'severe':
    case 'critical':
    case 'alert':
      return 'bg-red-600 text-white border-red-600';
    case 'high':
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
}

/**
 * getSeverityLabel(value, suffix?) -> string
 * The text a severity/risk chip should show. Never invents a value: a
 * missing severity renders 'Unknown' rather than a fabricated default.
 * Pass suffix to compose e.g. getSeverityLabel('moderate', 'RISK') ->
 * 'moderate RISK'.
 */
export function getSeverityLabel(value, suffix = '') {
  if (!value) return 'Unknown';
  return suffix ? `${value} ${suffix}` : value;
}

// Shared chip shape for every status badge (SeverityBadge, ConfidenceBadge),
// so severity and confidence render as one consistent chip regardless of
// which component draws them (finding F72: badges used four different radii).
const BADGE_BASE_CLASSES =
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border font-mono';

// Utilities a caller is allowed to override via className. Each entry maps
// a pattern (matched against a token in the caller's className) to the base
// class it should replace. Without this, a caller passing className="text-2xl"
// never actually renders larger, because Tailwind resolves conflicting
// utilities by stylesheet order, not by class attribute order, and the
// component's own "text-xs" always wins (finding F64).
const OVERRIDABLE = [
  { pattern: /^text-(\[.+\]|xs|sm|base|lg|xl|\d?xl)$/, replaces: 'text-xs' },
  { pattern: /^px-/, replaces: 'px-2.5' },
  { pattern: /^py-/, replaces: 'py-0.5' },
  { pattern: /^tracking-/, replaces: 'tracking-wide' },
];

/**
 * SIZES maps a `size` prop ('sm' | 'md' | 'lg') to the text/padding/tracking
 * classes for that chip size. A caller can ask for a size by name instead of
 * hand-rolling className overrides; feed the result through badgeClassName()
 * alongside any caller className so a `size` prop and a raw className
 * override both resolve through the same replacement path (finding F64).
 * 'sm' matches the badge's own base classes, so omitting `size` is a no-op.
 */
export const SIZES = {
  sm: 'px-2.5 py-0.5 text-xs tracking-wide',
  md: 'px-3 py-1 text-sm tracking-wide',
  lg: 'px-6 py-2.5 text-2xl tracking-widest',
};

/**
 * badgeClassName(extra?: string) -> string
 * Full className for a status chip: BADGE_BASE_CLASSES with any size utility
 * (text-*, px-*, py-*, tracking-*) replaced by the last matching token found
 * in `extra`, plus anything additive (shadow-sm, etc) appended. `extra` is
 * meant to be the SIZES preset followed by the caller's className, so this
 * also dedupes within `extra` itself: when both the preset and the caller
 * supply a same-rule utility (e.g. the preset's text-xs and a caller's
 * text-sm), only the later one is kept, the same way it beats the base.
 * Without this, both tokens ended up in the class list and Tailwind's own
 * stylesheet order (not class order) decided the winner, which silently
 * dropped size overrides (finding F64).
 */
export function badgeClassName(extra = '') {
  const tokens = extra.split(/\s+/).filter(Boolean);
  const kept = tokens.filter((token, i) => {
    const rule = OVERRIDABLE.find((r) => r.pattern.test(token));
    return !rule || !tokens.slice(i + 1).some((t) => rule.pattern.test(t));
  });
  const base = BADGE_BASE_CLASSES.split(' ').filter((cls) => {
    const rule = OVERRIDABLE.find((r) => r.replaces === cls);
    return !rule || !kept.some((t) => rule.pattern.test(t));
  });
  return [...base, ...kept].join(' ');
}
