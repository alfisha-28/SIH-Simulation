import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

export default function Landing() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/health')
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to connect to backend');
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Weather Intelligence Command Center
        </h1>
        <p className="text-slate-400">
          AI-Powered Extreme Weather Anomaly Tracking & Hyperlocal Downscaling Prototype (SIH 2026)
        </p>
      </div>

      <div className="border border-slate-800 bg-slate-900/40 p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Backend Connection Status</h2>
        {loading && (
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span>Checking system status...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center space-x-2 text-red-400 bg-red-950/40 border border-red-800 p-4 rounded">
            <span className="font-semibold">Error:</span>
            <span>{error}</span>
          </div>
        )}
        {health && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-mono font-medium text-lg">
                System Status: Operational ({health.status.toUpperCase()})
              </span>
            </div>
            <div className="text-sm font-mono text-slate-400 bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-slate-500">Service:</span> {health.service}
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500 italic">
        Phase 0 Scaffolding Ready — Select a module from the navigation bar above.
      </div>
    </div>
  );
}
