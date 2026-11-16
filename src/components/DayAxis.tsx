import React from 'react';
import { Trip } from '../types/trip';
import { formatShortDate, formatDayOfWeek } from '../utils/time';

interface DayAxisProps {
  trip: Trip;
  activeDay: number;
  onSelectDay: (day: number) => void;
}

export const DayAxis: React.FC<DayAxisProps> = ({ trip, activeDay, onSelectDay }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[95vw] sm:max-w-xl">
      <div className="glass px-3 py-2 rounded-2xl border border-black/10 dark:border-white/15 shadow-xl shadow-black/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {Array.from({ length: trip.numDays }, (_, i) => i + 1).map((d) => {
          const isActive = d === activeDay;
          const dayItems = trip.items.filter((item) => item.day === d);
          const shortDate = formatShortDate(trip.startDate, d);
          const dow = formatDayOfWeek(trip.startDate, d);

          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDay(d)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 scale-105'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase opacity-80">{dow}</span>
              <span className="text-xs font-bold font-mono">Day {d}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] opacity-70 font-mono">{shortDate}</span>
                {dayItems.length > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-white' : 'bg-blue-500/70'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
