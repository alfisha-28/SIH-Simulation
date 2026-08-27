import { useState, useEffect } from 'react';

export default function ForecastTimelineSlider({
  timeline = [],
  selectedIndex = 0,
  onSelectIndex,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer;
    if (isPlaying && timeline.length > 0) {
      timer = setInterval(() => {
        onSelectIndex((prev) => (prev + 1) % timeline.length);
      }, 2200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeline.length, onSelectIndex]);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs text-center">
        No forecast timeline available for selected event.
      </div>
    );
  }

  const currentStep = timeline[selectedIndex] || timeline[0];

  const getRiskBadgeColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'severe':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'moderate':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur">
      {/* Header controls & Current Timestep Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                <span>Pause Arc</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Simulate Timeline</span>
              </>
            )}
          </button>

          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Forecast Lead Timeline
          </span>
        </div>

        {/* Selected Timestep Details */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Timestep:</span>
          <span className="text-cyan-400 font-bold px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/60 rounded">
            {currentStep.timestep_label}
          </span>
          <span className="text-slate-400">({currentStep.timestep_hours_offset}h)</span>
          <span
            className={`px-2 py-0.5 border rounded uppercase font-bold text-[10px] ${getRiskBadgeColor(
              currentStep.risk_level
            )}`}
          >
            {currentStep.risk_level} Risk
          </span>
        </div>
      </div>

      {/* Stepper Buttons & Visual Progress Track */}
      <div className="relative pt-2 pb-1">
        <input
          type="range"
          min={0}
          max={timeline.length - 1}
          value={selectedIndex}
          onChange={(e) => onSelectIndex(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 focus:outline-none"
        />

        {/* Step Marker Labels Grid */}
        <div className="grid grid-cols-6 gap-1 pt-3">
          {timeline.map((step, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={step.timestep_label}
                onClick={() => onSelectIndex(idx)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shadow-md scale-105'
                    : 'bg-slate-950/40 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="font-bold text-xs">{step.timestep_label}</span>
                <span className="text-[10px] opacity-70 font-mono">
                  {step.timestep_hours_offset === 0 ? 'Now' : `+${step.timestep_hours_offset}h`}
                </span>
                <span className="text-[10px] mt-1 font-mono text-cyan-400 font-semibold">
                  {Math.round(step.probability * 100)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
