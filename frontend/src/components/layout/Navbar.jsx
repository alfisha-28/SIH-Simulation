import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAdvisories } from '../../lib/advisoryStore';

export default function Navbar() {
  const location = useLocation();
  const navRef = useRef(null);

  // Red badge = advisories still waiting for KVK review, live from the shared
  // workflow store, so approving one on any page updates it straight away.
  const { counts } = useAdvisories();
  const pendingCount = counts.pending;

  // Keep the active link visible when the nav scrolls horizontally on narrow screens.
  // [data-section-active] covers System / Data on the /events/* drill-downs, which
  // NavLink never marks aria-current because the path isn't its own route.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const reveal = () =>
      nav
        .querySelector('[aria-current="page"], [data-section-active]')
        ?.scrollIntoView({ inline: 'center', block: 'nearest' });
    reveal();
    // The logo image and web font load after first paint and resize the nav and its
    // links, which left the active link part-hidden; re-centre whenever layout changes.
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(reveal);
    observer.observe(nav);
    for (const link of nav.children) observer.observe(link);
    return () => observer.disconnect();
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'Overview', end: true },
    { path: '/kvk', label: 'KVK Dashboard' },
    { path: '/panchayats', label: 'Panchayat Explorer' },
    { path: '/advisories', label: 'Advisories', badge: pendingCount, hasAlert: pendingCount > 0 },
    // The regional forecast-driver drill-downs (/events/:id/...) are reached from here.
    { path: '/system', label: 'System / Data', alsoActiveFor: '/events/' },
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
            {navItems.map((item) => {
              const sectionActive = Boolean(item.alsoActiveFor && location.pathname.startsWith(item.alsoActiveFor));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  data-section-active={sectionActive ? '' : undefined}
                  // aria-label rather than an sr-only span: inside this horizontally
                  // scrolling nav an absolutely positioned span widens the whole page on phones.
                  aria-label={item.badge > 0 ? `${item.label}, ${item.badge} pending KVK review` : undefined}
                  className={({ isActive: routeActive }) => {
                    const isActive = routeActive || sectionActive;
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
                  {item.badge > 0 && (
                    <span
                      aria-hidden="true"
                      className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums"
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
