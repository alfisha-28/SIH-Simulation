export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

const CACHE_TTL_MS = 30000;

// url -> { promise, ts }. Lets several components that mount at once (Navbar, Landing,
// Dashboard, ...) share one in-flight GET instead of firing the same request several times,
// and keeps a finished response around for a short window so quick re-navigation is instant.
const requestCache = new Map();

// A single error type for every failure apiGet can throw, so callers can tell a dead network
// apart from a real HTTP status while still reading `.message` like a plain Error.
export class ApiError extends Error {
  constructor(message, { status = null, isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new ApiError(`Could not reach the server (${err.message}).`, { isNetworkError: true });
  }
  if (!response.ok) {
    throw new ApiError(`API Error ${response.status}: ${response.statusText}`, { status: response.status });
  }
  return response.json();
}

// Lets a caller's own AbortSignal (unmount, a superseded timestep drag, ...) reject only
// that caller's promise, without cancelling the underlying fetch other callers may be
// sharing through the request cache.
function withCallerAbort(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const fail = () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    if (signal.aborted) return fail();
    signal.addEventListener('abort', fail, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', fail));
  });
}

// options.signal: an AbortSignal from the caller. It never reaches the underlying fetch,
// so it cancels only the caller's own wait, not a request other components may share.
// On caller abort the returned promise rejects with the signal's reason, a DOMException
// named 'AbortError', not an ApiError, so loaders must return early on err.name ===
// 'AbortError' rather than render it.
// options.fresh: true skips reading the cache (an explicit user-triggered refresh), but
// the fresh response is still written into the cache for everyone else to share.
export async function apiGet(path, { signal, fresh = false } = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  if (!fresh) {
    const cached = requestCache.get(url);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return withCallerAbort(cached.promise, signal);
    }
  }

  const promise = fetchJson(url);

  // Always record the request, including a `fresh` refresh, so every other component
  // sharing this URL is served the new response instead of a stale one for the rest of
  // the TTL. `fresh` only skips the cache read above, never this write.
  requestCache.set(url, { promise, ts: Date.now() });
  // Only remove this entry if it is still the one we just stored: a later fresh
  // refresh may have already overwritten it, and this rejection is then stale
  // and must not evict the newer, still-live entry.
  promise.catch(() => {
    if (requestCache.get(url)?.promise === promise) requestCache.delete(url);
  });

  return withCallerAbort(promise, signal);
}
