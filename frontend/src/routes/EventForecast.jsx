import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import SeverityBadge from '../components/common/SeverityBadge';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import ErrorState from '../components/common/ErrorState';
import TimelineSlider from '../components/common/TimelineSlider';

// Clears the remembered nav id only when it still points at this (now invalid) event,
// so a stale/404 id never keeps sending nav links back to a page that doesn't exist.
function clearActiveEventIdIfCurrent(eventId) {
  try {
    if (localStorage.getItem('lastActiveEventId') === eventId) {
      localStorage.removeItem('lastActiveEventId');
    }
  } catch {
    // storage may be blocked (private mode, disabled cookies); nav fallback still works.
  }
}

export default function EventForecast() {
  const { eventId } = useParams();
  const [eventDetail, setEventDetail] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [selectedTimestepIndex, setSelectedTimestepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
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
        clearActiveEventIdIfCurrent(eventId);
        return;
      }

      setEventDetail(detailRes);
      setForecast(forecastRes);
      setSelectedTimestepIndex(0);
      // Only remember this id as the active event once it is confirmed to resolve,
      // so nav links never get pointed at an id that turns out to be a 404.
      try {
        localStorage.setItem('lastActiveEventId', eventId);
      } catch {
        // storage may be blocked; the page itself still works without it.
      }
    } catch (err) {
      console.error(`Error loading forecast for event ${eventId}:`, err);
      if (err.message && err.message.includes('404')) {
        setNotFound(true);
        clearActiveEventIdIfCurrent(eventId);
      } else {
        setError(err.message || 'Failed to load forecast data.');
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    async function init() {
      if (eventId) {
        await loadData();
      }
    }
    init();
  }, [eventId, loadData]);

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
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
        <ErrorState
          message={`Can't load the localized forecast for ${eventId}.`}
          detail={error}
          onRetry={loadData}
        />
        <Link to="/events" className="text-xs text-blue-600 hover:underline">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const currentStep = forecast.timeline?.[selectedTimestepIndex] || forecast.timeline?.[0];
  const coarse = currentStep?.coarse || {};
  const downscaled = currentStep?.downscaled || {};

  // The headline metric depends on what kind of event this is: a rainfall event's
  // defining number is peak rainfall, but a heat or wind event has no rainfall to
  // speak of, so showing "Peak Rainfall 0 mm" as the headline for those buries the
  // number that actually matters. Pick the metric from the event type instead of
  // always defaulting to rainfall.
  const HEADLINE_BY_TYPE = {
    extreme_heat: { label: 'Temperature', unit: '°C', coarseValue: coarse.temperature_c, downscaledValue: downscaled.temperature_c },
    high_wind: { label: 'Wind Speed', unit: 'km/h', coarseValue: coarse.wind_speed_kmh, downscaledValue: downscaled.wind_speed_kmh },
  };
  const headline = HEADLINE_BY_TYPE[eventDetail?.type] || {
    label: 'Rainfall',
    unit: 'mm',
    coarseValue: coarse.rainfall_mm,
    downscaledValue: downscaled.peak_rainfall_mm,
  };

  // The coarse field is a grid average, not a peak, so this is a peak-vs-average
  // comparison rather than a true like-for-like delta. No calculation change is
  // made here (the coarse schema has no peak value to compare against); instead
  // the label below names the average explicitly instead of just saying "coarse".
  const headlineDelta =
    headline.downscaledValue != null && headline.coarseValue != null
      ? (headline.downscaledValue - headline.coarseValue).toFixed(1)
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="whitespace-nowrap text-xs font-mono text-blue-600 font-bold px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                {eventId}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                DOWNSCALING MODEL: <strong className="text-slate-800">Conditional Diffusion (12km to 5km)</strong>
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

        {/* Downscaling Highlights: these have no coarse-panel counterpart, so they
            get their own full-width strip instead of being squeezed inside the
            right (downscaled) panel where they used to sit opposite the coarse
            panel's grid metaphor instead of lining up with anything comparable. */}
        <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider font-mono mb-3">
            Downscaling Highlights
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Peak {headline.label}</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black text-slate-900">
                  {headline.downscaledValue ?? 'N/A'}
                </span>
                <span className="text-[10px] text-slate-500">{headline.unit}</span>
              </div>
              {headlineDelta && Number(headlineDelta) > 0 && (
                <span className="text-[10px] font-bold text-red-600 block">
                  +{headlineDelta} {headline.unit} vs 12 km grid avg
                </span>
              )}
            </div>

            {eventDetail?.type === 'extreme_rainfall' && (
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
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Extreme Preservation</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black text-slate-900">
                  {downscaled.extreme_preservation_pct != null
                    ? `${downscaled.extreme_preservation_pct}%`
                    : 'N/A'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">Tail fidelity</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Model Confidence</span>
              <div className="pt-1">
                <ConfidenceBadge confidence={downscaled.model_confidence} label={null} />
              </div>
              <span className="text-[10px] text-slate-500 block pt-0.5">Ensemble metric</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Panel: COARSE FORECAST (12 km) */}
          <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-6">
            {/* Panel Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 relative z-10">
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
              <span className="whitespace-nowrap shrink-0 px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold font-mono">
                ~12 km Resolution
              </span>
            </div>

            {/* Visual Grid Stand-in Metaphor (Coarse - Blurry/Soft) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative z-10">
              <div className="flex flex-wrap justify-between gap-1 text-[11px] font-mono text-slate-500">
                <span>Spatial Grid Metaphor (Coarse 4x4)</span>
                <span>{headline.label} Grid Avg: {headline.coarseValue ?? 'N/A'}{headline.coarseValue != null ? ` ${headline.unit}` : ''}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 aspect-square w-full max-w-[16rem] mx-auto p-2 bg-white rounded-lg border border-slate-200 filter blur-[0.5px]">
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
                      {isCenter ? `${headline.coarseValue ?? 'N/A'}` : '12km'}
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9E4EE] pb-4 relative z-10">
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
              <span className="whitespace-nowrap shrink-0 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold font-mono shadow-sm">
                ~5 km Resolution
              </span>
            </div>

            {/* Visual Grid Stand-in Metaphor (Fine - Crisp/High Contrast) */}
            <div className="p-4 bg-slate-50 border border-[#D9E4EE] rounded-xl space-y-3 relative z-10">
              <div className="flex flex-wrap justify-between gap-1 text-[11px] font-mono text-slate-500">
                <span>Spatial Grid Metaphor (Fine 8x8 Sharp Grid)</span>
                <span className="font-bold text-red-600">Localized Peak: {headline.downscaledValue ?? 'N/A'}{headline.downscaledValue != null ? ` ${headline.unit}` : ''}</span>
              </div>
              <div className="grid grid-cols-8 gap-1 aspect-square w-full max-w-[16rem] mx-auto p-2 bg-white border border-slate-200 rounded-lg">
                {[...Array(64)].map((_, i) => {
                  const isHotspot = [27, 28, 35, 36].includes(i);
                  const isNear = [18, 19, 20, 21, 26, 29, 34, 37, 42, 43, 44, 45].includes(i);
                  return (
                    <div
                      key={i}
                      className={`rounded-sm transition-all flex items-center justify-center text-[9px] font-mono ${
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

            {/* Downscaled Metrics Grid: same six fields, in the same order, as the
                coarse panel's Data Metrics Grid above, so each metric lands on the
                same row on both sides of the comparison. */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs relative z-10 text-slate-800">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Rainfall (Area Avg)</span>
                <span className="text-lg font-bold text-slate-800">
                  {downscaled.rainfall_mm != null ? `${downscaled.rainfall_mm} mm` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Temperature</span>
                <span className="text-lg font-bold text-slate-800">
                  {downscaled.temperature_c != null ? `${downscaled.temperature_c} °C` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Wind Speed</span>
                <span className="text-lg font-bold text-slate-800">
                  {downscaled.wind_speed_kmh != null ? `${downscaled.wind_speed_kmh} km/h` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Pressure</span>
                <span className="text-lg font-bold text-slate-800">
                  {downscaled.pressure_hpa != null ? `${downscaled.pressure_hpa} hPa` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Humidity</span>
                <span className="text-lg font-bold text-slate-800">
                  {downscaled.humidity_pct != null ? `${downscaled.humidity_pct} %` : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Extreme Index (EFI)</span>
                <span className="text-lg font-bold text-slate-800">
                  {downscaled.efi != null ? downscaled.efi.toFixed(2) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
