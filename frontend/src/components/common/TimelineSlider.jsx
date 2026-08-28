import { useState, useEffect } from 'react';

export default function TimelineSlider({
  timeline = [],
  selectedIndex = 0,
  onSelectIndex,
  title = "Forecast Lead Timeline",
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
      <div className="p-4 bg-white border border-[#D9E4EE] rounded-xl text-slate-500 text-xs text-center font-mono shadow-sm">
        No forecast timeline available.
      </div>
    );
  }

  const currentStep = timeline[selectedIndex] || timeline[0];

  const getRiskBadgeColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'severe':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="bg-white border border-[#D9E4EE] rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header controls & Current Timestep Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              isPlaying
                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/80'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/10'
            }`}
          >
            {isPlaying ? (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                <span>Pause Simulation</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play Timeline</span>
              </>
            )}
          </button>

          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            {title}
          </span>
        </div>

        {/* Selected Timestep Details */}
        {currentStep && (
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-500">Timestep:</span>
            <span className="text-blue-700 font-bold px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
              {currentStep.timestep_label}
            </span>
            <span className="text-slate-500">({currentStep.timestep_hours_offset}h)</span>
            {currentStep.risk_level && (
              <span
                className={`px-2 py-0.5 border rounded uppercase font-bold text-[10px] ${getRiskBadgeColor(
                  currentStep.risk_level
                )}`}
              >
                {currentStep.risk_level} Risk
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stepper Buttons & Visual Progress Track */}
      <div className="relative pt-2 pb-1">
        <input
          type="range"
          min={0}
          max={timeline.length - 1}
          value={selectedIndex}
          onChange={(e) => onSelectIndex(Number(e.target.value))}
          className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 focus:outline-none"
        />

        {/* Step Marker Labels Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-3">
          {timeline.map((step, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={step.timestep_label || idx}
                onClick={() => onSelectIndex(idx)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-400 text-blue-700 shadow-sm scale-105 font-medium'
                    : 'bg-white border border-[#D9E4EE] text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-xs font-mono">{step.timestep_label}</span>
                <span className="text-[10px] opacity-70 font-mono">
                  {step.timestep_hours_offset === 0 ? 'Now' : `+${step.timestep_hours_offset}h`}
                </span>
                {step.probability !== undefined && (
                  <span className={`text-[10px] mt-1 font-mono font-semibold ${isSelected ? 'text-blue-700' : 'text-blue-600'}`}>
                    {Math.round(step.probability * 100)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
