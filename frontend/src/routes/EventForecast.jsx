import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import SeverityBadge from '../components/common/SeverityBadge';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import TimelineSlider from '../components/common/TimelineSlider';

export default function EventForecast() {
  const { eventId } = useParams();
  const [eventDetail, setEventDetail] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [selectedTimestepIndex, setSelectedTimestepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  // Sync eventId to localStorage on mount
  useEffect(() => {
    if (eventId) {
      localStorage.setItem('lastActiveEventId', eventId);
    }
  }, [eventId]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setNotFound(false);
      setError(null);
      try {
        const [detailRes, forecastRes] = await Promise.all([
          apiGet(`/events/${eventId}`).catch(() => null),
          apiGet(`/events/${eventId}/forecast`),
        ]);

        if (!forecastRes || !forecastRes.timeline) {
          setNotFound(true);
          return;
        }

        setEventDetail(detailRes);
        setForecast(forecastRes);
        setSelectedTimestepIndex(0);
      } catch (err) {
        console.error(`Error loading forecast for event ${eventId}:`, err);
        if (err.message && err.message.includes('404')) {
          setNotFound(true);
        } else {
          setError(`Failed to load localized forecast data for ${eventId}: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const formatEventType = (type) => {
    return (type || '').replace('_', ' ').toUpperCase();
  };

  // Render 404 / Not Found state
  if (notFound) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 text-center">
        <div className="p-12 bg-white border border-[#D9E4EE] rounded-2xl space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto text-xl font-bold font-mono">
            404
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Event Forecast Not Found</h1>
          <p className="text-xs font-mono text-slate-500 max-w-md mx-auto">
            No active downscaled forecast matching identifier <span className="text-blue-600 font-bold">{eventId}</span> was found.
          </p>
          <div className="pt-2">
            <Link
              to="/events"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              ← Return to Events Explorer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Loading state
  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-24 bg-white border border-[#D9E4EE] rounded-xl animate-pulse"></div>
        <div className="h-32 bg-white border border-[#D9E4EE] rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-white border border-[#D9E4EE] rounded-xl animate-pulse"></div>
          <div className="h-96 bg-white border border-[#D9E4EE] rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Render Error state
  if (error || !forecast) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-mono">
          {error || 'Failed to load forecast data.'}
        </div>
        <Link to="/events" className="text-xs text-blue-600 hover:underline">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const currentStep = forecast.timeline?.[selectedTimestepIndex] || forecast.timeline?.[0];
  const coarse = currentStep?.coarse || {};
  const downscaled = currentStep?.downscaled || {};

  // Calculate delta if rainfall values are present
  const rainfallDelta =
    downscaled.peak_rainfall_mm !== undefined && coarse.rainfall_mm !== undefined
      ? (downscaled.peak_rainfall_mm - coarse.rainfall_mm).toFixed(1)
      : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Navigation Breadcrumbs & Cross-links */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <Link to="/events" className="hover:text-blue-600 transition-colors">
            Events
          </Link>
          <span>/</span>
          <Link to={`/events/${eventId}`} className="hover:text-blue-600 transition-colors text-slate-700">
            {eventId}
          </Link>
          <span>/</span>
          <span className="text-blue-600 font-bold">Localized Forecast</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/events/${eventId}`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            ← Event Overview
          </Link>
          <Link
            to={`/events/${eventId}/risk`}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
          >
            <span>Risk Assessment</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white border border-[#D9E4EE] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono text-blue-600 font-bold px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                {eventId}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                DOWNSCALING MODEL: <strong className="text-slate-800">ECMWF IFS 12km → HR-Neural 5km</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wide">
              Localized High-Resolution Forecast
              {eventDetail && <span className="text-slate-500 font-normal"> — {eventDetail.location_name} ({formatEventType(eventDetail.type)})</span>}
            </h1>
          </div>

          {eventDetail && (
            <div className="flex items-center space-x-3">
              <SeverityBadge severity={eventDetail.severity} className="text-sm px-3 py-1" />
              <ConfidenceBadge confidence={eventDetail.confidence} className="text-sm px-3 py-1" />
            </div>
          )}
        </div>

        {/* Timestep info strip */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-500 gap-2">
          <div>
            Active Timestep Target: <strong className="text-blue-600 font-bold">{currentStep?.timestep_label}</strong> ({currentStep?.timestep_hours_offset}h offset)
          </div>
          <div>
            Lat/Lon Centroid: <strong className="text-slate-800">{currentStep?.centroid?.lat?.toFixed(2)}°N, {currentStep?.centroid?.lon?.toFixed(2)}°E</strong>
          </div>
          <div>
            Uncertainty Radius: <strong className="text-slate-800">{currentStep?.uncertainty_radius_km} km</strong>
          </div>
        </div>
      </div>

      {/* Explanatory Concept Banner */}
      <div className="bg-white border border-[#D9E4EE] rounded-xl p-5 shadow-sm flex items-start space-x-4">
        <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-600 shrink-0 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="space-y-1 text-xs text-slate-700">
          <h3 className="font-bold text-blue-700 uppercase tracking-wider font-mono">
            Targeted Resolution Downscaling — 12 km → 5 km Anomaly Focus
          </h3>
          <p className="leading-relaxed font-sans text-slate-600">
            Rather than running computationally expensive high-resolution forecasting across the entire global domain, our system dynamically focuses 5 km regional neural-downscaling specifically on the localized region surrounding a detected anomaly. This uncovers fine-scale extreme intensities, localized peak rainfall rates, and terrain-channeled winds that coarse 12 km global models smooth out.
          </p>
        </div>
      </div>

      {/* Timestep Slider Component */}
      <TimelineSlider
        timeline={forecast.timeline}
        selectedIndex={selectedTimestepIndex}
        onSelectIndex={setSelectedTimestepIndex}
        title="Forecast Progression & Downscaled Timesteps"
      />

      {/* Side-by-Side Comparison Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></span>
            Resolution Comparison ({currentStep?.timestep_label})
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Coarse (12 km) vs High-Resolution (5 km)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: COARSE FORECAST (12 km) */}
          <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-6">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 relative z-10">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Coarse Forecast
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Standard Global Operational Model
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold font-mono">
                ~12 km Resolution
              </span>
            </div>

            {/* Visual Grid Stand-in Metaphor (Coarse - Blurry/Soft) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative z-10">
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Spatial Grid Metaphor (Coarse 4x4)</span>
                <span>Smoothed Peak: {coarse.rainfall_mm ?? 'N/A'} mm</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-28 p-2 bg-white rounded-lg border border-slate-200 filter blur-[0.5px]">
                {[...Array(16)].map((_, i) => {
                  const isCenter = [5, 6, 9, 10].includes(i);
                  return (
                    <div
                      key={i}
                      className={`rounded flex items-center justify-center text-[9px] font-mono transition-all ${
                        isCenter
                          ? 'bg-amber-50 border border-amber-200 text-amber-700 font-bold'
                          : 'bg-slate-50 border border-slate-100 text-slate-400'
                      }`}
                    >
                      {isCenter ? `${coarse.rainfall_mm || 95}` : '12km'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs relative z-10 text-slate-800">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Rainfall (Grid Avg)</span>
                <span className="text-lg font-bold text-slate-800">
                  {coarse.rainfall_mm !== undefined ? `${coarse.rainfall_mm} mm` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Temperature</span>
                <span className="text-lg font-bold text-slate-800">
                  {coarse.temperature_c !== undefined ? `${coarse.temperature_c} °C` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Wind Speed</span>
                <span className="text-lg font-bold text-slate-800">
                  {coarse.wind_speed_kmh !== undefined ? `${coarse.wind_speed_kmh} km/h` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Pressure</span>
                <span className="text-lg font-bold text-slate-800">
                  {coarse.pressure_hpa !== undefined ? `${coarse.pressure_hpa} hPa` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Humidity</span>
                <span className="text-lg font-bold text-slate-800">
                  {coarse.humidity_pct !== undefined ? `${coarse.humidity_pct} %` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Extreme Index (EFI)</span>
                <span className="text-lg font-bold text-slate-800">
                  {coarse.efi !== undefined ? coarse.efi.toFixed(2) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: DOWNSCALED FORECAST (5 km) */}
          <div className="bg-white border border-blue-300 rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-6">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-[#D9E4EE] pb-4 relative z-10">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                  <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider">
                    Downscaled Forecast
                  </h3>
                </div>
                <p className="text-[11px] text-blue-600 font-mono mt-0.5">
                  High-Resolution Regional Anomaly Downscaler
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold font-mono shadow-sm">
                ~5 km Resolution
              </span>
            </div>

            {/* Highlighted Key Downscaling Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs relative z-10">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Peak Rainfall</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-black text-slate-900">
                    {downscaled.peak_rainfall_mm ?? 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-500">mm</span>
                </div>
                {rainfallDelta && Number(rainfallDelta) > 0 && (
                  <span className="text-[10px] font-bold text-red-600 block">
                    +{rainfallDelta} mm vs coarse
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Max Intensity</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-black text-slate-900">
                    {downscaled.max_intensity_mmhr ?? 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-500">mm/h</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Peak hourly rate</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Extreme Preservation</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-black text-slate-900">
                    {downscaled.extreme_preservation_pct !== undefined
                      ? `${downscaled.extreme_preservation_pct}%`
                      : 'N/A'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">Tail fidelity</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Model Confidence</span>
                <div className="pt-1">
                  <ConfidenceBadge confidence={downscaled.model_confidence} />
                </div>
                <span className="text-[10px] text-slate-500 block pt-0.5">Ensemble metric</span>
              </div>
            </div>

            {/* Visual Grid Stand-in Metaphor (Fine - Crisp/High Contrast) */}
            <div className="p-4 bg-slate-50 border border-[#D9E4EE] rounded-xl space-y-3 relative z-10">
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Spatial Grid Metaphor (Fine 8x8 Sharp Grid)</span>
                <span className="font-bold text-red-600">Localized Peak: {downscaled.peak_rainfall_mm} mm</span>
              </div>
              <div className="grid grid-cols-8 gap-1 h-28 p-2 bg-white border border-slate-200 rounded-lg">
                {[...Array(64)].map((_, i) => {
                  const isHotspot = [27, 28, 35, 36].includes(i);
                  const isNear = [18, 19, 20, 21, 26, 29, 34, 37, 42, 43, 44, 45].includes(i);
                  return (
                    <div
                      key={i}
                      className={`rounded-sm transition-all flex items-center justify-center text-[7px] font-mono ${
                        isHotspot
                          ? 'bg-red-500 border border-red-300 text-white font-bold animate-pulse shadow-sm'
                          : isNear
                          ? 'bg-amber-100 border border-amber-200 text-amber-700'
                          : 'bg-slate-50 border border-slate-100 text-slate-400'
                      }`}
                    >
                      {isHotspot ? '5k' : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Downscaled Secondary Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs relative z-10 text-slate-800">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Area Avg Rainfall</span>
                <span className="text-base font-bold text-slate-800">
                  {downscaled.rainfall_mm !== undefined ? `${downscaled.rainfall_mm} mm` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Downscaled Temp</span>
                <span className="text-base font-bold text-slate-800">
                  {downscaled.temperature_c !== undefined ? `${downscaled.temperature_c} °C` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Downscaled Wind</span>
                <span className="text-base font-bold text-slate-800">
                  {downscaled.wind_speed_kmh !== undefined ? `${downscaled.wind_speed_kmh} km/h` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Downscaled EFI</span>
                <span className="text-base font-bold text-slate-800">
                  {downscaled.efi !== undefined ? downscaled.efi.toFixed(2) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
