import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-center">
      <title>Page Not Found | WARSHA</title>
      <div className="p-5 bg-white border border-[#D9E4EE] rounded-xl space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center mx-auto text-xl font-bold font-mono">
          404
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The page you requested does not exist or may have been moved.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            Go to Events Explorer
          </Link>
        </div>
      </div>
    </div>
  );
}
