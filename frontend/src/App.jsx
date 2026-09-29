import { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';

// Route level code splitting: each page (and the Leaflet map it may pull in)
// only downloads when that route is actually visited.
const Landing = lazy(() => import('./routes/Landing'));
const EventDetail = lazy(() => import('./routes/EventDetail'));
const EventForecast = lazy(() => import('./routes/EventForecast'));
const EventRisk = lazy(() => import('./routes/EventRisk'));
const Advisories = lazy(() => import('./routes/Advisories'));
const SystemInfo = lazy(() => import('./routes/SystemInfo'));
const KvkDashboard = lazy(() => import('./routes/KvkDashboard'));
const PanchayatExplorer = lazy(() => import('./routes/PanchayatExplorer'));
const NotFound = lazy(() => import('./routes/NotFound'));

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            {/* The extreme-event command centre and Events Explorer were replaced by the
                KVK Dashboard and the Panchayat Explorer: keep old links and bookmarks working. */}
            <Route path="dashboard" element={<Navigate to="/kvk" replace />} />
            <Route path="events" element={<Navigate to="/panchayats" replace />} />
            {/* Internal drill-downs: the backend's regional weather systems (forecast drivers),
                reached from System / Data. */}
            <Route path="events/:eventId" element={<EventDetail />} />
            <Route path="events/:eventId/forecast" element={<EventForecast />} />
            <Route path="events/:eventId/risk" element={<EventRisk />} />
            <Route path="advisories" element={<Advisories />} />
            {/* The old Alerts page became Advisories: keep bookmarks and links working. */}
            <Route path="alerts" element={<Navigate to="/advisories" replace />} />
            <Route path="kvk" element={<KvkDashboard />} />
            <Route path="panchayats" element={<PanchayatExplorer />} />
            <Route path="system" element={<SystemInfo />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}