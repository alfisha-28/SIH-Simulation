// Shared formatters. Each page was re-declaring its own copy of these with
// slightly different (and sometimes buggy) behavior; import from here instead.

/**
 * formatEventType(type: string | null | undefined) -> string
 * 'flood_risk_zone' -> 'FLOOD RISK ZONE'. Replaces every underscore, not
 * just the first (the copies this replaced only did `.replace('_', ' ')`,
 * which left the remaining underscores in any type with two or more).
 */
export function formatEventType(type) {
  if (!type) return 'Unknown';
  return type.replace(/_/g, ' ').toUpperCase();
}

/**
 * formatTimestampUTC(value: string | null | undefined) -> string
 * 'YYYY-MM-DD... UTC' style timestamp, e.g. 'Wed, 23 Sep 2026 14:30:00 UTC'.
 * The backend serializes naive datetimes with no trailing 'Z' or offset, so
 * a plain `new Date(value)` gets parsed as local time by the browser and
 * every timestamp ends up off by the local UTC offset while still labelled
 * UTC. This forces UTC interpretation before formatting. Returns 'Unknown'
 * for a missing or unparseable value, never a fabricated time.
 */
export function formatTimestampUTC(value) {
  if (!value) return 'Unknown';
  const hasZone = /[Zz]$|[+-]\d\d:?\d\d$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toUTCString().replace(' GMT', ' UTC');
}
