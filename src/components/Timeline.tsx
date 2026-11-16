import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ListFilter,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { GoogleCalendarTimeline } from './GoogleCalendarTimeline';
import { checkDayConflicts, formatDayDate } from '../utils/time';
import { formatCurrency } from '../utils/currency';

export const Timeline: React.FC = () => {
  const { currentTrip, activeDay, setActiveDay, openAddModal, currency, setScreen } = useTrip();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});

  const toggleDayCollapse = (dayNum: number) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }));
  };

  const handleSelectDay = (day: number) => {
    setActiveDay(day);
  };

  const budgetSummary = useMemo(() => {
    if (!currentTrip) return { total: 0, travel: 0, stay: 0, food: 0, activity: 0 };
    return currentTrip.items.reduce(
      (acc, item) => {
        const cost = item.cost || 0;
        acc.total += cost;
        if (item.type === 'travel') acc.travel += cost;
        else if (item.type === 'stay') acc.stay += cost;
        else if (item.type === 'food') acc.food += cost;
        else if (item.type === 'activity') acc.activity += cost;
        return acc;
      },
      { total: 0, travel: 0, stay: 0, food: 0, activity: 0 }
    );
  }, [currentTrip]);

  const totalConflicts = useMemo(() => {
    if (!currentTrip) return 0;
    let count = 0;
    for (let d = 1; d <= currentTrip.numDays; d++) {
      const items = currentTrip.items.filter((i) => i.day === d);
      count += checkDayConflicts(items).length;
    }
    return count;
  }, [currentTrip]);

  const filteredItems = useMemo(() => {
    if (!currentTrip) return [];
    if (!searchQuery.trim()) return currentTrip.items;
    const q = searchQuery.toLowerCase();
    return currentTrip.items.filter(
      (i) => i.title.toLowerCase().includes(q) || (i.location && i.location.toLowerCase().includes(q))
    );
  }, [currentTrip, searchQuery]);

  const formattedStartDate = useMemo(() => {
    if (!currentTrip) return '';
    try {
      const [y, m, d] = currentTrip.startDate.split('-').map(Number);
      const date = new Date(y, (m || 1) - 1, d || 1);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return currentTrip.startDate;
    }
  }, [currentTrip]);

  const startsInText = useMemo(() => {
    if (!currentTrip?.startDate) return '';
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [y, m, d] = currentTrip.startDate.split('-').map(Number);
      const start = new Date(y, (m || 1) - 1, d || 1);
      start.setHours(0, 0, 0, 0);

      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Starts today';
      if (diffDays === 1) return 'Starts in 1 Day';
      if (diffDays > 1) return `Starts in ${diffDays} Days`;
      if (diffDays === -1) return 'Started yesterday';
      return `Started ${Math.abs(diffDays)} days ago`;
    } catch {
      return 'Starts soon';
    }
  }, [currentTrip?.startDate]);

  if (!currentTrip) return null;

  return (
    <div className="relative z-10 w-full h-full flex flex-col overflow-hidden pb-2">
      {/* Top Summary Accordion */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-2 pb-1.5 transition-all duration-300 shrink-0">
        <div 
          className={`glass-card border border-black/10 dark:border-white/10 transition-all duration-300 ease-in-out overflow-hidden shadow-xs ${
            detailsOpen ? 'p-3.5 sm:p-4' : 'py-2 px-3.5 sm:px-4'
          }`}
        >
          {/* Main Top Area: Title on left, Metrics & Controls on right */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Left side: route info and title */}
            <div className="min-w-0">
              {/* Route & "Starts in num Days" added at top of title when expanded */}
              {detailsOpen && (
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-200">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>{currentTrip.from} → {currentTrip.to}</span>
                  </span>
                  <span>·</span>
                  <span 
                    title={`Starts on ${formattedStartDate} (${currentTrip.numDays} Days Journey)`}
                    className="cursor-help hover:text-blue-600 dark:hover:text-blue-400 transition-colors border-b border-dotted border-neutral-400 dark:border-neutral-500 font-medium"
                  >
                    {startsInText}
                  </span>
                </div>
              )}

              <h1 className="text-base sm:text-xl font-bold text-neutral-900 dark:text-white truncate">
                {currentTrip.title}
              </h1>
            </div>

            {/* Right side: Metrics pill on top row, actions below it when expanded */}
            <div className="flex flex-col items-end shrink-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-end">
                {/* Specific color-coded Duration (blue), Events (purple), Est Budget (emerald) */}
                <div className="flex items-center gap-2 sm:gap-3 py-1 px-2.5 sm:px-3 rounded-xl bg-neutral-100/90 dark:bg-neutral-800/80 border border-black/5 dark:border-white/10 text-xs shadow-2xs">
                  {/* Duration: Blue */}
                  <div>
                    <span className="text-blue-600 dark:text-blue-400 block text-[9px] uppercase tracking-wider font-bold">
                      Duration
                    </span>
                    <span 
                      title={`Starts on ${formattedStartDate}`}
                      className="font-bold text-blue-900 dark:text-blue-200 tabular-nums cursor-help"
                    >
                      {currentTrip.numDays} Days
                    </span>
                  </div>

                  <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700" />

                  {/* Events: Purple */}
                  <div>
                    <span className="text-purple-600 dark:text-purple-400 block text-[9px] uppercase tracking-wider font-bold">
                      Events
                    </span>
                    <span className="font-bold text-purple-900 dark:text-purple-200 tabular-nums">
                      {currentTrip.items.length} items
                    </span>
                  </div>

                  <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700" />

                  {/* Est. Budget: Emerald */}
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-400 block text-[9px] uppercase tracking-wider font-bold">
                      Est. Budget
                    </span>
                    <span className="font-bold font-mono text-emerald-900 dark:text-emerald-200 tabular-nums">
                      {formatCurrency(budgetSummary.total, currency)}
                    </span>
                  </div>
                </div>

                {/* When NOT expanded, show conflict and More Details right next to the metrics pill */}
                {!detailsOpen && (
                  <div className="flex items-center gap-1.5">
                    {totalConflicts > 0 && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{totalConflicts} conflict{totalConflicts > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setDetailsOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                      title="Expand route and category breakdown"
                    >
                      <span>More details</span>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 transition-transform duration-300" />
                    </button>
                  </div>
                )}
              </div>

              {/* When expanded: show calendar & export button and less details button BELOW duration, event, est budget */}
              {detailsOpen && (
                <div className="flex items-center gap-2 justify-end mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {totalConflicts > 0 && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{totalConflicts} conflict{totalConflicts > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setScreen('review')}
                    className="btn-primary text-xs py-1.5 px-3 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Calendar & Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailsOpen(false)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                    title="Collapse details"
                  >
                    <span>Less details</span>
                    <ChevronDown className="w-3.5 h-3.5 rotate-180 text-blue-500 transition-transform duration-300" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Expanded Details: Category Breakdown at the bottom */}
          {detailsOpen && (
            <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Category breakdown:</span>
                <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400 font-medium">
                  Transit: {formatCurrency(budgetSummary.travel, currency)}
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-medium">
                  Stay: {formatCurrency(budgetSummary.stay, currency)}
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-medium">
                  Food: {formatCurrency(budgetSummary.food, currency)}
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                  Activities: {formatCurrency(budgetSummary.activity, currency)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Calendar + All Items Area: fills remaining viewport height perfectly */}
      <div className="flex-1 min-h-0 w-full px-3 sm:px-6 flex gap-3 sm:gap-4 items-stretch overflow-hidden transition-all duration-300 ease-in-out">
        {sidebarOpen ? (
          <aside className="shrink-0 glass-card border border-black/10 dark:border-white/10 transition-all duration-300 flex flex-col h-full w-72 sm:w-80 p-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title="Click to collapse sidebar"
              className="w-full flex items-center justify-between p-2 mb-3 rounded-xl border border-black/5 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:border-blue-400/50 transition-all shrink-0 cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors">
                  <ListFilter className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  All Items ({currentTrip.items.length})
                </span>
              </div>

              <ChevronLeft className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              <div className="relative shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter itinerary..."
                  className="input text-xs py-1.5 px-3"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 day-items-scroll">
                {Array.from({ length: currentTrip.numDays }, (_, i) => i + 1).map((d) => {
                  const dayItems = filteredItems.filter((i) => i.day === d);
                  const isCollapsed = !!collapsedDays[d];
                  const dayCost = dayItems.reduce((acc, curr) => acc + (curr.cost || 0), 0);

                  return (
                    <div
                      key={d}
                      className="rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.02] overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleDayCollapse(d)}
                        className="w-full p-2.5 flex items-center justify-between text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white">
                            Day {d}
                          </span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                            {formatDayDate(currentTrip.startDate, d)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-neutral-400">
                            {dayItems.length}
                          </span>
                          {dayCost > 0 && (
                            <span className="text-[10px] font-mono font-medium text-neutral-700 dark:text-neutral-300">
                              {formatCurrency(dayCost, currency)}
                            </span>
                          )}
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className="p-2 pt-0 space-y-1">
                          {dayItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                handleSelectDay(d);
                                openAddModal(d, undefined, item);
                              }}
                              className="p-1.5 rounded-lg bg-white/70 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 border border-black/5 dark:border-white/5 hover:border-blue-400/50 text-xs cursor-pointer transition-all flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 truncate">
                                <span className="font-mono tabular-nums text-[11px] text-blue-600 dark:text-blue-400 mr-1.5 font-semibold">
                                  {item.start}
                                </span>
                                <span className="text-neutral-800 dark:text-neutral-200">
                                  {item.title}
                                </span>
                              </div>
                              {item.cost ? (
                                <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                                  {formatCurrency(item.cost, currency)}
                                </span>
                              ) : null}
                            </div>
                          ))}

                          {dayItems.length === 0 && (
                            <div className="p-2 text-center text-[11px] text-neutral-400">
                              No items
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            title="Click to view All Items"
            className="shrink-0 glass-card border border-black/10 dark:border-white/10 transition-all duration-300 flex flex-col items-center justify-center gap-3 h-full w-14 p-2.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:border-blue-400/50 group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors">
              <ListFilter className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 [writing-mode:vertical-rl] rotate-180 tracking-wider uppercase transition-colors">
              All Items ({currentTrip.items.length})
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 mt-2 transition-colors" />
          </button>
        )}

        <div className="flex-1 h-full flex overflow-hidden">
          <GoogleCalendarTimeline
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      </div>
    </div>
  );
};
