import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import SeverityBadge from '../components/common/SeverityBadge';
import PanchayatDetailNote from '../components/common/PanchayatDetailNote';
import ErrorState from '../components/common/ErrorState';
import TimelineSlider from '../components/common/TimelineSlider';
import { formatEventType, formatTimestampUTC } from '../lib/format';

export default function EventRisk() {
  const { eventId } = useParams();
  const [eventDetail, setEventDetail] = useState(null);
  const [forecastTimeline, setForecastTimeline] = useState([]);
  const [forecastUnavailable, setForecastUnavailable] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [selectedTimestepIndex, setSelectedTimestepIndex] = useState(0);
  const selectedTimestepIndexRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskFetchError, setRiskFetchError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    selectedTimestepIndexRef.current = selectedTimestepIndex;
  }, [selectedTimestepIndex]);

  // Initial load: Fetch event detail, forecast timeline, and initial risk snapshot
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError(null);
    setRiskFetchError(null);
    try {
      const [detailRes, forecastRes, riskRes] = await Promise.all([
        apiGet(`/events/${eventId}`).catch(() => null),
        apiGet(`/events/${eventId}/forecast`).catch(() => null),
        apiGet(`/events/${eventId}/risk`),
      ]);

      if (!riskRes) {
        setNotFound(true);
        // Event does not exist: don't leave a stale nav shortcut pointing at it
        try {
          if (localStorage.getItem('lastActiveEventId') === eventId) {
            localStorage.removeItem('lastActiveEventId');
          }
        } catch {
          // storage may be blocked (private mode); non-fatal
        }
        return;
      }

      // Event is confirmed to exist, safe to remember as the last active one
      try {
        localStorage.setItem('lastActiveEventId', eventId);
      } catch {
        // storage may be blocked (private mode); non-fatal
      }

      setEventDetail(detailRes);
      if (forecastRes?.timeline?.length) {
        setForecastTimeline(forecastRes.timeline);
        setForecastUnavailable(false);
      } else {
        // Forecast is genuinely unavailable; show an honest empty state
        // instead of inventing a probability timeline.
        setForecastTimeline([]);
        setForecastUnavailable(true);
      }
      setRiskData(riskRes);
      setSelectedTimestepIndex(0);
    } catch (err) {
      console.error(`Error loading risk assessment for event ${eventId}:`, err);
      if (err.message && err.message.includes('404')) {
        setNotFound(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    async function init() {
      if (eventId) {
        await loadInitialData();
      }
    }
    init();
  }, [eventId, loadInitialData]);

  // Timestep selection refetch handler for GET /events/{eventId}/risk?timestep={label}
  const handleSelectTimestep = useCallback(async (index) => {
    const targetStep = forecastTimeline[index];
    if (!targetStep?.timestep_label) return;

    const previousIndex = selectedTimestepIndexRef.current;
    setSelectedTimestepIndex(index);
    setLoadingRisk(true);
    setRiskFetchError(null);
    try {
      // Encode label to handle leading '+'
      const labelQuery = encodeURIComponent(targetStep.timestep_label);
      const updatedRisk = await apiGet(`/events/${eventId}/risk?timestep=${labelQuery}`);
      setRiskData(updatedRisk);
    } catch (err) {
      console.error(`Failed to fetch risk for timestep ${targetStep.timestep_label}:`, err);
      // Roll the selection back so the label never claims a horizon the
      // displayed risk numbers do not belong to.
      setSelectedTimestepIndex(previousIndex);
      setRiskFetchError(`Could not update risk for ${targetStep.timestep_label}.`);
    } finally {
      setLoadingRisk(false);
    }
  }, [eventId, forecastTimeline]);

  // Render 404 / Not Found state
  if (notFound) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 text-center">
        <div className="p-12 bg-white border border-[#D9E4EE] rounded-2xl space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto text-xl font-bold font-mono">
            404
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Risk Snapshot Not Found</h1>
          <p className="text-xs font-mono text-slate-500 max-w-md mx-auto">
            No active risk assessment matching identifier <span className="text-blue-600 font-bold">{eventId}</span> was found in the decision engine.
          </p>
          <div className="pt-2">
            <Link
              to="/system"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              ← Return to System / Data
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
        <div className="h-64 bg-white border border-[#D9E4EE] rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // Render Error state
  if (error || !riskData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
        <ErrorState
          message="Can't load the regional impact and risk assessment for this weather system."
          detail={error}
          onRetry={loadInitialData}
        />
        <Link to="/system" className="text-xs text-blue-600 hover:underline">
          ← Back to System / Data
        </Link>
      </div>
    );
  }

  // Drive every label from the risk data actually on screen, not from
  // whichever step the slider happens to be sitting on mid fetch.
  const currentStepLabel =
    riskData.timestep_label || forecastTimeline[selectedTimestepIndex]?.timestep_label || 'Unknown';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Navigation Breadcrumbs & Cross-links */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <Link to="/system" className="hover:text-blue-600 transition-colors">
            System / Data
          </Link>
          <span>/</span>
          <Link to={`/events/${eventId}`} className="hover:text-blue-600 transition-colors text-slate-700">
            {eventId}
          </Link>
          <span>/</span>
          <span className="text-blue-600 font-bold">Regional Risk</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/events/${eventId}`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            ← Regional Overview
          </Link>
          <Link
            to={`/events/${eventId}/forecast`}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            ← Regional Forecast
          </Link>
        </div>
      </div>

      <title>{`${eventId} Regional Risk | WARSHA`}</title>
      <PanchayatDetailNote />

      {/* Main Header Banner */}
      <div className="bg-white border border-[#D9E4EE] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs font-mono text-blue-600 font-bold px-2 py-0.5 bg-blue-50 border border-blue-200 rounded whitespace-nowrap">
                {eventId}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                IMPACT ASSESSMENT: <strong className="text-slate-800">{riskData.impact_region_name}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wide">
              Regional Risk & Impact Analysis
              {eventDetail && <span className="text-slate-500 font-normal"> — {eventDetail.location_name} ({formatEventType(eventDetail.type)})</span>}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-500">Timestep Snapshot:</span>
            <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded font-mono font-bold text-xs text-blue-700">
              {currentStepLabel}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-sans leading-relaxed">
          Translating raw meteorological ensemble data into operational impact thresholds, multi-hazard risk probabilities, and critical disruption timelines.
        </p>
      </div>

      {forecastUnavailable && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono text-amber-800">
          <span>Forecast timeline unavailable, showing current risk only.</span>
          <button
            onClick={loadInitialData}
            className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Shared Timestep Selector Component */}
      <TimelineSlider
        timeline={forecastTimeline}
        selectedIndex={selectedTimestepIndex}
        onSelectIndex={handleSelectTimestep}
        title="Interactive Timestep Risk Evaluator"
      />

      {/* Main Content Grid: Prominent Overall Risk & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Prominent Overall Risk Banner (1 Col) */}
        <div className="lg:col-span-1 bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
                Overall Risk Assessment ({currentStepLabel})
              </h2>
            </div>

            <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 lg:block lg:space-y-6">
              {/* Large Prominent Overall Risk Display */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3 shadow-inner">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                  Composite Risk Level
                </span>

                <div className="py-2">
                  <SeverityBadge
                    severity={riskData.overall_risk}
                    className="text-2xl px-6 py-2.5 shadow-sm tracking-widest"
                  />
                </div>

                <div className="text-xs font-mono text-slate-500 pt-2 border-t border-slate-200">
                  Evaluating <span className="text-blue-600 font-bold">{currentStepLabel}</span> Forecast Horizon
                </div>
              </div>

              {/* Spatial Footprint Metrics */}
              <div className="space-y-3 font-mono text-xs text-slate-800">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Impact Region Target</span>
                  <span className="text-sm font-bold text-slate-800 block">
                    {riskData.impact_region_name}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Estimated Impact Radius</span>
                  <span className="text-lg font-bold text-blue-600">
                    {riskData.impact_radius_km} km
                  </span>
                </div>
              </div>
            </div>
          </div>

          {loadingRisk && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center text-blue-600 font-mono text-xs z-20">
              <span className="animate-pulse">Updating Risk Model...</span>
            </div>
          )}
        </div>

        {/* Right Column: Risk Category Breakdown Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-6 relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Multi-Hazard Risk Category Breakdown
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Quantified probability and severity level per primary environmental hazard.
              </p>
            </div>
            {loadingRisk && (
              <span className="text-xs font-mono text-blue-600 animate-pulse">Refreshing...</span>
            )}
            {!loadingRisk && riskFetchError && (
              <span className="text-xs font-mono text-red-600">{riskFetchError}</span>
            )}
          </div>

          {/* Risk Categories Table / Card List */}
          <div className="space-y-4 text-slate-800">
            {/* Flood Risk Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white text-slate-500 border border-slate-200 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Flood & Inundation Risk
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Flash flooding, urban drainage overload, and riverine rise
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <SeverityBadge severity={riskData.flood_risk_level} />
                  <span className="text-sm font-mono font-bold text-slate-900 min-w-[50px] text-right">
                    {Math.round(riskData.flood_risk_probability * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${riskData.flood_risk_probability * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Wind Risk Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white text-slate-500 border border-slate-200 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.75 19.5v-.75a1.5 1.5 0 00-1.5-1.5H3m14.25-4.5h-15.75m18-4.5h-16.5m18.75 0a2.25 2.25 0 100-4.5h-1.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Wind Damage Risk
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Structural damage, fallen powerlines, gale gusts & coastal sea swell
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <SeverityBadge severity={riskData.wind_risk_level} />
                  <span className="text-sm font-mono font-bold text-slate-900 min-w-[50px] text-right">
                    {Math.round(riskData.wind_risk_probability * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${riskData.wind_risk_probability * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Heat Risk Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white text-slate-500 border border-slate-200 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Thermal Stress & Heat Risk
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Extreme heatwave conditions, grid overload & thermal discomfort
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <SeverityBadge severity={riskData.heat_risk_level} />
                  <span className="text-sm font-mono font-bold text-slate-900 min-w-[50px] text-right">
                    {Math.round(riskData.heat_risk_probability * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${riskData.heat_risk_probability * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Impact Timeline Window Section */}
      <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Critical Disruption Time Windows
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Operational window boundaries for emergency planning and asset protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs text-slate-800">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">
              1. Expected Onset / Start Time
            </span>
            <span className="text-sm font-bold text-slate-800 block">
              {formatTimestampUTC(riskData.expected_start)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Initial impact boundary
            </span>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
            <span className="text-[10px] text-amber-700 uppercase block font-bold">
              2. Peak Threat Window
            </span>
            <span className="text-sm font-bold text-amber-800 block">
              {formatTimestampUTC(riskData.peak_period)}
            </span>
            <span className="text-[10px] text-amber-600 block">
              Maximum intensity & hazard exposure
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">
              3. Expected Dissipation / End
            </span>
            <span className="text-sm font-bold text-slate-800 block">
              {formatTimestampUTC(riskData.expected_end)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              System departure / recovery phase
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
