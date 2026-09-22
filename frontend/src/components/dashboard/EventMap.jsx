import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  Rectangle,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { createEventIcon, createTrajectoryStepIcon } from './mapIcons';

const parseLatLng = (lat, lon) => {
  const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
  const numLon = typeof lon === 'string' ? parseFloat(lon) : lon;
  if (
    typeof numLat === 'number' &&
    !isNaN(numLat) &&
    typeof numLon === 'number' &&
    !isNaN(numLon) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLon >= -180 &&
    numLon <= 180
  ) {
    return [numLat, numLon];
  }
  return null;
};

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      Array.isArray(center) &&
      center.length === 2 &&
      typeof center[0] === 'number' &&
      !isNaN(center[0]) &&
      typeof center[1] === 'number' &&
      !isNaN(center[1])
    ) {
      map.panTo(center, { animate: true, duration: 1 });
    }
  }, [center, map]);
  return null;
}

export default function EventMap({
  events = [],
  selectedEventId,
  selectedEventForecast,
  selectedTimestepIndex = 0,
  onSelectEvent,
}) {
  const selectedEvent = (events || []).find((e) => e && e.event_id === selectedEventId);
  const timeline = selectedEventForecast?.timeline || [];
  const currentStep = timeline[selectedTimestepIndex] || null;

  // Trajectory polyline coordinates
  const trajectoryPositions = timeline
    .map((step) => parseLatLng(step?.centroid?.lat, step?.centroid?.lon))
    .filter(Boolean);

  // Center position for map pan
  const DEFAULT_CENTER = [21.5, 74.0];
  const selectedPos = selectedEvent
    ? parseLatLng(selectedEvent.centroid_lat, selectedEvent.centroid_lon)
    : null;

  const validEvents = (events || []).filter(
    (evt) => evt && parseLatLng(evt.centroid_lat, evt.centroid_lon) !== null
  );

  const fallbackPos =
    validEvents.length > 0
      ? parseLatLng(validEvents[0].centroid_lat, validEvents[0].centroid_lon)
      : null;

  const mapCenter = selectedPos || fallbackPos || DEFAULT_CENTER;

  const currentStepPos = currentStep
    ? parseLatLng(currentStep.centroid?.lat, currentStep.centroid?.lon)
    : null;

  const sw = currentStep?.bbox
    ? parseLatLng(currentStep.bbox.min_lat, currentStep.bbox.min_lon)
    : null;
  const ne = currentStep?.bbox
    ? parseLatLng(currentStep.bbox.max_lat, currentStep.bbox.max_lon)
    : null;
  const bboxBounds = sw && ne ? [sw, ne] : null;

  return (
    <div className="relative w-full h-[450px] sm:h-[500px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Map status overlay badge */}
      <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 border border-slate-700/60 backdrop-blur px-3 py-1.5 rounded-md text-xs font-mono text-slate-300 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>LIVE RADAR / TILE MAP</span>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapRecenter center={mapCenter} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          className="dark-tile-layer"
        />

        {/* All Active Event Markers */}
        {validEvents.map((evt) => {
          const isSelected = evt.event_id === selectedEventId;
          const pos = parseLatLng(evt.centroid_lat, evt.centroid_lon);
          if (!pos) return null;
          return (
            <Marker
              key={evt.event_id}
              position={pos}
              icon={createEventIcon(evt.severity, isSelected)}
              eventHandlers={{
                click: () => onSelectEvent && onSelectEvent(evt.event_id),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-xs space-y-1">
                  <div className="font-bold uppercase tracking-wider text-slate-900">
                    {evt.event_id} — {evt.location_name || 'Unknown Location'}
                  </div>
                  <div className="capitalize text-slate-600">
                    {(evt.type || '').replace('_', ' ')}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px] pt-1 border-t border-slate-200">
                    <span
                      className={`font-semibold uppercase ${
                        evt.severity === 'severe'
                          ? 'text-red-600'
                          : evt.severity === 'moderate'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {evt.severity || 'info'}
                    </span>
                    <span className="text-slate-500">
                      {Math.round((evt.probability || 0) * 100)}% prob
                    </span>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Trajectory Polyline for Selected Event */}
        {trajectoryPositions.length > 1 && (
          <Polyline
            positions={trajectoryPositions}
            pathOptions={{
              color: '#60a5fa',
              weight: 3,
              dashArray: '6, 6',
              opacity: 0.85,
            }}
          />
        )}

        {/* Trajectory Waypoint Markers */}
        {timeline.map((step, idx) => {
          const pos = parseLatLng(step?.centroid?.lat, step?.centroid?.lon);
          if (!pos) return null;
          const isCurrent = idx === selectedTimestepIndex;
          return (
            <Marker
              key={`tp-${step.timestep_label || idx}`}
              position={pos}
              icon={createTrajectoryStepIcon(isCurrent)}
            >
              <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9}>
                <div className="text-[11px] font-mono text-slate-700">
                  {step.timestep_label || `Step ${idx}`} (Offset: {step.timestep_hours_offset ?? 0}h)
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Uncertainty Region Circle for Selected Timestep */}
        {currentStepPos && currentStep?.uncertainty_radius_km > 0 && (
          <Circle
            center={currentStepPos}
            radius={currentStep.uncertainty_radius_km * 1000}
            pathOptions={{
              color: '#60a5fa',
              fillColor: '#60a5fa',
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* Bounding Box Rectangle for Selected Timestep */}
        {bboxBounds && (
          <Rectangle
            bounds={bboxBounds}
            pathOptions={{
              color: '#cbd5e1',
              fillColor: '#cbd5e1',
              fillOpacity: 0.05,
              weight: 1.5,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
