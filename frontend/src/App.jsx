import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';

// Route level code splitting: each page (and the Leaflet map it may pull in)
// only downloads when that route is actually visited.
const Landing = lazy(() => import('./routes/Landing'));
const Dashboard = lazy(() => import('./routes/Dashboard'));
const EventExplorer = lazy(() => import('./routes/EventExplorer'));
const EventDetail = lazy(() => import('./routes/EventDetail'));
const EventForecast = lazy(() => import('./routes/EventForecast'));
const EventRisk = lazy(() => import('./routes/EventRisk'));
const Alerts = lazy(() => import('./routes/Alerts'));
const SystemInfo = lazy(() => import('./routes/SystemInfo'));
const NotFound = lazy(() => import('./routes/NotFound'));

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="events" element={<EventExplorer />} />
            <Route path="events/:eventId" element={<EventDetail />} />
            <Route path="events/:eventId/forecast" element={<EventForecast />} />
            <Route path="events/:eventId/risk" element={<EventRisk />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="system" element={<SystemInfo />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}