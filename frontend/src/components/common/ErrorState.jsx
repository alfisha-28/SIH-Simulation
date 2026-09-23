// Shared error panel for a failed fetch. `message` is the plain headline sentence,
// `detail` is the technical text (an error's .message) shown smaller and muted below it.
export default function ErrorState({
  message = "Can't reach the intelligence server. Check that the backend is running and try again.",
  detail,
  onRetry,
}) {
  return (
    <div
      role="alert"
      className="p-5 bg-red-50 border border-red-200 rounded-xl shadow-sm text-center space-y-3"
    >
      <svg
        className="w-8 h-8 text-red-500 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-red-700">{message}</p>
        {detail && <p className="text-[11px] font-mono text-slate-500">{detail}</p>}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
