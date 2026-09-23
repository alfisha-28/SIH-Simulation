import L from 'leaflet';

// Cache icons by their visual key so the same divIcon instance is returned
// across renders. react-leaflet calls marker.setIcon whenever the icon prop
// is a new object, which rewrites the marker's innerHTML and restarts the
// ping ring animation, so without this cache the markers visibly flicker on
// every render (finding F88).
const eventIconCache = new Map();

export function createEventIcon(severity, isSelected = false) {
  const cacheKey = `${severity}|${isSelected}`;
  const cached = eventIconCache.get(cacheKey);
  if (cached) return cached;

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

  const icon = L.divIcon({
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

  eventIconCache.set(cacheKey, icon);
  return icon;
}

const trajectoryIconCache = new Map();

export function createTrajectoryStepIcon(isCurrent = false) {
  const cacheKey = String(isCurrent);
  const cached = trajectoryIconCache.get(cacheKey);
  if (cached) return cached;

  const sizeClass = isCurrent
    ? 'w-5 h-5 bg-blue-400 border-2 border-white ring-4 ring-blue-400/40 z-50'
    : 'w-3 h-3 bg-blue-400 border border-blue-200 opacity-80';

  const icon = L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="flex items-center justify-center">
        <div class="rounded-full shadow-md ${sizeClass}"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  trajectoryIconCache.set(cacheKey, icon);
  return icon;
}
