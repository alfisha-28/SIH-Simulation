import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import SeverityBadge from '../components/common/SeverityBadge';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import ErrorState from '../components/common/ErrorState';
import EventMap from '../components/dashboard/EventMap';
import PanchayatDetailNote from '../components/common/PanchayatDetailNote';
import { formatEventType, formatTimestampUTC } from '../lib/format';

export default function EventDetail() {
  const { eventId } = useParams();
  const [eventDetail, setEventDetail] = useState(null);
  const [eventForecast, setEventForecast] = useState(null);
  const [eventRisk, setEventRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError(null);
    try {
      const [detailRes, forecastRes, riskRes] = await Promise.all([
        apiGet(`/events/${eventId}`),
        apiGet(`/events/${eventId}/forecast`),
        apiGet(`/events/${eventId}/risk`).catch(() => null), // Graceful optional fallback
      ]);
      setEventDetail(detailRes);
      setEventForecast(forecastRes);
      setEventRisk(riskRes);
      // Only remember this id once it is confirmed to exist, not on mount.
      try {
        localStorage.setItem('lastActiveEventId', eventId);
      } catch {
        // Storage may be unavailable (private mode, blocked); nav fallback still works without it.
      }
    } catch (err) {
      console.error(`Error loading event ${eventId}:`, err);
      if (err.message && err.message.includes('404')) {
        setNotFound(true);
        try {
          localStorage.removeItem('lastActiveEventId');
        } catch {
          // ignore
        }
      } else {
        setError(err.message || 'Failed to load event details.');
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

  // Derive Primary Anomaly from highest EFI value
  const primaryAnomaly = useMemo(() => {
    if (!eventDetail) return null;
    const efiMap = [
      { name: 'Rainfall EFI', key: 'rainfall', value: eventDetail.rainfall_efi, type: 'extreme_rainfall' },
      { name: 'Temperature EFI', key: 'temperature', value: eventDetail.temperature_efi, type: 'extreme_heat' },
      { name: 'Wind EFI', key: 'wind', value: eventDetail.wind_efi, type: 'high_wind' },
    ];
    return efiMap.reduce((max, item) => (item.value > max.value ? item : max), efiMap[0]);
  }, [eventDetail]);

  // Derive Peak Timestep from forecast timeline (highest intensity / severe risk)
  const peakTimestep = useMemo(() => {
    if (!eventForecast?.timeline || eventForecast.timeline.length === 0) return null;
    return eventForecast.timeline.reduce((max, step) =>
      step.intensity > max.intensity ? step : max,
      eventForecast.timeline[0]
    );
  }, [eventForecast]);

  // Derive potential impact summary label
  const getImpactLabel = (type) => {
    switch (type) {
      case 'extreme_rainfall':
        return 'Flash-flood & riverine inundation risk';
      case 'high_wind':
        return 'Gale force wind damage & sea swell risk';
      case 'extreme_heat':
        return 'Extreme heatwave & thermal stress risk';
      default:
        return 'Severe weather risk';
    }
  };

  // Consensus wording derived from the real ensemble agreement value, so the
  // narrative can never claim "high confidence" when the number says otherwise.
  const getConsensusPhrase = (agreement) => {
    if (typeof agreement !== 'number') return 'though model consensus is unavailable';
    if (agreement >= 0.85) return 'indicating strong model consensus';
    if (agreement >= 0.7) return 'indicating moderate model consensus';
    return 'though model consensus is limited';
  };

  // Render 404 / Not Found state
  if (notFound) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 text-center">
        <div className="p-12 bg-white border border-[#D9E4EE] rounded-2xl space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto text-xl font-bold font-mono">
            404
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Regional Weather System Not Found</h1>
          <p className="text-xs font-mono text-slate-500 max-w-md mx-auto">
            The requested regional forecast driver <span className="text-blue-600 font-bold">{eventId}</span> does not exist in the active forecast database.
          </p>
          <div className="pt-2">
            <Link
              to="/system"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <span aria-hidden="true">←</span> Return to System / Data
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Loading state
  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-28 bg-white border border-[#D9E4EE] rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white border border-[#D9E4EE] rounded-xl animate-pulse"></div>
          <div className="h-64 bg-white border border-[#D9E4EE] rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Render Error state
  if (error || !eventDetail) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <ErrorState
          message={`Failed to load the regional forecast driver ${eventId}.`}
          detail={error}
          onRetry={loadData}
        />
        <div className="text-center">
          <Link to="/system" className="text-xs text-blue-600 hover:underline">
            <span aria-hidden="true">←</span> Back to System / Data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/system"
          className="text-xs font-mono text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
        >
          <span aria-hidden="true">←</span> Back to System / Data
        </Link>
      </div>

      <title>{`${eventDetail.event_id} Regional Forecast Driver | WARSHA`}</title>
      <PanchayatDetailNote />

      {/* Main Header Banner */}
      <div className="bg-white border border-[#D9E4EE] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span
                className="text-xs font-mono text-blue-600 font-bold px-2 py-0.5 bg-blue-50 border border-blue-200 rounded"
                title="Regional weather system ID (backend identifier)"
              >
                {eventDetail.event_id}
              </span>
              <span className="text-xs text-slate-500 font-mono capitalize">
                Status: <strong className="text-emerald-700">{eventDetail.status}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wide">
              {formatEventType(eventDetail.type)} — {eventDetail.location_name}
            </h1>
          </div>

          {/* Badges Stack */}
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={eventDetail.severity} className="text-sm px-3 py-1" />
            <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-md font-mono text-xs text-blue-700 font-bold">
              {Math.round(eventDetail.probability * 100)}% Forecast Probability
            </div>
            <ConfidenceBadge confidence={eventDetail.confidence} className="text-sm px-3 py-1" />
          </div>
        </div>

        {/* Lead time & Detection metadata strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-1">
          <div>
            <span className="text-slate-400 block uppercase text-[10px]">Forecast Lead Time</span>
            <span className="text-slate-800 font-bold">{eventDetail.forecast_lead_time_hours} Hours</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[10px]">Detected At</span>
            <span className="text-slate-800 font-bold">
              {formatTimestampUTC(eventDetail.detected_at)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[10px]">Movement Vector</span>
            <span className="text-slate-800 font-bold">
              {eventDetail.movement_direction} @ {eventDetail.movement_speed_kmh} km/h
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[10px]">Ensemble Consensus</span>
            <span className="text-slate-800 font-bold">
              {Math.round(eventDetail.ensemble_agreement * 100)}% Agreement
            </span>
          </div>
        </div>
      </div>

      {/* Grid Layout: Detection Explanation & Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Explanation Box */}
        <div className="bg-white border border-[#D9E4EE] rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Forecast Signal — Why Flagged?
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Extreme Forecast Index (EFI) anomaly breakdown against 20-year climatological normal.
            </p>
          </div>

          {/* EFI Comparison Bars */}
          <div className="space-y-4">
            {/* Rainfall EFI */}
            <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-700 font-semibold flex items-center gap-2">
                  Rainfall Anomaly (EFI)
                  {primaryAnomaly?.key === 'rainfall' && (
                    <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase rounded">
                      PRIMARY ANOMALY
                    </span>
                  )}
                </span>
                <span className="text-slate-800 font-bold font-mono">{eventDetail.rainfall_efi.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${eventDetail.rainfall_efi * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Temperature EFI */}
            <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-700 font-semibold flex items-center gap-2">
                  Temperature Anomaly (EFI)
                  {primaryAnomaly?.key === 'temperature' && (
                    <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase rounded">
                      PRIMARY ANOMALY
                    </span>
                  )}
                </span>
                <span className="text-slate-800 font-bold font-mono">{eventDetail.temperature_efi.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${eventDetail.temperature_efi * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Wind EFI */}
            <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-700 font-semibold flex items-center gap-2">
                  Wind Speed Anomaly (EFI)
                  {primaryAnomaly?.key === 'wind' && (
                    <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase rounded">
                      PRIMARY ANOMALY
                    </span>
                  )}
                </span>
                <span className="text-slate-800 font-bold font-mono">{eventDetail.wind_efi.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${eventDetail.wind_efi * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Primary Anomaly Narrative Callout */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase tracking-wide">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Forecast Signal Summary</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              This regional weather system was flagged due to a dominant <strong className="text-slate-900">{primaryAnomaly?.name}</strong> of{' '}
              <strong className="text-slate-900">{primaryAnomaly?.value?.toFixed(2)}</strong>. Multi-model ensemble agreement is at{' '}
              <strong className="text-slate-900">{Math.round(eventDetail.ensemble_agreement * 100)}%</strong>, {getConsensusPhrase(eventDetail.ensemble_agreement)} over {eventDetail.location_name}.
            </p>
          </div>
        </div>

        {/* Tracking & Trajectory Map Box */}
        <div className="bg-white border border-[#D9E4EE] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Regional Footprint & Movement
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Regional footprint and forecast path across timesteps.
              </p>
            </div>

            {/* Tracking Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-slate-400 uppercase text-[10px] block">Current Centroid</span>
                <span className="text-slate-800 font-bold">
                  {typeof eventDetail?.centroid_lat === 'number' ? eventDetail.centroid_lat.toFixed(2) : 'N/A'}°N,{' '}
                  {typeof eventDetail?.centroid_lon === 'number' ? eventDetail.centroid_lon.toFixed(2) : 'N/A'}°E
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-slate-400 uppercase text-[10px] block">Expected Peak</span>
                <span className="text-blue-600 font-bold">
                  {peakTimestep ? `${peakTimestep.timestep_label} (${peakTimestep.timestep_hours_offset}h)` : 'NOW'}
                </span>
              </div>
            </div>
          </div>

          {/* Embedded Shared EventMap Component */}
          <EventMap
            events={[eventDetail]}
            selectedEventId={eventDetail.event_id}
            selectedEventForecast={eventForecast}
            selectedTimestepIndex={0}
            onSelectEvent={() => {}}
          />
        </div>
      </div>

      {/* Impact Summary & CTAs Section */}
      <div className="bg-white border border-[#D9E4EE] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Regional Impact Summary
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assessed primary threat: <span className="text-slate-800 font-bold">{getImpactLabel(eventDetail.type)}</span>
            </p>
          </div>

          {eventRisk && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-slate-500 whitespace-nowrap">Regional Risk Snapshot:</span>
              <SeverityBadge severity={eventRisk.overall_risk} />
              <span className="text-slate-500">({eventRisk.impact_region_name})</span>
            </div>
          )}
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <Link
            to={`/events/${eventDetail.event_id}/forecast`}
            className="w-full sm:w-auto justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <span>View Regional Forecast</span>
            <span aria-hidden="true">→</span>
          </Link>

          <Link
            to={`/events/${eventDetail.event_id}/risk`}
            className="w-full sm:w-auto justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <span>View Regional Risk</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
