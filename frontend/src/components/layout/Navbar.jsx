import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { apiGet } from '../../lib/api';

export default function Navbar() {
  const location = useLocation();
  const match = location.pathname.match(/\/events\/([^/]+)/);
  const pathEventId = match ? match[1] : null;

  const [events, setEvents] = useState([]);
  useEffect(() => {
    apiGet('/events')
      .then((res) => {
        if (res?.events) {
          setEvents(res.events);
        }
      })
      .catch((err) => console.error('Navbar error fetching alerts:', err));
  }, []);

  // Store the active event ID in localStorage when visited via URL
  useEffect(() => {
    if (pathEventId) {
      localStorage.setItem('lastActiveEventId', pathEventId);
    }
  }, [pathEventId]);

  const currentEventId = pathEventId || localStorage.getItem('lastActiveEventId') || events[0]?.event_id || 'EVT-2026-001';
  const severeAlertsCount = events.filter((e) => e.severity?.toLowerCase() === 'severe').length;

  const navItems = [
    { path: '/', label: 'Overview', end: true },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/events', label: 'Events Explorer', end: true },
    { path: `/events/${currentEventId}`, label: 'Event Detail', end: true },
    { path: `/events/${currentEventId}/forecast`, label: 'Event Forecast', end: true },
    { path: `/events/${currentEventId}/risk`, label: 'Event Risk', end: true },
    { 
      path: '/alerts', 
      label: severeAlertsCount > 0 ? `Alerts [${severeAlertsCount}] 🔴` : 'Alerts',
      hasAlert: severeAlertsCount > 0
    },
    { path: '/system', label: 'System Info' },
  ];

  return (
    <header className="border-b border-[#D9E4EE] bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-2">
            <img src="/logo.jpg" alt="WARSHA Logo" className="h-7 w-auto object-contain rounded-md shadow-sm" />
            <span className="font-extrabold tracking-wider text-slate-900 uppercase text-xs">
              WARSHA
            </span>
          </div>

          <nav className="flex space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => {
                  let activeClass = 'bg-blue-50 text-blue-600 border border-blue-200';
                  if (item.hasAlert && isActive) {
                    activeClass = 'bg-red-50 text-red-600 border border-red-200';
                  }
                  
                  return `px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? activeClass
                      : item.hasAlert 
                        ? 'text-red-600 hover:text-red-800 hover:bg-red-50/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`;
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
