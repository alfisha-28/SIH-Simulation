import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Overview', end: true },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/events', label: 'Events Explorer', end: true },
  { path: '/events/EVT-2026-001', label: 'Event Detail' },
  { path: '/events/EVT-2026-001/forecast', label: 'Event Forecast' },
  { path: '/events/EVT-2026-001/risk', label: 'Event Risk' },
  { path: '/alerts', label: 'Alerts' },
  { path: '/system', label: 'System Info' },
];

export default function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-sm bg-blue-500 shadow-sm shadow-blue-500/50"></div>
            <span className="font-bold tracking-wider text-slate-100 uppercase text-xs">
              Weather Intel CC
            </span>
          </div>

          <nav className="flex space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
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
