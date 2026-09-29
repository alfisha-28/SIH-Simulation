import { useState, useEffect, useRef } from 'react';

export default function TimelineSlider({
  timeline = [],
  selectedIndex = 0,
  onSelectIndex,
  title = "Forecast Lead Timeline",
  // Grid classes for the step buttons. The default suits the backend's six
  // step timelines; callers with a different step count (the Panchayat
  // Explorer has five) pass a matching column count so the row fills evenly.
  stepGridClassName = 'grid-cols-3 sm:grid-cols-6',
  // The small "+6h" line under each step label. Callers whose labels already
  // read "Now" / "+6h" turn it off instead of printing the same text twice.
  showStepOffsets = true,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const canPlay = timeline.length > 1;

  // Tracks the current index so the interval always advances from the real
  // position and always hands the caller a plain number, never an updater
  // function (a caller-side setState(number) and a caller-side handler that
  // expects a number both need to keep working).
  const selectedIndexRef = useRef(selectedIndex);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  // A single step timeline (or the timeline switching under an active
  // playback) should never leave Play stuck on with nothing to advance to.
  useEffect(() => {
    function resetPlayback() {
      setIsPlaying(false);
    }
    resetPlayback();
  }, [timeline]);

  useEffect(() => {
    if (!isPlaying || !canPlay) return undefined;
    const timer = setInterval(() => {
      const nextIndex = selectedIndexRef.current + 1;
      if (nextIndex >= timeline.length) {
        setIsPlaying(false);
        return;
      }
      onSelectIndex(nextIndex);
    }, 2200);
    return () => clearInterval(timer);
  }, [isPlaying, canPlay, timeline.length, onSelectIndex]);

  // Manual selection (drag or step click) always wins over autoplay.
  const selectManually = (index) => {
    setIsPlaying(false);
    onSelectIndex(index);
  };

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
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
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
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={!canPlay}
            aria-pressed={isPlaying}
            className={`min-w-[10.5rem] whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              !canPlay
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : isPlaying
                ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 cursor-pointer'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm cursor-pointer'
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
            {showStepOffsets && <span className="text-slate-500">({currentStep.timestep_hours_offset}h)</span>}
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
          onChange={(e) => selectManually(Number(e.target.value))}
          className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 focus:outline-none"
        />

        {/* Step Marker Labels Grid */}
        <div className={`grid ${stepGridClassName} gap-1.5 pt-3`}>
          {timeline.map((step, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={step.timestep_label || idx}
                onClick={() => selectManually(idx)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-400 text-blue-700 shadow-sm scale-105 font-medium'
                    : 'bg-white border border-[#D9E4EE] text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-xs font-mono">{step.timestep_label}</span>
                {showStepOffsets && (
                  <span className="text-[10px] opacity-70 font-mono">
                    {step.timestep_hours_offset === 0 ? 'Now' : `+${step.timestep_hours_offset}h`}
                  </span>
                )}
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
