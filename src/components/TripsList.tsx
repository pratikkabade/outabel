import React from 'react';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Trash2, 
  Copy, 
  Download 
} from 'lucide-react';
import { RotateCcw } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { downloadICS } from '../utils/ics';
import { formatCurrency } from '../utils/currency';
import { OutabelLogo } from './OutabelLogo';

export const TripsList: React.FC = () => {
  const { trips, currentTrip, setCurrentTrip, deleteTrip, setScreen, showToast, saveTrip, currency, loadSampleTrip } = useTrip();

  const handleDuplicate = (tripToCopy: typeof trips[0]) => {
    const copied = {
      ...tripToCopy,
      id: 'trip-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      title: `${tripToCopy.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveTrip(copied);
    showToast(`Duplicated "${tripToCopy.title}"`);
  };

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-65px)] pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <OutabelLogo className="w-10 h-10 drop-shadow-sm" />
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                My Saved Trips
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                All your itineraries safely stored in browser localStorage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadSampleTrip()}
              className="btn-ghost text-xs py-2 px-3.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore 3 Templates</span>
            </button>
            <button
              type="button"
              onClick={() => setScreen('wizard')}
              className="btn-primary text-xs py-2 px-3.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Plan New Trip</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((trip) => {
            const isCurrent = currentTrip?.id === trip.id;
            const totalBudget = trip.items.reduce((acc, i) => acc + (i.cost || 0), 0);

            return (
              <div
                key={trip.id}
                className={`glass-card p-5 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-blue-500/50 ring-1 ring-blue-500/30 shadow-md shadow-blue-500/10'
                    : 'border-black/10 dark:border-white/10 hover:border-blue-400/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      {trip.from} → {trip.to}
                    </span>
                    {isCurrent && (
                      <span className="chip text-[10px] py-0 px-2 font-semibold">
                        Active Trip
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                    {trip.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{trip.startDate}</span>
                    </span>
                    <span>·</span>
                    <span>{trip.numDays} Days</span>
                    <span>·</span>
                    <span>{trip.items.length} Events</span>
                    {totalBudget > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-neutral-800 dark:text-neutral-200">
                          {formatCurrency(totalBudget, currency)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(trip)}
                      title="Duplicate trip"
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        downloadICS(trip);
                        showToast('Downloaded .ics file');
                      }}
                      title="Download iCal file"
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {trips.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteTrip(trip.id)}
                        title="Delete trip"
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTrip(trip);
                      setScreen('planner', trip.id);
                    }}
                    className={`text-xs py-1.5 px-3.5 rounded-xl font-medium transition-all cursor-pointer ${
                      isCurrent
                        ? 'btn-primary'
                        : 'btn-ghost'
                    }`}
                  >
                    <span>{isCurrent ? 'Open Timeline' : 'Switch to Trip'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
