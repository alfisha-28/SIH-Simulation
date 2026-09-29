// Display formatting for Panchayat forecast values. Missing values render as
// '--' (never a fabricated number), matching the rest of the app's data-honesty
// convention. Inputs are the numbers on a Forecast from lib/panchayatData.js.

const isMissing = (v) => v === null || v === undefined || Number.isNaN(v);

// Rainfall keeps one decimal for small totals ("2.4"), whole mm from 10 up.
export const formatRainMm = (v) => (isMissing(v) ? '--' : v < 10 ? v.toFixed(1) : String(Math.round(v)));
export const formatTempC = (v) => (isMissing(v) ? '--' : v.toFixed(1));
export const formatWindKmh = (v) => (isMissing(v) ? '--' : String(Math.round(v)));
export const formatPercent = (v) => (isMissing(v) ? '--' : `${Math.round(v * 100)}%`);

// [lo, hi] -> "62–81"; collapses to a single number if both ends print the same.
export function formatRange(range, format) {
  if (!Array.isArray(range) || range.length !== 2) return '--';
  const [lo, hi] = [format(range[0]), format(range[1])];
  return lo === hi ? lo : `${lo}–${hi}`;
}

// Signed difference, with a real minus sign, for the coarse-vs-downscaled table.
export function formatDelta(value, format, unit = '') {
  if (isMissing(value)) return '--';
  const text = format(Math.abs(value));
  if (Number(text) === 0) return `0${unit}`;
  return `${value > 0 ? '+' : '−'}${text}${unit}`;
}

// Difference of two values as the reader sees them: computed from the displayed
// (rounded) numbers so the table never shows 95 - 67 = +29.
export function formatDeltaOf(next, base, format, unit = '') {
  if (isMissing(next) || isMissing(base)) return '--';
  const diff = Number(format(next)) - Number(format(base));
  return formatDelta(Math.round(diff * 10) / 10, format, unit);
}

export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
