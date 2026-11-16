import React from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Calendar, 
  Plus, 
  Copy, 
  Trash2, 
  Sun, 
  Moon, 
  Laptop, 
  DollarSign, 
  Compass, 
  Sparkles,
  Check
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { CURRENCIES, CurrencyCode, formatCurrency } from '../utils/currency';

export const ProfileModal: React.FC = () => {
  const { 
    isProfileOpen, 
    setIsProfileOpen, 
    trips, 
    currentTrip, 
    setCurrentTrip, 
    deleteTrip, 
    saveTrip, 
    setScreen, 
    theme, 
    setTheme, 
    currency, 
    setCurrency, 
    showToast,
    loadSampleTrip,
    use12h,
    setUse12h,
    calendarDensity,
    setCalendarDensity
  } = useTrip();

  if (!isProfileOpen) return null;

  const handleDuplicate = (tripToCopy: typeof trips[0], e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTrip(tripId);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsProfileOpen(false)}>
      <div 
        className="glass-card w-full max-w-lg p-6 sm:p-7 relative border border-white/80 dark:border-white/15 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
              PK
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Pratik Kabade
              </h2>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                thisispratikkabade@gmail.com
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                My Trips ({trips.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setScreen('wizard');
                }}
                className="chip text-xs py-1 px-2.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New Trip</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {trips.map((trip) => {
                const isSelected = currentTrip?.id === trip.id;
                const totalCost = trip.items.reduce((acc, curr) => acc + (curr.cost || 0), 0);

                return (
                  <div
                    key={trip.id}
                    onClick={() => {
                      setCurrentTrip(trip);
                      setScreen('planner');
                      setIsProfileOpen(false);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/40'
                        : 'bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-blue-400'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                          {trip.title}
                        </span>
                        {isSelected && (
                          <span className="chip text-[9px] py-0 px-1.5 font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        <span>{trip.numDays} days</span>
                        <span>·</span>
                        <span>{trip.items.length} items</span>
                        {totalCost > 0 && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-neutral-800 dark:text-neutral-200">
                              {formatCurrency(totalCost, currency)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(trip, e)}
                        title="Duplicate trip"
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {trips.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(trip.id, e)}
                          title="Delete trip"
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Preferred Currency
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                      currency === c
                        ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                    }`}
                  >
                    {CURRENCIES[c].symbol} {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Appearance & Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'system' as const, label: 'System', icon: Laptop },
                  { id: 'light' as const, label: 'Light', icon: Sun },
                  { id: 'dark' as const, label: 'Dark', icon: Moon },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTheme(opt.id)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Time Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUse12h(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    use12h
                      ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                  }`}
                >
                  <span className="font-mono">12-Hour</span>
                  <span className="opacity-70 text-[10px]">(e.g. 2:30 PM)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUse12h(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !use12h
                      ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                  }`}
                >
                  <span className="font-mono">24-Hour</span>
                  <span className="opacity-70 text-[10px]">(e.g. 14:30)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Timeline Density
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compact' as const, label: 'Compact', desc: '52px' },
                  { id: 'normal' as const, label: 'Default', desc: '68px' },
                  { id: 'spacious' as const, label: 'Spacious', desc: '88px' },
                ].map((opt) => {
                  const isSelected = calendarDensity === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCalendarDensity(opt.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-[10px] opacity-75 font-mono">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <button
              type="button"
              onClick={() => {
                loadSampleTrip();
                setIsProfileOpen(false);
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Reload Kyoto & Tokyo Sample
            </button>
            <span>Stored in LocalStorage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
