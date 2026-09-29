// Shared KVK / AMFU advisory review workflow: the mutable half of the advisory
// model (lib/advisories.js holds the deterministic dataset). One module-level
// store, read through `useAdvisories()`, so every page shows the same state:
// approving on the KVK Dashboard shows up on the Advisories page, the Overview
// counts and the nav badge without any provider or prop drilling.
//
// SIMULATED WORKFLOW. There is no approval backend, SMS gateway or FCM behind
// "Approve" and "Send": they update local state so the KVK / AMFU flow can be
// demonstrated. Timestamps are recorded from the user's actions with the real
// clock, which is fine here: it is workflow state, not forecast data.
//
// ---- Lifecycle ----------------------------------------------------------------
//   pending_review --review--> pending_review   (records reviewedAt; status unchanged)
//   pending_review --approve-> approved
//   approved       --send----> sent             (simulated SMS to the GP's registered farmers)
// Anything else is refused with { ok: false, message }: an advisory cannot be
// sent before approval, approved twice, or moved backwards. Only `reset()` goes
// back to the seeded state.
//
// ---- Persistence ---------------------------------------------------------------
// Only what the user changed is stored, under STORAGE_KEY ('...v1': bump the
// version if the shape changes). Every localStorage access is in try/catch, so a
// blocked or throwing storage just means the state lives for the session. Stored
// data is validated on load: unknown ids, statuses or timestamps are dropped, and
// a stored status can never precede the seeded one. Other tabs are kept in sync
// through the `storage` event.
//
// ---- API -----------------------------------------------------------------------
//   useAdvisories() -> {
//     advisories   Advisory[] (lib/advisories.js) + workflow fields, most urgent first:
//                  { status, statusLabel, reviewedAt, approvedAt, sentAt,
//                    farmersReached (null until sent), channel ('SMS' once sent) }
//     counts       { total, pending, approved, sent }
//     byId, byGpId maps of the same merged advisories (byGpId: one per GP)
//     review(id), approve(id), send(id), reset()      stable functions, each returns
//                  { ok: boolean, message: string } (message is ready to announce)
//   }
//   Non-React access (same data): getAdvisoriesSnapshot(), subscribeAdvisories(listener),
//   plus the actions exported individually: reviewAdvisory, approveAdvisory,
//   sendAdvisory, resetAdvisories.
//   The snapshot object is replaced (never mutated) on every change, so it is
//   safe as a useSyncExternalStore snapshot and as a memo dependency.

import { useMemo, useSyncExternalStore } from 'react';
import { ADVISORIES, ADVISORY_STATUS, STATUS_LABELS, STATUS_ORDER, pluralFarmers } from './advisories';

export const STORAGE_KEY = 'warsha.kvk.advisories.v1';
const SEND_CHANNEL = 'SMS';

// ---- persistence ---------------------------------------------------------------

const isIso = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

// { [advisoryId]: { status, reviewedAt, approvedAt, sentAt } } -> only sane entries.
function sanitize(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const advisory of ADVISORIES) {
    const entry = raw[advisory.id];
    if (!entry || typeof entry !== 'object') continue;
    if (STATUS_ORDER.indexOf(entry.status) < STATUS_ORDER.indexOf(advisory.initialStatus)) continue;
    out[advisory.id] = {
      status: entry.status,
      reviewedAt: isIso(entry.reviewedAt) ? entry.reviewedAt : null,
      approvedAt: isIso(entry.approvedAt) ? entry.approvedAt : null,
      sentAt: isIso(entry.sentAt) ? entry.sentAt : null,
    };
  }
  return out;
}

function readStored() {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) return {};
    return sanitize(JSON.parse(text)?.overrides);
  } catch {
    return {};
  }
}

function writeStored(overrides) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, overrides }));
  } catch {
    // Storage blocked or full: the workflow keeps working for this session.
  }
}

function clearStored() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore, see writeStored
  }
}

// ---- state ----------------------------------------------------------------------

let overrides = readStored();
let snapshot = buildSnapshot();
const listeners = new Set();

function merge(advisory) {
  const o = overrides[advisory.id];
  const status = o?.status ?? advisory.initialStatus;
  const sent = status === ADVISORY_STATUS.SENT;
  return Object.freeze({
    ...advisory,
    status,
    statusLabel: STATUS_LABELS[status],
    reviewedAt: o?.reviewedAt ?? null,
    approvedAt: o?.approvedAt ?? advisory.initialApprovedAt,
    sentAt: o?.sentAt ?? (sent ? advisory.initialSentAt : null),
    farmersReached: sent ? advisory.farmers : null,
    channel: sent ? SEND_CHANNEL : null,
  });
}

