import L from 'leaflet';

export function createEventIcon(severity, isSelected = false) {
  let bgClass = 'bg-emerald-500 border-emerald-200';
  let pulseColor = 'bg-emerald-400';

  if (severity === 'severe') {
    bgClass = 'bg-red-500 border-red-200';
    pulseColor = 'bg-red-500';
  } else if (severity === 'moderate') {
    bgClass = 'bg-amber-500 border-amber-200';
    pulseColor = 'bg-amber-400';
  }

  const selectionRing = isSelected
    ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-125'
    : 'hover:scale-110';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center w-7 h-7">
        ${
          isSelected
            ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75"></span>`
            : ''
        }
        <span class="relative inline-flex rounded-full h-5 w-5 ${bgClass} border-2 shadow-lg transition-all ${selectionRing}"></span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function createTrajectoryStepIcon(isCurrent = false) {
  const sizeClass = isCurrent
    ? 'w-5 h-5 bg-blue-400 border-2 border-white ring-4 ring-blue-400/40 z-50'
    : 'w-3 h-3 bg-blue-400 border border-blue-200 opacity-80';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="flex items-center justify-center">
        <div class="rounded-full shadow-md ${sizeClass}"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
