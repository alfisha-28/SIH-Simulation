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

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
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
  const selectedEvent = events.find((e) => e.event_id === selectedEventId);
  const timeline = selectedEventForecast?.timeline || [];
  const currentStep = timeline[selectedTimestepIndex] || null;

  // Trajectory polyline coordinates
  const trajectoryPositions = timeline.map((step) => [
    step.centroid.lat,
    step.centroid.lon,
  ]);

  // Center position for map pan
  const mapCenter = selectedEvent
    ? [selectedEvent.centroid_lat, selectedEvent.centroid_lon]
    : [21.5, 74.0];

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* All Active Event Markers */}
        {events.map((evt) => {
          const isSelected = evt.event_id === selectedEventId;
          return (
            <Marker
              key={evt.event_id}
              position={[evt.centroid_lat, evt.centroid_lon]}
              icon={createEventIcon(evt.severity, isSelected)}
              eventHandlers={{
                click: () => onSelectEvent(evt.event_id),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-xs space-y-1">
                  <div className="font-bold uppercase tracking-wider text-slate-200">
                    {evt.event_id} — {evt.location_name}
                  </div>
                  <div className="capitalize text-slate-300">
                    {evt.type.replace('_', ' ')}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px] pt-1 border-t border-slate-700">
                    <span
                      className={`font-semibold uppercase ${
                        evt.severity === 'severe'
                          ? 'text-red-400'
                          : evt.severity === 'moderate'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {evt.severity}
                    </span>
                    <span className="text-slate-400">
                      {Math.round(evt.probability * 100)}% prob
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
              color: '#06b6d4',
              weight: 3,
              dashArray: '6, 6',
              opacity: 0.85,
            }}
          />
        )}

        {/* Trajectory Waypoint Markers */}
        {timeline.map((step, idx) => {
          const isCurrent = idx === selectedTimestepIndex;
          return (
            <Marker
              key={`tp-${step.timestep_label}`}
              position={[step.centroid.lat, step.centroid.lon]}
              icon={createTrajectoryStepIcon(isCurrent)}
            >
              <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9}>
                <div className="text-[11px] font-mono text-cyan-300">
                  {step.timestep_label} (Offset: {step.timestep_hours_offset}h)
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Uncertainty Region Circle for Selected Timestep */}
        {currentStep && (
          <Circle
            center={[currentStep.centroid.lat, currentStep.centroid.lon]}
            radius={currentStep.uncertainty_radius_km * 1000}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#0891b2',
              fillOpacity: 0.18,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* Bounding Box Rectangle for Selected Timestep */}
        {currentStep && currentStep.bbox && (
          <Rectangle
            bounds={[
              [currentStep.bbox.min_lat, currentStep.bbox.min_lon],
              [currentStep.bbox.max_lat, currentStep.bbox.max_lon],
            ]}
            pathOptions={{
              color: '#f43f5e',
              fillColor: '#f43f5e',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