function buildSnapshot() {
  const advisories = ADVISORIES.map(merge);
  const counts = { total: advisories.length, pending: 0, approved: 0, sent: 0 };
  for (const a of advisories) {
    if (a.status === ADVISORY_STATUS.PENDING) counts.pending += 1;
    else if (a.status === ADVISORY_STATUS.APPROVED) counts.approved += 1;
    else counts.sent += 1;
  }
  return Object.freeze({
    advisories: Object.freeze(advisories),
    counts: Object.freeze(counts),
    byId: Object.freeze(Object.fromEntries(advisories.map((a) => [a.id, a]))),
    byGpId: Object.freeze(Object.fromEntries(advisories.map((a) => [a.gpId, a]))),
  });
}

function commit(nextOverrides, { persist = true } = {}) {
  overrides = nextOverrides;
  snapshot = buildSnapshot();
  if (persist) {
    if (Object.keys(overrides).length === 0) clearStored();
    else writeStored(overrides);
  }
  listeners.forEach((listener) => listener());
}

// ---- external store contract ----------------------------------------------------

export const getAdvisoriesSnapshot = () => snapshot;

function onStorage(event) {
  // key === null: storage was cleared in another tab.
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  commit(readStored(), { persist: false });
}

export function subscribeAdvisories(listener) {
  if (listeners.size === 0 && typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

// ---- actions ---------------------------------------------------------------------

const fail = (message) => ({ ok: false, message });
const succeed = (message) => ({ ok: true, message });
const nowIso = () => new Date().toISOString();

function lookup(id) {
  return snapshot.byId[id] ?? null;
}

// Marks the advisory as looked at; the status only changes on approve.
export function reviewAdvisory(id) {
  const advisory = lookup(id);
  if (!advisory) return fail('Advisory not found.');
  if (advisory.status !== ADVISORY_STATUS.PENDING) {
    return succeed(`${advisory.gpName} advisory is already ${advisory.statusLabel.toLowerCase()}.`);
  }
  if (!advisory.reviewedAt) {
    commit({
      ...overrides,
      [id]: { ...overrides[id], status: advisory.status, reviewedAt: nowIso(), approvedAt: null, sentAt: null },
    });
  }
  return succeed(`Reviewing the ${advisory.gpName} advisory.`);
}

export function approveAdvisory(id) {
  const advisory = lookup(id);
  if (!advisory) return fail('Advisory not found.');
  if (advisory.status !== ADVISORY_STATUS.PENDING) {
    return fail(`Only advisories pending review can be approved; this one is ${advisory.statusLabel.toLowerCase()}.`);
  }
  const at = nowIso();
  commit({
    ...overrides,
    [id]: { status: ADVISORY_STATUS.APPROVED, reviewedAt: advisory.reviewedAt ?? at, approvedAt: at, sentAt: null },
  });
  return succeed(`${advisory.gpName} advisory approved. It is ready to send.`);
}

export function sendAdvisory(id) {
  const advisory = lookup(id);
  if (!advisory) return fail('Advisory not found.');
  if (advisory.status !== ADVISORY_STATUS.APPROVED) {
    return fail(
      advisory.status === ADVISORY_STATUS.SENT
        ? 'This advisory has already been sent.'
        : 'An advisory must be approved before it can be sent.'
    );
  }
  commit({
    ...overrides,
    [id]: {
      status: ADVISORY_STATUS.SENT,
      reviewedAt: advisory.reviewedAt,
      approvedAt: advisory.approvedAt,
      sentAt: nowIso(),
    },
  });
  return succeed(`Sent via ${SEND_CHANNEL} to ${pluralFarmers(advisory.farmers)} in ${advisory.gpName}.`);
}

export function resetAdvisories() {
  commit({});
  return succeed('Demo reset: advisories are back to their starting state.');
}

const ACTIONS = Object.freeze({
  review: reviewAdvisory,
  approve: approveAdvisory,
  send: sendAdvisory,
  reset: resetAdvisories,
});

// Server snapshot = the seeded state, so the hook is also safe to render outside a browser.
const SERVER_SNAPSHOT = buildSnapshot();

export function useAdvisories() {
  const state = useSyncExternalStore(subscribeAdvisories, getAdvisoriesSnapshot, () => SERVER_SNAPSHOT);
  return useMemo(() => ({ ...state, ...ACTIONS }), [state]);
}
