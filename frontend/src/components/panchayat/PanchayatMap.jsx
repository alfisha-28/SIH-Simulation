import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BLOCKS,
  DATA_BOUNDS,
  LEAD_TIMES,
  PANCHAYATS,
  getBlock,
  getBlockForecast,
  getForecast,
  getPanchayat,
} from '../../lib/panchayatData';
import SimulatedDataBadge from '../common/SimulatedDataBadge';
import MapLegend from './MapLegend';
import { formatHeatmapValue, getHeatmapColor, getHeatmapVariable } from './heatmapScales';
import { createSelectedPanchayatIcon } from './panchayatIcons';

// Reusable choropleth of the mock Panchayat forecast (lib/panchayatData.js).
//
// Props
//   mode         'downscaled' (default): one polygon per Gram Panchayat, coloured by
//                its own value. 'coarse': one polygon per block, coloured by the
//                block value shared by every GP inside it. The visible jump from
//                the fine mosaic to big blocks is the point of the demo. In coarse
//                mode the GP outlines still take hover and clicks (invisible),
//                so a click always selects a GP, never a block.
//   variable     what to colour by: 'risk' (default) | 'rainfall' | 'temperature'
//                | 'wind' | 'rainProbability' (see heatmapScales.js)
//   leadHours    0 | 6 | 12 | 24 | 48 (default 0)
//   selectedId   GP id to mark (outline + pin); null for none
//   onSelect     (gpId) => void, called on polygon click/tap
//   emphasisIds  optional array of GP ids to draw normally; every other GP is
//                greyed out. Memoise the array, a new identity each render
//                restyles all polygons.
//   height       optional CSS height (number = px). Default is a responsive
//                420 / 480 / 560 px so the caller does not have to size it.
//   showLegend / showStatus   toggle the legend and the top-right chips.
//   className    extra classes for the outer wrapper.
//
// The camera fits the dataset bounds once, on mount (MapContainer's `bounds`
// prop), and is never re-fitted when the mode, variable or lead time changes.
// Follows EventMap: leaflet.css imported here so it stays in the lazy chunk,
// wheel-zoom off, touch-drag off on phones so the page still scrolls.

// Same OpenStreetMap tiles as EventMap: key-less, and the coastline and place
// names underneath are what make the polygons checkable against real geography.
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const BOUNDS_OPTIONS = { padding: [10, 10] };

const FILL_OPACITY = 0.7;
const MUTED_FILL = '#94a3b8';

// Coarse mode: GP polygons are invisible hit targets on top of the block fill.
const HIT_STYLE = { stroke: false, fill: true, fillColor: '#000000', fillOpacity: 0 };
const HOVER_STYLE = { color: '#0f172a', weight: 2.5, opacity: 0.85, fill: false };
const SELECTED_GP_STYLE = { color: '#0f172a', weight: 3.5, opacity: 1, fill: false };
const SELECTED_GP_COARSE_STYLE = { ...SELECTED_GP_STYLE, weight: 2.5, dashArray: '5 4' };
const SELECTED_BLOCK_STYLE = { color: '#0f172a', weight: 3, opacity: 0.9, fill: false };

// Leaflet only re-measures its container on window resize. The container can
// also change size on its own (scrollbar appearing, web font swap, the layout
// switching between stacked and side by side), which would leave the tiles
// offset, so watch the element itself.
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function TooltipBody({ title, subtitle, valueLabel, value }) {
  return (
    <div className="text-xs space-y-0.5">
      <div className="font-bold text-slate-900">{title}</div>
      <div className="text-slate-500">{subtitle}</div>
      <div className="pt-0.5 font-mono text-slate-800">
        {valueLabel}: <span className="font-bold">{value}</span>
      </div>
    </div>
  );
}

