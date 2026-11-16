import React from 'react';
import { Compass } from 'lucide-react';
import { useTrip } from '../context/TripContext';

export const Navbar: React.FC = () => {
  const { 
    setScreen, 
    currentTrip, 
    setIsProfileOpen 
  } = useTrip();

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-black/5 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Compass className="w-4.5 h-4.5" />
          </div>
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
        </button>

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
  );
};
