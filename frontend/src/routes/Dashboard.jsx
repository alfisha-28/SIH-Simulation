import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '../lib/api';
import SystemStatusStrip from '../components/dashboard/SystemStatusStrip';
import EventMap from '../components/dashboard/EventMap';
import ForecastTimelineSlider from '../components/dashboard/ForecastTimelineSlider';
import KeyMetricsPanel from '../components/dashboard/KeyMetricsPanel';
import ActiveEventList from '../components/dashboard/ActiveEventList';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [selectedEventForecast, setSelectedEventForecast] = useState(null);
  const [selectedTimestepIndex, setSelectedTimestepIndex] = useState(0);

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState(null);

  // Cache detail and forecast by event ID to prevent duplicate requests
  const detailCacheRef = useRef({});
  const forecastCacheRef = useRef({});

  // Fetch forecast and detail for a given event ID
  const fetchEventData = useCallback(async (eventId) => {
    if (!eventId) return;
    setLoadingForecast(true);

    try {
      let detail = detailCacheRef.current[eventId];
      let forecast = forecastCacheRef.current[eventId];

      if (!detail || !forecast) {
        const [detailRes, forecastRes] = await Promise.all([
          detail ? Promise.resolve(detail) : apiGet(`/events/${eventId}`),
          forecast ? Promise.resolve(forecast) : apiGet(`/events/${eventId}/forecast`),
        ]);

        detail = detailRes;
        forecast = forecastRes;

        detailCacheRef.current[eventId] = detail;
        forecastCacheRef.current[eventId] = forecast;
      }

      setSelectedEventDetail(detail);
      setSelectedEventForecast(forecast);
      setSelectedTimestepIndex(0); // Reset slider to NOW
    } catch (err) {
      console.error(`Failed to fetch forecast/detail for ${eventId}:`, err);
      setError(`Failed to load details for ${eventId}: ${err.message}`);
    } finally {
      setLoadingForecast(false);
    }
  }, []);

  // Fetch list of events on mount
  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    setError(null);
    try {
      const res = await apiGet('/events');
      const eventList = res.events || [];
      setEvents(eventList);

      if (eventList.length > 0) {
        // Select primary event: severe event with highest probability, else first event
        const severeEvents = eventList.filter((e) => e.severity === 'severe');
        const primary = severeEvents.length > 0 ? severeEvents[0] : eventList[0];
        
        setSelectedEventId(primary.event_id);
        localStorage.setItem('lastActiveEventId', primary.event_id);
        await fetchEventData(primary.event_id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(`Failed to connect to Weather Intel API backend (${err.message}). Please verify the backend is running at http://localhost:8000.`);
    } finally {
      setLoadingEvents(false);
    }
  }, [fetchEventData]);

  useEffect(() => {
    async function init() {
      await loadEvents();
    }
    init();
  }, [loadEvents]);

  // Handle manual selection of an event card or marker
  const handleSelectEvent = (eventId) => {
    if (eventId === selectedEventId) return;
    setSelectedEventId(eventId);
    localStorage.setItem('lastActiveEventId', eventId);
    fetchEventData(eventId);
  };

  const selectedEvent = events.find((e) => e.event_id === selectedEventId);
  const currentTimestep = selectedEventForecast?.timeline?.[selectedTimestepIndex] || null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top System Status Bar */}
      <SystemStatusStrip
        events={events}
        selectedEvent={selectedEvent}
        onRefresh={loadEvents}
        loading={loadingEvents || loadingForecast}
      />

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-mono flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={loadEvents}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-semibold transition-colors uppercase"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Grid: Interactive Map & Sidebar Event List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Map + Timeline Slider + Metrics (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Map */}
          {loadingEvents ? (
            <div className="h-[450px] sm:h-[500px] w-full rounded-xl bg-white border border-[#D9E4EE] flex items-center justify-center text-slate-500 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping"></span>
                <span>Connecting Radar Map to Backend...</span>
              </div>
            </div>
          ) : (
            <EventMap
              events={events}
              selectedEventId={selectedEventId}
              selectedEventForecast={selectedEventForecast}
              selectedTimestepIndex={selectedTimestepIndex}
              onSelectEvent={handleSelectEvent}
            />
          )}

          {/* Timeline Slider */}
          <ForecastTimelineSlider
            timeline={selectedEventForecast?.timeline || []}
            selectedIndex={selectedTimestepIndex}
            onSelectIndex={setSelectedTimestepIndex}
          />

          {/* Key Metrics Panel */}
          <KeyMetricsPanel
            selectedEvent={selectedEvent}
            selectedEventDetail={selectedEventDetail}
            currentTimestep={currentTimestep}
          />
        </div>

        {/* Right Sidebar Column: Active Event List (1 Col wide) */}
        <div className="lg:col-span-1">
          {loadingEvents ? (
            <div className="h-[500px] w-full rounded-xl bg-white border border-[#D9E4EE] p-4 animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-24 bg-slate-50 rounded-xl"></div>
              <div className="h-24 bg-slate-50 rounded-xl"></div>
              <div className="h-24 bg-slate-50 rounded-xl"></div>
            </div>
          ) : (
            <ActiveEventList
              events={events}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