export default function PanchayatMap({
  mode = 'downscaled',
  variable = 'risk',
  leadHours = 0,
  selectedId = null,
  onSelect,
  emphasisIds,
  height,
  showLegend = true,
  showStatus = true,
  className = '',
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const variableDef = getHeatmapVariable(variable);
  const isCoarse = mode === 'coarse';

  const emphasisSet = useMemo(() => (emphasisIds ? new Set(emphasisIds) : null), [emphasisIds]);

  // Style objects are memoised: react-leaflet re-applies pathOptions whenever
  // the object identity changes, so rebuilding them every render would restyle
  // every polygon on each hover.
  const { gpLayers, blockLayers } = useMemo(() => {
    const gpLayers = PANCHAYATS.map((gp) => {
      const forecast = getForecast(gp.id, leadHours, mode);
      const muted = emphasisSet ? !emphasisSet.has(gp.id) : false;
      const style = isCoarse
        ? HIT_STYLE
        : {
            color: '#ffffff',
            weight: 1.2,
            opacity: 0.95,
            fillColor: muted ? MUTED_FILL : getHeatmapColor(variable, forecast),
            fillOpacity: muted ? 0.22 : FILL_OPACITY,
          };
      return { gp, forecast, style };
    });

    const blockLayers = isCoarse
      ? BLOCKS.map((block) => {
          const forecast = getBlockForecast(block.id, leadHours);
          const muted = emphasisSet ? !block.gpIds.some((id) => emphasisSet.has(id)) : false;
          return {
            block,
            style: {
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillColor: muted ? MUTED_FILL : getHeatmapColor(variable, forecast),
              fillOpacity: muted ? 0.22 : FILL_OPACITY,
            },
          };
        })
      : [];
    return { gpLayers, blockLayers };
  }, [mode, isCoarse, variable, leadHours, emphasisSet]);

  const selected = selectedId ? getPanchayat(selectedId) : null;
  const selectedBlock = selected ? getBlock(selected.blockId) : null;
  const hovered = hoveredId && hoveredId !== selectedId ? getPanchayat(hoveredId) : null;
  const lead = LEAD_TIMES.find((l) => l.hours === leadHours);

  return (
    <div
      role="region"
      aria-label="Panchayat forecast map. Use the Panchayat selector to choose a Panchayat with the keyboard."
      className={`relative isolate w-full rounded-xl overflow-hidden border border-[#D9E4EE] shadow-sm bg-slate-200 ${
        height ? '' : 'h-[420px] sm:h-[480px] lg:h-[560px]'
      } ${className}`}
      style={height ? { height } : undefined}
    >
      {showStatus && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5 pointer-events-none">
          <SimulatedDataBadge className="bg-white/95 shadow-sm" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 border border-[#D9E4EE] shadow-sm text-[11px] font-mono font-bold text-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${isCoarse ? 'bg-amber-500' : 'bg-blue-600'}`}
              aria-hidden="true"
            />
            {isCoarse ? 'Coarse · block level' : 'Downscaled · Panchayat level'}
          </span>
          <span className="hidden sm:inline px-2.5 py-1 rounded-md bg-slate-900/85 text-white text-[11px] font-mono shadow-sm">
            Valid {lead?.label ?? `+${leadHours}h`}
            {lead ? ` · ${lead.validTime}` : ''}
          </span>
        </div>
      )}

      {showLegend && (
        <MapLegend variable={variable} className="absolute bottom-8 left-3 z-[1000] pointer-events-none" />
      )}

      <MapContainer
        bounds={DATA_BOUNDS}
        boundsOptions={BOUNDS_OPTIONS}
        zoomSnap={0.5}
        minZoom={7}
        scrollWheelZoom={false}
        dragging={!L.Browser.mobile}
        className="w-full h-full"
      >
        <InvalidateOnResize />
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} maxZoom={19} />

        {blockLayers.map(({ block, style }) => (
          <Polygon key={`block-${block.id}`} positions={block.polygon} pathOptions={style} interactive={false} />
        ))}

        {gpLayers.map(({ gp, forecast, style }) => (
          <Polygon
            key={gp.id}
            positions={gp.polygon}
            pathOptions={style}
            eventHandlers={{
              click: () => onSelect?.(gp.id),
              mouseover: () => setHoveredId(gp.id),
              mouseout: () => setHoveredId((current) => (current === gp.id ? null : current)),
            }}
          >
            <Tooltip sticky direction="top" opacity={0.96}>
              <TooltipBody
                title={gp.name}
                subtitle={
                  isCoarse
                    ? `${gp.blockName} block · one forecast for ${getBlock(gp.blockId).gpIds.length} Panchayats`
                    : `${gp.blockName} block · ${gp.districtName}`
                }
                valueLabel={variableDef.label}
                value={formatHeatmapValue(variable, forecast)}
              />
            </Tooltip>
          </Polygon>
        ))}

        {hovered && <Polygon positions={hovered.polygon} pathOptions={HOVER_STYLE} interactive={false} />}

        {isCoarse && selectedBlock && (
          <Polygon positions={selectedBlock.polygon} pathOptions={SELECTED_BLOCK_STYLE} interactive={false} />
        )}
        {selected && (
          <Polygon
            positions={selected.polygon}
            pathOptions={isCoarse ? SELECTED_GP_COARSE_STYLE : SELECTED_GP_STYLE}
            interactive={false}
          />
        )}

        {selected && (
          <Marker
            position={selected.centroid}
            icon={createSelectedPanchayatIcon()}
            interactive={false}
            keyboard={false}
            zIndexOffset={1000}
          >
            <Tooltip permanent direction="top" offset={[0, -34]} opacity={0.96}>
              <span className="text-xs font-bold text-slate-900">{selected.name}</span>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
