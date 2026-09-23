import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

function RouteFallback() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center bg-[#F4F8FC]"
      role="status"
      aria-live="polite"
    >
      <span className="text-sm font-medium text-slate-500">Loading...</span>
    </div>
  );
}

export default function Layout() {
  const mainRef = useRef(null);
  const { pathname } = useLocation();
  const lastPath = useRef(pathname);

  // Reset scroll position on every route change so navigation never opens mid-page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Move focus to the main landmark after navigation so keyboard and screen
  // reader users get a change cue instead of focus staying on the old link.
  // Skip the initial mount: comparing against the previous pathname (rather
  // than a boolean) keeps this correct under StrictMode's double effect
  // invocation in development, where a boolean guard would flip early and
  // steal focus into main on first load.
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F4F8FC] text-slate-900 flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:inline-flex focus:items-center focus:min-h-11 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-blue-600 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
