import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import Landing from './routes/Landing';
import Dashboard from './routes/Dashboard';
import EventExplorer from './routes/EventExplorer';
import EventDetail from './routes/EventDetail';
import EventForecast from './routes/EventForecast';
import EventRisk from './routes/EventRisk';
import Alerts from './routes/Alerts';
import SystemInfo from './routes/SystemInfo';

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
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}