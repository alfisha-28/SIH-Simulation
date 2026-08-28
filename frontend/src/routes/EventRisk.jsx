import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import SeverityBadge from '../components/common/SeverityBadge';
import TimelineSlider from '../components/common/TimelineSlider';

export default function EventRisk() {
  const { eventId } = useParams();
  const [eventDetail, setEventDetail] = useState(null);
  const [forecastTimeline, setForecastTimeline] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [selectedTimestepIndex, setSelectedTimestepIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  // Initial load: Fetch event detail, forecast timeline, and initial risk snapshot
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setNotFound(false);
      setError(null);
      try {
        const [detailRes, forecastRes, riskRes] = await Promise.all([
          apiGet(`/events/${eventId}`).catch(() => null),
          apiGet(`/events/${eventId}/forecast`).catch(() => null),
          apiGet(`/events/${eventId}/risk`),
        ]);

        if (!riskRes) {
          setNotFound(true);
          return;
        }

        setEventDetail(detailRes);
        if (forecastRes?.timeline) {
          setForecastTimeline(forecastRes.timeline);
        } else {
          // Fallback static timeline if forecast timeline unavailable
          setForecastTimeline([
            { timestep_label: 'NOW', timestep_hours_offset: 0, probability: detailRes?.probability || 0.8 },
            { timestep_label: '+6h', timestep_hours_offset: 6, probability: 0.82 },
            { timestep_label: '+12h', timestep_hours_offset: 12, probability: 0.85 },
            { timestep_label: '+18h', timestep_hours_offset: 18, probability: 0.88 },
            { timestep_label: '+24h', timestep_hours_offset: 24, probability: 0.75 },
            { timestep_label: '+48h', timestep_hours_offset: 48, probability: 0.5 },
          ]);
        }
        setRiskData(riskRes);
        setSelectedTimestepIndex(0);
      } catch (err) {
        console.error(`Error loading risk assessment for event ${eventId}:`, err);
        if (err.message && err.message.includes('404')) {
          setNotFound(true);
        } else {
          setError(`Failed to load impact and risk assessment for ${eventId}: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadInitialData();
    }
  }, [eventId]);

  // Timestep selection refetch handler for GET /events/{eventId}/risk?timestep={label}
  const handleSelectTimestep = async (index) => {
    setSelectedTimestepIndex(index);
    const targetStep = forecastTimeline[index];
    if (!targetStep?.timestep_label) return;

    setLoadingRisk(true);
    try {
      // Encode label to handle leading '+'
      const labelQuery = encodeURIComponent(targetStep.timestep_label);
      const updatedRisk = await apiGet(`/events/${eventId}/risk?timestep=${labelQuery}`);
      setRiskData(updatedRisk);
    } catch (err) {
      console.error(`Failed to fetch risk for timestep ${targetStep.timestep_label}:`, err);
    } finally {
      setLoadingRisk(false);
    }
  };

  const formatEventType = (type) => {
    return (type || '').replace('_', ' ').toUpperCase();
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toUTCString().replace(' GMT', ' UTC');
    } catch {
      return isoString;
    }
  };

  // Render 404 / Not Found state
  if (notFound) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 text-center">
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto text-xl font-bold font-mono">
            404
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Risk Snapshot Not Found</h1>
          <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
            No active risk assessment matching identifier <span className="text-cyan-400 font-bold">{eventId}</span> was found in the decision engine.
          </p>
          <div className="pt-2">
            <Link
              to="/events"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
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
        <div className="h-24 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"></div>
        <div className="h-32 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"></div>
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // Render Error state
  if (error || !riskData) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="p-6 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs font-mono">
          {error || 'Failed to load risk assessment.'}
        </div>
        <Link to="/events" className="text-xs text-cyan-400 hover:underline">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const currentStepLabel = forecastTimeline[selectedTimestepIndex]?.timestep_label || riskData.timestep_label;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Navigation Breadcrumbs & Cross-links */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Link to="/events" className="hover:text-cyan-400 transition-colors">
            Events
          </Link>
          <span>/</span>
          <Link to={`/events/${eventId}`} className="hover:text-cyan-400 transition-colors text-slate-300">
            {eventId}
          </Link>
          <span>/</span>
          <span className="text-cyan-400 font-bold">Impact & Risk</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/events/${eventId}`}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            ← Event Overview
          </Link>
          <Link
            to={`/events/${eventId}/forecast`}
            className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            ← Localized Forecast
          </Link>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono text-cyan-400 font-bold px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/60 rounded">
                {eventId}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                IMPACT ASSESSMENT: <strong className="text-slate-200">{riskData.impact_region_name}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 uppercase tracking-wide">
              Decision-Relevant Risk & Impact Analysis
              {eventDetail && <span className="text-slate-400 font-normal"> — {eventDetail.location_name} ({formatEventType(eventDetail.type)})</span>}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400">Timestep Snapshot:</span>
            <span className="px-3 py-1 bg-cyan-950 border border-cyan-700 rounded font-mono font-bold text-xs text-cyan-300">
              {currentStepLabel}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          Translating raw meteorological ensemble data into operational impact thresholds, multi-hazard risk probabilities, and critical disruption timelines.
        </p>
      </div>

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
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                Overall Risk Assessment ({currentStepLabel})
              </h2>
            </div>

            {/* Large Prominent Overall Risk Display */}
            <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-3 shadow-inner">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                Composite Risk Level
              </span>

              <div className="py-2">
                <SeverityBadge
                  severity={riskData.overall_risk}
                  className="text-2xl px-6 py-2.5 shadow-lg tracking-widest"
                />
              </div>

              <div className="text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                Evaluating <span className="text-cyan-300 font-bold">{currentStepLabel}</span> Forecast Horizon
              </div>
            </div>

            {/* Spatial Footprint Metrics */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Impact Region Target</span>
                <span className="text-sm font-bold text-slate-100 block">
                  {riskData.impact_region_name}
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Estimated Impact Radius</span>
                <span className="text-lg font-bold text-cyan-300">
                  {riskData.impact_radius_km} km
                </span>
              </div>
            </div>
          </div>

          {loadingRisk && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center text-cyan-400 font-mono text-xs z-20">
              <span className="animate-pulse">Updating Risk Model...</span>
            </div>
          )}
        </div>

        {/* Right Column: Risk Category Breakdown Table (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-6 relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Multi-Hazard Risk Category Breakdown
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Quantified probability and severity level per primary environmental hazard.
              </p>
            </div>
            {loadingRisk && (
              <span className="text-xs font-mono text-cyan-400 animate-pulse">Refreshing...</span>
            )}
          </div>

          {/* Risk Categories Table / Card List */}
          <div className="space-y-4">
            {/* Flood Risk Card */}
            <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                      Flood & Inundation Risk
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Flash flooding, urban drainage overload, and riverine rise
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <SeverityBadge severity={riskData.flood_risk_level} />
                  <span className="text-sm font-mono font-bold text-cyan-300 min-w-[50px] text-right">
                    {Math.round(riskData.flood_risk_probability * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${riskData.flood_risk_probability * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Wind Risk Card */}
            <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                      Wind Damage Risk
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Structural damage, fallen powerlines, gale gusts & coastal sea swell
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <SeverityBadge severity={riskData.wind_risk_level} />
                  <span className="text-sm font-mono font-bold text-amber-300 min-w-[50px] text-right">
                    {Math.round(riskData.wind_risk_probability * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${riskData.wind_risk_probability * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Heat Risk Card */}
            <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                      Thermal Stress & Heat Risk
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Extreme heatwave conditions, grid overload & thermal discomfort
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <SeverityBadge severity={riskData.heat_risk_level} />
                  <span className="text-sm font-mono font-bold text-red-300 min-w-[50px] text-right">
                    {Math.round(riskData.heat_risk_probability * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${riskData.heat_risk_probability * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Impact Timeline Window Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Critical Disruption Time Windows
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Operational window boundaries for emergency planning and asset protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">
              1. Expected Onset / Start Time
            </span>
            <span className="text-sm font-bold text-slate-200 block">
              {formatDate(riskData.expected_start)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Initial impact boundary
            </span>
          </div>

          <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl space-y-1.5">
            <span className="text-[10px] text-amber-400 uppercase block font-bold">
              2. Peak Threat Window
            </span>
            <span className="text-sm font-bold text-amber-200 block">
              {formatDate(riskData.peak_period)}
            </span>
            <span className="text-[10px] text-amber-300/80 block">
              Maximum intensity & hazard exposure
            </span>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">
              3. Expected Dissipation / End
            </span>
            <span className="text-sm font-bold text-slate-200 block">
              {formatDate(riskData.expected_end)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              System departure / recovery phase
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
