import L from 'leaflet';

// Cached for the same reason as dashboard/mapIcons.js: react-leaflet calls
// marker.setIcon whenever the icon prop is a new object, which rewrites the
// marker's DOM. One shared instance means the selected-Panchayat pin never
// flickers when the lead time, variable or mode changes underneath it.
let selectedIcon = null;

export function createSelectedPanchayatIcon() {
  if (selectedIcon) return selectedIcon;
  selectedIcon = L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-end justify-center w-8 h-10 drop-shadow-md">
        <span class="absolute bottom-0 w-3 h-1.5 rounded-full bg-slate-900/30 blur-[1px]"></span>
        <svg viewBox="0 0 24 24" class="relative w-8 h-8 mb-1" aria-hidden="true">
          <path fill="#1d4ed8" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round" fill-rule="evenodd"
            d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
            clip-rule="evenodd" />
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 37],
  });
  return selectedIcon;
}
