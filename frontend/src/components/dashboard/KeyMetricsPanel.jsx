export default function KeyMetricsPanel({
  selectedEvent,
  selectedEventDetail,
  currentTimestep,
}) {
  if (!selectedEvent) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs text-center">
        Select an event to view metrics.
      </div>
    );
  }

  // EFI Breakdown (from detail or fallback to event level)
  const rainfallEfi = selectedEventDetail?.rainfall_efi ?? selectedEvent.rainfall_efi ?? 0;
  const tempEfi = selectedEventDetail?.temperature_efi ?? selectedEvent.temperature_efi ?? 0;
  const windEfi = selectedEventDetail?.wind_efi ?? selectedEvent.wind_efi ?? 0;

  // Timestep specific metrics
  const stepProb = currentTimestep ? Math.round(currentTimestep.probability * 100) : Math.round(selectedEvent.probability * 100);
  const stepRisk = currentTimestep?.risk_level || selectedEvent.severity;
  const stepIntensity = currentTimestep?.intensity ?? 0;
  const radiusKm = currentTimestep?.uncertainty_radius_km ?? 0;

  const coarse = currentTimestep?.coarse || null;
  const downscaled = currentTimestep?.downscaled || null;

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'severe':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'high':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'moderate':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      default:
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            Key Intelligence Metrics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ML risk & downscaling parameters for{' '}
            <span className="text-cyan-300 font-semibold">{selectedEvent.event_id}</span>
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-md text-xs font-bold uppercase border ${getRiskColor(
            stepRisk
          )}`}
        >
          {stepRisk} Risk
        </div>
      </div>

      {/* Top 4 Core Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Probability Metric */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Timestep Probability
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-extrabold text-slate-100 font-mono">
              {stepProb}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({selectedEvent.confidence} conf)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${stepProb}%` }}
            ></div>
          </div>
        </div>

        {/* Intensity Metric */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Forecast Intensity
          </span>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono">
            {stepIntensity.toFixed(1)}
            <span className="text-xs text-slate-400 font-sans ml-1 font-normal">mm/24h</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Uncertainty r = {radiusKm}km
          </span>
        </div>

        {/* Ensemble Agreement */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Ensemble Agreement
          </span>
          <div className="text-2xl font-extrabold text-purple-300 font-mono">
            {Math.round((selectedEvent.ensemble_agreement ?? 0) * 100)}%
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            ECMWF / GFS / ICON
          </span>
        </div>

        {/* Vector Movement */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Movement Vector
          </span>
          <div className="text-lg font-bold text-amber-300 font-mono">
            {selectedEvent.movement_direction || 'N/A'}
          </div>
          <span className="text-xs text-slate-300 font-mono block">
            @ {selectedEvent.movement_speed_kmh} km/h
          </span>
        </div>
      </div>

      {/* EFI (Extreme Forecast Index) Gauge Breakdown */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
            Extreme Forecast Index (EFI) Breakdown
          </span>
          <span className="text-[11px] text-slate-500 font-mono">0.0 (Normal) → 1.0 (Extreme)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Rainfall EFI */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Rainfall EFI</span>
              <span className="text-blue-400 font-bold">{rainfallEfi.toFixed(2)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${rainfallEfi * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Temperature EFI */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Temp EFI</span>
              <span className="text-red-400 font-bold">{tempEfi.toFixed(2)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${tempEfi * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Wind EFI */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Wind EFI</span>
              <span className="text-amber-400 font-bold">{windEfi.toFixed(2)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${windEfi * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Coarse (12km) vs Downscaled (5km) Resolution Comparison */}
      {(coarse || downscaled) && (
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              ML Downscaling Comparison (Coarse vs High-Res)
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Timestep: {currentTimestep?.timestep_label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* 12km Coarse Box */}
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-md space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide flex justify-between">
                <span>Global Model (12km)</span>
                <span className="text-slate-500">Coarse Grid</span>
              </div>
              <div className="text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mean Rainfall:</span>
                  <span className="text-slate-200">{coarse?.rainfall_mm ?? 'N/A'} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Temperature:</span>
                  <span className="text-slate-200">{coarse?.temperature_c ?? 'N/A'} °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Wind Speed:</span>
                  <span className="text-slate-200">{coarse?.wind_speed_kmh ?? 'N/A'} km/h</span>
                </div>
              </div>
            </div>

            {/* 5km Downscaled Box */}
            <div className="p-3 bg-slate-900/90 border border-cyan-900/50 rounded-md space-y-1.5 shadow-inner">
              <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wide flex justify-between">
                <span>Neural Downscaled (5km)</span>
                <span className="text-cyan-300 font-semibold">High-Res Peak</span>
              </div>
              <div className="text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Peak Rainfall:</span>
                  <span className="text-cyan-300 font-bold">
                    {downscaled?.peak_rainfall_mm ?? 'N/A'} mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Intensity:</span>
                  <span className="text-cyan-300 font-semibold">
                    {downscaled?.max_intensity_mmhr ?? 'N/A'} mm/h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Extreme Preservation:</span>
                  <span className="text-emerald-400 font-bold">
                    {downscaled?.extreme_preservation_pct ?? 'N/A'}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
