import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { apiGet } from '../../lib/api';

export default function Navbar() {
  const location = useLocation();
  const navRef = useRef(null);

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

  // Keep the active link visible when the nav scrolls horizontally on narrow screens
  useEffect(() => {
    const activeEl = navRef.current?.querySelector('[aria-current="page"]');
    activeEl?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [location.pathname]);

  const severeAlertsCount = events.filter((e) => e.severity?.toLowerCase() === 'severe').length;

  const navItems = [
    { path: '/', label: 'Overview', end: true },
    { path: '/kvk', label: 'KVK Dashboard' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/events', label: 'Events Explorer', end: true },
    {
      path: '/alerts',
      label: severeAlertsCount > 0 ? `Alerts [${severeAlertsCount}]` : 'Alerts',
      hasAlert: severeAlertsCount > 0
    },
    { path: '/panchayats', label: 'Panchayat Explorer' },
  ];

  return (
    <header className="border-b border-[#D9E4EE] bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" aria-label="WARSHA home" className="flex items-center space-x-2 shrink-0 mr-3">
            <img src="/logo.jpg" alt="" className="h-7 w-auto object-contain rounded-md shadow-sm" />
            <span className="font-extrabold tracking-wider text-slate-900 uppercase text-xs">
              WARSHA
            </span>
          </Link>

          <nav ref={navRef} className="flex space-x-1 overflow-x-auto py-2 min-w-0">
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
