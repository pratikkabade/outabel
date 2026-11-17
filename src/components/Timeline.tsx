import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  FileChartColumn,
  X
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { GoogleCalendarTimeline } from './GoogleCalendarTimeline';
import { checkDayConflicts, formatDayDate } from '../utils/time';
import { formatCurrency } from '../utils/currency';
import { resolveCalendarCategory } from '../utils/calendarCategories';

export const Timeline: React.FC = () => {
  const { currentTrip, activeDay, setActiveDay, openAddModal, currency, setScreen, calendarCategories } = useTrip();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBreakdown, setActiveBreakdown] = useState<'events' | 'budget' | null>(null);
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

  const tripSummary = useMemo(() => {
    if (!currentTrip) {
      return {
        totalCost: 0,
        categories: [] as Array<{ id: string; label: string; amount: number; count: number; textClass: string }>,
      };
    }

    const totalsByType = new Map<string, number>();
    const countsByType = new Map<string, number>();
    let totalCost = 0;

    for (const item of currentTrip.items) {
      const cost = item.cost || 0;
      totalCost += cost;
      const key = (item.type || 'activity').toLowerCase();
      totalsByType.set(key, (totalsByType.get(key) || 0) + cost);
      countsByType.set(key, (countsByType.get(key) || 0) + 1);
    }

    const categories: Array<{ id: string; label: string; amount: number; count: number; textClass: string }> = [];
    const seen = new Set<string>();

    for (const cat of calendarCategories) {
      const key = cat.id.toLowerCase();
      seen.add(key);
      const resolved = resolveCalendarCategory(cat.id, calendarCategories);
      categories.push({
        id: cat.id,
        label: cat.label,
        amount: totalsByType.get(key) || 0,
        count: countsByType.get(key) || 0,
        textClass: resolved.style.timeText,
      });
    }

    for (const [key, count] of countsByType.entries()) {
      if (!seen.has(key) && count > 0) {
        const resolved = resolveCalendarCategory(key, calendarCategories);
        categories.push({
          id: key,
          label: resolved.label,
          amount: totalsByType.get(key) || 0,
          count,
          textClass: resolved.style.timeText,
        });
      }
    }

    return { totalCost, categories };
  }, [currentTrip, calendarCategories]);

  const budgetBreakdownCategories = useMemo(
    () => tripSummary.categories.filter((c) => c.amount > 0),
    [tripSummary]
  );

  const eventsBreakdownCategories = useMemo(
    () => tripSummary.categories.filter((c) => c.count > 0),
    [tripSummary]
  );

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

  if (!currentTrip) return null;

  return (
    <div className="relative z-10 w-full h-full flex flex-col overflow-hidden pb-1.5 sm:pb-2">
      {/* Top Summary Accordion */}
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-6 pt-1.5 sm:pt-2 pb-1.5 transition-all duration-300 shrink-0">
        <div 
          className="glass-card border border-black/10 dark:border-white/10 transition-all duration-300 ease-in-out overflow-hidden shadow-xs py-1.5 sm:py-2 px-3 sm:px-4"
        >
          {/* Main Top Area: Clean Title on left, Metrics & Toggle Button on right */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="min-w-0 flex items-center justify-between gap-2">
              <h1 className="text-sm sm:text-xl font-bold text-neutral-900 dark:text-white truncate">
                {currentTrip.title}
              </h1>

              {/* Mobile All Items quick toggle so it takes 0px of calendar space when hidden */}
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className={`md:hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                  sidebarOpen
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25'
                }`}
              >
                <ListFilter className="w-3 h-3" />
                <span>{sidebarOpen ? 'Hide Items' : `All Items (${currentTrip.items.length})`}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-between md:justify-end shrink-0">
              {/* Metrics bar: Duration (static), Events (button), Est. Budget (button) */}
              <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl border border-black/5 dark:border-white/10 bg-neutral-100/90 dark:bg-neutral-800/80 text-[11px] sm:text-xs shadow-2xs">
                {/* Duration: Blue (static display) */}
                <div className="px-1.5 sm:px-2 py-0.5 text-left">
                  <span className="text-blue-600 dark:text-blue-400 block text-[8px] sm:text-[9px] uppercase tracking-wider font-bold">
                    Duration
                  </span>
                  <span 
                    title={`Starts on ${formattedStartDate}`}
                    className="font-bold text-blue-900 dark:text-blue-200 tabular-nums"
                  >
                    {currentTrip.numDays} Days
                  </span>
                </div>

                <div className="w-px h-4 sm:h-5 bg-neutral-300 dark:bg-neutral-700" />

                {/* Events: Purple (toggles events count breakdown) */}
                <button
                  type="button"
                  onClick={() => setActiveBreakdown((prev) => (prev === 'events' ? null : 'events'))}
                  aria-expanded={activeBreakdown === 'events'}
                  title={activeBreakdown === 'events' ? 'Hide events breakdown' : 'View events breakdown'}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-left transition-colors cursor-pointer ${
                    activeBreakdown === 'events'
                      ? 'bg-purple-500/15 ring-1 ring-purple-500/35'
                      : 'hover:bg-purple-500/10'
                  }`}
                >
                  <span className="text-purple-600 dark:text-purple-400 block text-[8px] sm:text-[9px] uppercase tracking-wider font-bold">
                    Events
                  </span>
                  <span className="font-bold text-purple-900 dark:text-purple-200 tabular-nums">
                    {currentTrip.items.length} items
                  </span>
                </button>

                <div className="w-px h-4 sm:h-5 bg-neutral-300 dark:bg-neutral-700" />

                {/* Est. Budget: Emerald (toggles budget breakdown) */}
                <button
                  type="button"
                  onClick={() => setActiveBreakdown((prev) => (prev === 'budget' ? null : 'budget'))}
                  aria-expanded={activeBreakdown === 'budget'}
                  title={activeBreakdown === 'budget' ? 'Hide budget breakdown' : 'View budget breakdown'}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-left transition-colors cursor-pointer ${
                    activeBreakdown === 'budget'
                      ? 'bg-emerald-500/15 ring-1 ring-emerald-500/35'
                      : 'hover:bg-emerald-500/10'
                  }`}
                >
                  <span className="text-emerald-600 dark:text-emerald-400 block text-[8px] sm:text-[9px] uppercase tracking-wider font-bold">
                    Est. Budget
                  </span>
                  <span className="font-bold font-mono text-emerald-900 dark:text-emerald-200 tabular-nums">
                    {formatCurrency(tripSummary.totalCost, currency)}
                  </span>
                </button>
              </div>

              {totalConflicts > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{totalConflicts} conflict{totalConflicts > 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Icon-only Calendar & Export button beside metrics pill */}
              <button
                type="button"
                onClick={() => setScreen('review')}
                title="Calendar & Export"
                aria-label="Calendar & Export"
                className="btn-primary p-2 sm:p-2.5 rounded-xl cursor-pointer shadow-xs flex items-center justify-center shrink-0"
              >
                <FileChartColumn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Category Breakdown (specific to Events or Est. Budget; hides 0 count / ₹0 items) */}
          {activeBreakdown === 'events' && (
            <div className="mt-2.5 pt-2.5 pb-1 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-neutral-500 dark:text-neutral-400 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 shrink-0">
                Events breakdown:
              </span>
              {eventsBreakdownCategories.length === 0 ? (
                <span>No events scheduled yet.</span>
              ) : (
                eventsBreakdownCategories.map((cat, idx) => (
                  <React.Fragment key={cat.id}>
                    {idx > 0 && <span className="text-neutral-300 dark:text-neutral-600">·</span>}
                    <span className={`font-mono tabular-nums font-medium whitespace-nowrap ${cat.textClass}`}>
                      {cat.label}: {cat.count}
                    </span>
                  </React.Fragment>
                ))
              )}
            </div>
          )}

          {activeBreakdown === 'budget' && (
            <div className="mt-2.5 pt-2.5 pb-1 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-neutral-500 dark:text-neutral-400 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 shrink-0">
                Budget breakdown:
              </span>
              {budgetBreakdownCategories.length === 0 ? (
                <span>No expenses recorded yet.</span>
              ) : (
                budgetBreakdownCategories.map((cat, idx) => (
                  <React.Fragment key={cat.id}>
                    {idx > 0 && <span className="text-neutral-300 dark:text-neutral-600">·</span>}
                    <span className={`font-mono tabular-nums font-medium whitespace-nowrap ${cat.textClass}`}>
                      {cat.label}: {formatCurrency(cat.amount, currency)}
                    </span>
                  </React.Fragment>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Calendar + All Items Area: fills remaining viewport height perfectly */}
      <div className="flex-1 min-h-0 w-full px-2 sm:px-6 flex gap-3 sm:gap-4 items-stretch overflow-hidden transition-all duration-300 ease-in-out">
        {sidebarOpen ? (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 p-3 pt-16 bg-slate-950/50 flex items-center justify-center md:static md:inset-auto md:z-auto md:p-0 md:bg-transparent md:block md:h-full"
          >
            <aside
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 glass-card modal-panel border border-black/10 dark:border-white/10 transition-all duration-300 flex flex-col w-full max-w-sm h-full max-h-[82dvh] md:max-h-none md:h-full md:w-72 lg:w-80 p-4 shadow-2xl md:shadow-none"
            >
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                title="Click to hide All Items"
                className="w-full flex items-center justify-between gap-2 p-2 mb-3 rounded-xl border border-black/5 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:border-blue-400/50 transition-all shrink-0 cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors">
                    <ListFilter className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    All Items ({currentTrip.items.length})
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 group-hover:text-blue-500 transition-colors">
                  <ChevronLeft className="w-4 h-4 hidden md:block" />
                  <X className="w-4 h-4 md:hidden" />
                  <span className="md:hidden">Hide</span>
                </span>
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

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 day-items-scroll mobile-no-scrollbar">
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
                                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                    setSidebarOpen(false);
                                  }
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
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            title="Click to view All Items"
            className="hidden md:flex shrink-0 glass-card border border-black/10 dark:border-white/10 transition-all duration-300 flex-col items-center justify-center gap-3 h-full w-14 p-2.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:border-blue-400/50 group"
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

        <div className="flex-1 min-w-0 h-full flex overflow-hidden">
          <GoogleCalendarTimeline
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      </div>
    </div>
  );
};
