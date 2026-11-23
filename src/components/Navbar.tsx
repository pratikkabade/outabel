import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Compass,
  FolderKanban,
  Home,
  Plus,
  Settings,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTrip } from '../context/TripContext';
import { OutabelLogo } from './OutabelLogo';

export const Navbar: React.FC = () => {
  const {
    setScreen,
    currentTrip,
    userName,
    userEmail,
    userInitials,
    trips,
  } = useTrip();

  const headerRef = useRef<HTMLElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

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

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click or Escape key
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 w-full glass-sticky border-b border-black/5 dark:border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 transition-opacity text-left min-w-0">
            <Link
              to="/"
              aria-label="Outabel Home"
              className="rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <OutabelLogo className="w-8 h-8" />
            </Link>
            <div className="flex flex-col min-w-0">
              <Link
                to="/"
                className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight whitespace-nowrap hover:opacity-80 transition-opacity"
              >
                Outabel
              </Link>
              {currentTrip && (
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium truncate max-w-[200px] sm:max-w-xs leading-tight">
                  {currentTrip.title}
                </span>
              )}
            </div>
          </div>

          <div ref={menuContainerRef} className="relative flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              title={`${userName} · Account & Settings`}
              className={`w-9 h-9 rounded-full p-0.5 border transition-all cursor-pointer flex items-center justify-center ${
                menuOpen
                  ? 'border-blue-500 ring-2 ring-blue-500/25 bg-white dark:bg-neutral-800'
                  : 'border-black/10 dark:border-white/15 bg-white/80 dark:bg-neutral-800/80 hover:border-blue-400 hover:shadow-xs'
              }`}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs select-none">
                {userInitials}
              </div>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  role="menu"
                  aria-label="Profile options"
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-[#161a22] border border-black/10 dark:border-white/12 shadow-xl overflow-hidden z-50"
                >
                  {/* User Summary */}
                  <div className="px-4 py-3 border-b border-black/8 dark:border-white/10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {userName}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {userEmail}
                      </div>
                    </div>
                  </div>

                  {/* Quick Navigation Links */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setScreen('home');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.07] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <Home className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>Home</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setScreen('trips');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.07] flex items-center justify-between gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <FolderKanban className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>My Trips</span>
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-neutral-400">
                        {trips.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setScreen('wizard');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.07] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Plan New Trip</span>
                    </button>

                    {currentTrip && (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false);
                            setScreen('planner', currentTrip.id);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.07] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                        >
                          <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">Timeline: {currentTrip.title}</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false);
                            setScreen('review', currentTrip.id);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.07] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                        >
                          <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>Review &amp; Export</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Settings Trigger -> Navigates to Settings page */}
                  <div className="p-1.5 border-t border-black/8 dark:border-white/10">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setScreen('settings');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>Settings</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
