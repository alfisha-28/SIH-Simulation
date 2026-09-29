import { Link } from 'react-router-dom';

// Shown on the regional forecast-driver drill-downs (EventDetail / EventForecast /
// EventRisk). Those pages come from the first, region-scale project and show
// the backend's weather systems; the SIH26074 workflow lives at Gram Panchayat
// level, so this points people there instead of leaving them on a dead end.
export default function PanchayatDetailNote({ className = '' }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-slate-700 ${className}`}
    >
      <p className="leading-relaxed min-w-0">
        <strong className="text-blue-700">Regional forecast driver.</strong> This page shows the broad,
        region-scale weather system behind the forecasts. Panchayat-level detail, with block vs Panchayat
        forecasts and uncertainty ranges, lives in the Panchayat Explorer.
      </p>
      <Link
        to="/panchayats"
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Open Panchayat Explorer <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}
