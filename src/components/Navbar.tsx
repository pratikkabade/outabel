import React, { useLayoutEffect, useRef } from 'react';
import { useTrip } from '../context/TripContext';
import { OutabelLogo } from './OutabelLogo';

export const Navbar: React.FC = () => {
  const { 
    setScreen, 
    currentTrip, 
    setIsProfileOpen 
  } = useTrip();
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeight = () => {
      const height = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--navbar-height', `${height}px`);
    };

    updateHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 w-full glass-sticky border-b border-black/5 dark:border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 transition-opacity text-left">
            <button
              type="button"
              onClick={() => setScreen('home')}
              aria-label="Outabel Home"
              className="rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0">
              <OutabelLogo className="w-8 h-8" />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
                Outabel
              </span>
              {currentTrip && (
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium truncate max-w-[220px] sm:max-w-xs leading-tight">
                  {currentTrip.title}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              title="Profile, Saved Trips & Settings"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-neutral-800/70 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                PK
              </div>
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                My Profile
              </span>
            </button>
          </div>
        </div>
      </header>
      <div
        style={{ height: 'var(--navbar-height, 53px)' }}
        className="w-full shrink-0"
        aria-hidden="true"
      />
    </>
  );
};
