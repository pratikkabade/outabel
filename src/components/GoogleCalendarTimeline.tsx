import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  MapPin, 
  AlertTriangle, 
  Trash2, 
  Copy, 
  Sparkles, 
  Grid,
  Columns,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTrip, CalendarDensity } from '../context/TripContext';
import { ItineraryItem, ItemType } from '../types/trip';
import { resolveCalendarCategory } from '../utils/calendarCategories';
import { 
  timeToMinutes, 
  minutesToTime,
  formatDayDate, 
  formatDayOfWeek, 
  formatDuration, 
  getDurationMinutes, 
  addMinutesToTime, 
  checkDayConflicts, 
  formatTimeDisplay, 
  formatHourGutterLabel,
  layoutCalendarEvents,
  getDayDate
} from '../utils/time';
import { openGoogleCalendar } from '../utils/gcal';
import { formatCurrency } from '../utils/currency';
import { generateSuggestionsForDay } from '../utils/suggestions';
type ViewMode = 'multi-day' | 'day' | 'agenda';

interface GoogleCalendarTimelineProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  categoryFilter: ItemType | 'all';
}

const DENSITY_HEIGHTS: Record<CalendarDensity, number> = {
  compact: 52,
  normal: 68,
  spacious: 88,
};

export const GoogleCalendarTimeline: React.FC<GoogleCalendarTimelineProps> = ({
  categoryFilter,
}) => {
  const { 
    currentTrip, 
    activeDay, 
    setActiveDay, 
    openAddModal, 
    updateItem,
    deleteItem, 
    duplicateItem, 
    moveItemToDay,
    calendarCategories,
    currency,
    use12h,
    calendarDensity
  } = useTrip();

  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'agenda' : 'multi-day'
  );
  const [dragHoverTarget, setDragHoverTarget] = useState<{ day: number; hour: number; half: boolean } | null>(null);
  const [resizeState, setResizeState] = useState<{
    itemId: string;
    startY: number;
    startScrollTop: number;
    startMin: number;
    initialEndMin: number;
    currentEndMin: number;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const agendaScrollRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{
    itemId: string;
    startY: number;
    startScrollTop: number;
    startMin: number;
    initialEndMin: number;
    currentEndMin: number;
  } | null>(null);
  const suppressClickRef = useRef<boolean>(false);
  const hourHeight = DENSITY_HEIGHTS[calendarDensity];

  // Dynamic start & end hours so users see early or late events without unnecessary empty hours
  const { startHour, endHour, totalHours } = useMemo(() => {
    if (!currentTrip || currentTrip.items.length === 0) {
      return { startHour: 7, endHour: 23, totalHours: 17 };
    }

    let minHour = 8;
    let maxHour = 22;

    currentTrip.items.forEach((item) => {
      const sH = Math.floor(timeToMinutes(item.start) / 60);
      const eH = Math.ceil(timeToMinutes(item.end) / 60);
      if (sH < minHour) minHour = sH;
      if (eH > maxHour) maxHour = eH;
    });

    const safeStart = Math.max(0, minHour - 1);
    const safeEnd = Math.min(24, Math.max(safeStart + 12, maxHour + 1));
    return {
      startHour: safeStart,
      endHour: safeEnd,
      totalHours: safeEnd - safeStart,
    };
  }, [currentTrip]);

  // Scroll to reasonable morning hour (08:00) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollOffset = Math.max(0, (8 - startHour) * hourHeight);
      scrollContainerRef.current.scrollTop = scrollOffset;
    }
  }, [startHour, hourHeight]);

  // Global pointer listeners while resizing an event's bottom edge
  const isResizingActive = resizeState !== null;
  useEffect(() => {
    if (!isResizingActive) return;

    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = 'ns-resize';

    const handlePointerMove = (e: PointerEvent) => {
      const current = resizeRef.current;
      if (!current) return;

      const currentScrollTop = scrollContainerRef.current?.scrollTop ?? 0;
      const deltaY = (e.clientY - current.startY) + (currentScrollTop - current.startScrollTop);

      if (Math.abs(deltaY) < 4 && current.currentEndMin === current.initialEndMin) {
        return;
      }

      const deltaMinutes = (deltaY / hourHeight) * 60;
      const rawEndMin = current.initialEndMin + deltaMinutes;
      const snappedEndMin = Math.round(rawEndMin / 15) * 15;
      const clampedEndMin = Math.min(24 * 60 - 1, Math.max(current.startMin + 15, snappedEndMin));

      if (clampedEndMin !== current.currentEndMin) {
        const updated = { ...current, currentEndMin: clampedEndMin };
        resizeRef.current = updated;
        setResizeState(updated);
      }
    };

    const handlePointerUp = () => {
      const finalResize = resizeRef.current;
      resizeRef.current = null;
      setResizeState(null);
      document.body.style.cursor = prevCursor;

      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 150);

      if (!finalResize || !currentTrip) return;
      const targetItem = currentTrip.items.find((i) => i.id === finalResize.itemId);
      if (!targetItem) return;

      const newEnd = minutesToTime(finalResize.currentEndMin);
      if (newEnd !== targetItem.end) {
        updateItem({ ...targetItem, end: newEnd });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.body.style.cursor = prevCursor;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isResizingActive, hourHeight, currentTrip, updateItem]);

  if (!currentTrip) return null;

  const safeActiveDay = Math.min(Math.max(1, activeDay), currentTrip.numDays);

  const navigateToDay = (targetDay: number) => {
    const clamped = Math.min(Math.max(1, targetDay), currentTrip.numDays);
    setActiveDay(clamped);

    if (viewMode === 'agenda' && agendaScrollRef.current) {
      const el = document.getElementById(`agenda-day-${clamped}`);
      if (el) {
        const container = agendaScrollRef.current;
        const delta = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
        container.scrollTo({ top: container.scrollTop + delta, behavior: 'smooth' });
      }
    } else if (viewMode === 'multi-day' && scrollContainerRef.current) {
      const col = scrollContainerRef.current.querySelector(`[data-day="${clamped}"]`) as HTMLElement | null;
      if (col) {
        col.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    }
  };

  // Filter items
  const filteredItems = currentTrip.items.filter((item) => {
    if (categoryFilter !== 'all' && item.type !== categoryFilter) return false;
    return true;
  });

  const hoursArray = Array.from({ length: totalHours }, (_, i) => startHour + i);

  // Days to show based on viewMode
  const visibleDays = viewMode === 'day' 
    ? [safeActiveDay] 
    : Array.from({ length: currentTrip.numDays }, (_, i) => i + 1);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (resizeRef.current) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleResizeStart = (e: React.PointerEvent, item: ItineraryItem) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const startMin = timeToMinutes(item.start);
    const durationMin = getDurationMinutes(item.start, item.end);
    const initialEndMin = Math.min(24 * 60 - 1, Math.max(startMin + 15, startMin + durationMin));
    const startScrollTop = scrollContainerRef.current?.scrollTop ?? 0;

    const initialState = {
      itemId: item.id,
      startY: e.clientY,
      startScrollTop,
      startMin,
      initialEndMin,
      currentEndMin: initialEndMin,
    };
    resizeRef.current = initialState;
    setResizeState(initialState);
  };

  const handleDragOverSlot = (e: React.DragEvent, day: number, hour: number, half: boolean) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragHoverTarget({ day, hour, half });
  };

  const handleDropOnSlot = (e: React.DragEvent, day: number, hour: number, half: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragHoverTarget(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;

    const hourStr = hour.toString().padStart(2, '0');
    const minuteStr = half ? '30' : '00';
    const newStartTime = `${hourStr}:${minuteStr}`;
    moveItemToDay(itemId, day, newStartTime);
  };

  // Click on empty grid slot to create new event
  const handleSlotClick = (day: number, hour: number, half: boolean = false) => {
    const hourStr = hour.toString().padStart(2, '0');
    const minuteStr = half ? '30' : '00';
    const startTime = `${hourStr}:${minuteStr}`;
    const endTime = addMinutesToTime(startTime, 90);
    openAddModal(day, {
      start: startTime,
      end: endTime,
    });
  };

  // Active day suggestions
  const activeDaySuggestions = generateSuggestionsForDay(safeActiveDay, currentTrip);

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#12151c] rounded-2xl border border-black/10 dark:border-white/10 shadow-sm select-none">
      {/* Google Calendar Toolbar: Week Grid, Day, Agenda */}
      <div className="px-2.5 sm:px-3.5 py-2 border-b border-black/10 dark:border-white/10 glass-sticky rounded-t-2xl flex items-center justify-end gap-2 shrink-0">
        {/* View Mode Switcher: icon-only by default; reveals text smoothly on hover and when active */}
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-200/60 dark:bg-neutral-800/80 text-[11px]">
          {[
            { id: 'multi-day' as const, label: 'Week Grid', icon: Columns },
            { id: 'day' as const, label: 'Day', icon: Grid },
            { id: 'agenda' as const, label: 'Agenda', icon: List },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = viewMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                title={label}
                className={`group relative flex items-center h-7 px-2 rounded-md font-medium transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span
                  className={`inline-grid transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? 'grid-cols-[1fr]'
                      : 'grid-cols-[0fr] group-hover:grid-cols-[1fr]'
                  }`}
                >
                  <span className="min-w-0 overflow-hidden whitespace-nowrap">
                    <span
                      className={`inline-block pl-1.5 text-xs transition-opacity duration-300 ease-out ${
                        isActive
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {label}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Calendar Area */}
      {viewMode === 'agenda' ? (
        /* Agenda View with flush-top pinned sticky date headers & Glass OS blur */
        <div
          ref={agendaScrollRef}
          className={`relative flex-1 overflow-y-auto px-2.5 sm:px-6 pb-6 pt-0 space-y-4 mobile-no-scrollbar ${
            activeDaySuggestions.length === 0 ? 'rounded-b-2xl' : ''
          }`}
        >
          {Array.from({ length: currentTrip.numDays }, (_, i) => i + 1).map((day) => {
            const dayItems = filteredItems
              .filter((item) => item.day === day)
              .sort((a, b) => a.start.localeCompare(b.start));
            const dayConflicts = checkDayConflicts(dayItems);
            const dateStr = formatDayDate(currentTrip.startDate, day);
            const dow = formatDayOfWeek(currentTrip.startDate, day);
            const dayCost = dayItems.reduce((acc, curr) => acc + (curr.cost || 0), 0);
            const isDayActive = safeActiveDay === day;

            return (
              <section
                key={day}
                id={`agenda-day-${day}`}
                className="rounded-2xl bg-white dark:bg-[#171a21]/90 border border-neutral-200 dark:border-neutral-800 shadow-xs"
              >
                <div
                  onClick={() => setActiveDay(day)}
                  className="sticky top-0 z-20 flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-t-2xl glass-sticky border-b border-neutral-200/80 dark:border-neutral-800/80 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg font-bold font-mono text-xs flex items-center justify-center shrink-0 transition-colors ${
                        isDayActive
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      D{day}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {dow}, {dateStr}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>{dayItems.length} event{dayItems.length !== 1 ? 's' : ''}</span>
                        {dayCost > 0 && (
                          <>
                            <span>·</span>
                            <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                              {formatCurrency(dayCost, currency)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddModal(day);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-b-2xl">
                  {dayItems.map((item) => {
                    const { style, icon: Icon } = resolveCalendarCategory(item.type, calendarCategories);
                    const hasConflict = dayConflicts.some((c) => c.itemId1 === item.id || c.itemId2 === item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => openAddModal(item.day, undefined, item)}
                        className="p-3.5 flex items-start justify-between gap-4 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.iconText} border border-black/5 dark:border-white/10`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                {item.title}
                              </h4>
                              {hasConflict && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Conflict</span>
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                              {formatTimeDisplay(item.start, use12h)} – {formatTimeDisplay(item.end, use12h)} ({formatDuration(getDurationMinutes(item.start, item.end))})
                            </div>

                            {item.location && (
                              <a
                                href={`https://maps.google.co.in/?q=${encodeURIComponent(item.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`View "${item.location}" on Google Maps`}
                                className="inline-flex items-center gap-1 mt-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline max-w-full truncate cursor-pointer font-medium"
                              >
                                <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                                <span className="truncate">{item.location}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.cost ? (
                            <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300 mr-2">
                              {formatCurrency(item.cost, currency)}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openGoogleCalendar(item, currentTrip);
                            }}
                            title="Export to Google Calendar"
                            className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-blue-500 transition-colors"
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                            title="Delete"
                            className="p-1 rounded-md hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {dayItems.length === 0 && (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      No events scheduled for Day {day}. Click &quot;Add&quot; to plan this day.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* True Google Calendar Multi-Day / Week / Day Grid View */
        <div 
          ref={scrollContainerRef}
          className={`flex-1 overflow-auto relative timeline-scroll-container mobile-no-scrollbar ${
            activeDaySuggestions.length === 0 ? 'rounded-b-2xl' : ''
          }`}
        >
          <div 
            className="min-w-full"
            style={{
              // Column width: fixed width for multi-day to ensure readability, 100% for single day
              minWidth: viewMode === 'day' ? '100%' : `${64 + visibleDays.length * 240}px`,
            }}
          >
            {/* Sticky Day Header Row */}
            <div className="sticky top-0 z-30 flex glass-sticky border-b border-neutral-200/80 dark:border-neutral-800/80">
              {/* Top-left Timezone indicator */}
              <div className="w-16 shrink-0 border-r border-neutral-200 dark:border-neutral-800 p-2 flex flex-col items-center justify-center text-[10px] text-neutral-400 font-mono">
                <span>TIME</span>
                <span className="text-[9px] opacity-70">({use12h ? '12h' : '24h'})</span>
              </div>

              {/* Day Column Headers */}
              <div className="flex-1 flex divide-x divide-neutral-200 dark:divide-neutral-800">
                {visibleDays.map((day) => {
                  const dayItems = filteredItems.filter((i) => i.day === day);
                  const dayConflicts = checkDayConflicts(dayItems);
                  const isDayActive = safeActiveDay === day;
                  const dow = formatDayOfWeek(currentTrip.startDate, day);
                  const dateObj = getDayDate(currentTrip.startDate, day);
                  const dateNum = dateObj.getDate();
                  const dayCost = dayItems.reduce((acc, curr) => acc + (curr.cost || 0), 0);

                  return (
                    <div
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={`flex-1 min-w-[220px] p-2.5 transition-colors cursor-pointer group ${
                        isDayActive 
                          ? 'bg-blue-50/50 dark:bg-blue-950/20' 
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {viewMode === 'day' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToDay(safeActiveDay - 1);
                              }}
                              disabled={safeActiveDay <= 1}
                              title="Previous date"
                              aria-label="Previous date"
                              className="w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}

                          {/* Google Calendar Signature Circular Date Badge */}
                          <div 
                            className={`w-9 h-9 rounded-full flex flex-col items-center justify-center transition-transform ${
                              isDayActive
                                ? 'bg-blue-600 text-white font-bold shadow-sm scale-105'
                                : 'text-neutral-800 dark:text-neutral-200 font-semibold group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'
                            }`}
                          >
                            <span className="text-sm tabular-nums leading-none font-bold">
                              {dateNum}
                            </span>
                          </div>

                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                              {dow}
                            </div>
                            <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                              Day {day}
                            </div>
                          </div>

                          {viewMode === 'day' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToDay(safeActiveDay + 1);
                              }}
                              disabled={safeActiveDay >= currentTrip.numDays}
                              title="Next date"
                              aria-label="Next date"
                              className="w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddModal(day);
                            }}
                            title={`Add event to Day ${day}`}
                            className="p-1 rounded-full hover:bg-blue-500/10 text-neutral-400 hover:text-blue-600 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
                            <span>{dayItems.length} items</span>
                            {dayCost > 0 && (
                              <>
                                <span>·</span>
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                  {formatCurrency(dayCost, currency)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Conflict Alert Banner if any on this day */}
                      {dayConflicts.length > 0 && (
                        <div className="mt-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" />
                          <span className="truncate">{dayConflicts.length} conflict{dayConflicts.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Body */}
            <div className="flex relative">
              {/* Left Sticky Time Gutter */}
              <div className="w-16 shrink-0 sticky left-0 z-20 glass-sticky border-r border-neutral-200/80 dark:border-neutral-800/80 divide-y divide-neutral-200 dark:divide-neutral-800 select-none">
                {hoursArray.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${hourHeight}px` }}
                    className="relative text-right pr-2 text-[11px] font-mono text-neutral-400 dark:text-neutral-500"
                  >
                    {/* Hour Label aligned exactly with the horizontal border */}
                    <span className="absolute -top-2.5 right-2 bg-white dark:bg-[#12151c] px-1 rounded">
                      {formatHourGutterLabel(hour, use12h)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Schedule Columns */}
              <div className="flex-1 flex divide-x divide-neutral-200 dark:divide-neutral-800 relative">
                {visibleDays.map((day) => {
                  const dayItems = filteredItems.filter((i) => i.day === day);
                  const positionedItems = layoutCalendarEvents(dayItems);
                  const dayConflicts = checkDayConflicts(dayItems);

                  return (
                    <div
                      key={day}
                      data-day={day}
                      className="flex-1 min-w-[220px] relative divide-y divide-neutral-200 dark:divide-neutral-800"
                    >
                      {/* Hour Grid Rows with 30-min dashed sub-line */}
                      {hoursArray.map((hour) => {
                        const isHoveredTop = dragHoverTarget?.day === day && dragHoverTarget.hour === hour && !dragHoverTarget.half;
                        const isHoveredBottom = dragHoverTarget?.day === day && dragHoverTarget.hour === hour && dragHoverTarget.half;

                        return (
                          <div
                            key={hour}
                            style={{ height: `${hourHeight}px` }}
                            className="relative group/hour"
                          >
                            {/* Top 30 minutes slot */}
                            <div
                              onClick={() => handleSlotClick(day, hour, false)}
                              onDragOver={(e) => handleDragOverSlot(e, day, hour, false)}
                              onDrop={(e) => handleDropOnSlot(e, day, hour, false)}
                              className={`h-1/2 w-full transition-colors cursor-pointer border-b border-dashed border-neutral-100 dark:border-neutral-800/60 relative ${
                                isHoveredTop
                                  ? 'bg-blue-500/20 ring-1 ring-blue-500'
                                  : 'hover:bg-blue-500/[0.04] dark:hover:bg-blue-400/[0.04]'
                              }`}
                            >
                              <span className="opacity-0 group-hover/hour:opacity-70 text-[9px] text-blue-500 font-mono pl-1.5 pt-0.5 block select-none pointer-events-none">
                                + {formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`, use12h)}
                              </span>
                            </div>

                            {/* Bottom 30 minutes slot */}
                            <div
                              onClick={() => handleSlotClick(day, hour, true)}
                              onDragOver={(e) => handleDragOverSlot(e, day, hour, true)}
                              onDrop={(e) => handleDropOnSlot(e, day, hour, true)}
                              className={`h-1/2 w-full transition-colors cursor-pointer relative ${
                                isHoveredBottom
                                  ? 'bg-blue-500/20 ring-1 ring-blue-500'
                                  : 'hover:bg-blue-500/[0.04] dark:hover:bg-blue-400/[0.04]'
                              }`}
                            >
                              <span className="opacity-0 group-hover/hour:opacity-70 text-[9px] text-blue-500 font-mono pl-1.5 pt-0.5 block select-none pointer-events-none">
                                + {formatTimeDisplay(`${hour.toString().padStart(2, '0')}:30`, use12h)}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Google Calendar Event Chips / Blocks */}
                      {positionedItems.map(({ item, colIndex, totalCols }) => {
                        const startMin = timeToMinutes(item.start);
                        const endMin = timeToMinutes(item.end);
                        const durationMin = getDurationMinutes(item.start, item.end);

                        const isResizingThis = resizeState?.itemId === item.id;
                        const effectiveEndMin = isResizingThis ? resizeState.currentEndMin : endMin;
                        const effectiveDurationMin = isResizingThis
                          ? Math.max(15, effectiveEndMin - startMin)
                          : durationMin;
                        const displayEndStr = isResizingThis ? minutesToTime(effectiveEndMin) : item.end;

                        // Vertical position math
                        const topPx = ((startMin - startHour * 60) / 60) * hourHeight;
                        const heightPx = Math.max(28, (effectiveDurationMin / 60) * hourHeight - 3);

                        // Horizontal position math for overlapping events
                        const colWidthPercent = 100 / totalCols;
                        const colLeftPercent = colIndex * colWidthPercent;

                        const { label: catLabel, style, icon: Icon } = resolveCalendarCategory(
                          item.type,
                          calendarCategories
                        );
                        const hasConflict = dayConflicts.some((c) => c.itemId1 === item.id || c.itemId2 === item.id);

                        return (
                          <div
                            key={item.id}
                            draggable={!isResizingActive}
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (suppressClickRef.current || resizeRef.current) return;
                              openAddModal(day, undefined, item);
                            }}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `calc(${colLeftPercent}% + 2px)`,
                              width: `calc(${colWidthPercent}% - 4px)`,
                            }}
                            className={`absolute rounded-lg px-1.5 pt-1.5 pb-2.5 sm:px-2 sm:pt-2 sm:pb-2.5 cursor-pointer shadow-xs overflow-hidden flex flex-col justify-between group/event select-none ${style.bg} ${style.hoverBg} ${style.border} ${style.text} ${
                              isResizingThis
                                ? 'z-30 ring-2 ring-blue-500 dark:ring-white shadow-xl transition-none'
                                : `z-10 transition-all ${hasConflict ? 'ring-2 ring-amber-400' : ''}`
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1 leading-tight mb-0.5">
                                <div className="flex items-center gap-1 min-w-0">
                                  <Icon className={`w-3.5 h-3.5 shrink-0 ${style.iconText}`} />
                                  <span className="text-xs font-bold truncate">
                                    {item.title}
                                  </span>
                                </div>

                                {/* Event Quick Action Toolbar on Hover */}
                                <div className="opacity-0 group-hover/event:opacity-100 flex items-center gap-0.5 shrink-0 bg-white/85 dark:bg-black/45 text-neutral-600 dark:text-neutral-200 rounded p-0.5 backdrop-blur-xs shadow-2xs transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openGoogleCalendar(item, currentTrip);
                                    }}
                                    title="Add to Google Calendar"
                                    className="p-0.5 hover:text-blue-600 dark:hover:text-blue-300"
                                  >
                                    <CalendarIcon className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      duplicateItem(item.id);
                                    }}
                                    title="Duplicate"
                                    className="p-0.5 hover:text-blue-600 dark:hover:text-blue-300"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem(item.id);
                                    }}
                                    title="Delete"
                                    className="p-0.5 hover:text-red-600 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Time & Duration */}
                              <div className={`text-[10px] font-mono font-medium flex items-center gap-1 truncate ${style.timeText}`}>
                                <span>
                                  {formatTimeDisplay(item.start, use12h)} – {formatTimeDisplay(displayEndStr, use12h)}
                                </span>
                                <span>·</span>
                                <span>{formatDuration(effectiveDurationMin)}</span>
                              </div>

                              {/* Location (if tall enough) */}
                              {heightPx > 50 && item.location && (
                                <a
                                  href={`https://maps.google.co.in/?q=${encodeURIComponent(item.location)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  draggable={false}
                                  onDragStart={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  title={`View "${item.location}" on Google Maps`}
                                  className={`inline-flex items-center gap-1 mt-1 text-[10px] font-medium hover:underline max-w-full truncate cursor-pointer ${style.link}`}
                                >
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </a>
                              )}
                            </div>

                            {/* Bottom row: cost or conflict tag (if height allows) */}
                            {heightPx > 42 && (
                              <div className="flex items-center justify-between gap-1 text-[9px] pt-0.5 mt-auto">
                                {isResizingThis ? (
                                  <span className="inline-flex items-center gap-1 bg-neutral-900/85 dark:bg-black/60 text-white font-mono font-semibold px-1.5 py-0.5 rounded">
                                    Ends {formatTimeDisplay(displayEndStr, use12h)} ({formatDuration(effectiveDurationMin)})
                                  </span>
                                ) : hasConflict ? (
                                  <span className="inline-flex items-center gap-0.5 text-amber-800 dark:text-amber-200 font-semibold bg-amber-500/20 px-1 rounded">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Conflict</span>
                                  </span>
                                ) : (
                                  <span className={`font-semibold px-1.5 py-0.2 rounded-full ${style.badge}`}>
                                    {catLabel}
                                  </span>
                                )}

                                {item.cost ? (
                                  <span className="font-mono font-semibold tabular-nums ml-auto text-neutral-800 dark:text-neutral-100">
                                    {formatCurrency(item.cost, currency)}
                                  </span>
                                ) : null}
                              </div>
                            )}

                            {/* Bottom Drag-to-Resize Handle */}
                            <div
                              role="separator"
                              aria-orientation="horizontal"
                              aria-label="Drag to adjust event end time"
                              title="Drag to extend or shorten time"
                              draggable={false}
                              onPointerDown={(e) => handleResizeStart(e, item)}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              onDragStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute bottom-0 left-0 right-0 h-2.5 flex items-center justify-center cursor-ns-resize group/resize z-20 hover:bg-black/5 dark:hover:bg-white/10 transition-colors touch-none"
                            >
                              <span
                                className={`h-[3px] rounded-full transition-all pointer-events-none ${
                                  isResizingThis
                                    ? `w-12 ${style.resizePillHover}`
                                    : `w-8 ${style.resizePill} group-hover/resize:w-12 group-hover/resize:opacity-100`
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Suggestions Strip at bottom */}
      {activeDaySuggestions.length > 0 && (
        <div className="px-3 sm:px-4 py-2 border-t border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-[#171b24] rounded-b-2xl flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mobile-no-scrollbar">
            <span className="font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1 shrink-0 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Smart Suggestions for Day {safeActiveDay}:</span>
            </span>

            {activeDaySuggestions.slice(0, 4).map((sug) => (
              <button
                key={sug.id}
                type="button"
                onClick={() => {
                  openAddModal(safeActiveDay, {
                    type: sug.type,
                    title: sug.defaultTitle,
                    day: safeActiveDay,
                    start: sug.defaultTime,
                    end: addMinutesToTime(sug.defaultTime, sug.defaultDurationMinutes),
                    ...sug.metadata,
                  });
                }}
                title={sug.contextReason}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-[11px] flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>{sug.label}</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-neutral-400 hidden lg:block shrink-0">
            Click any hour slot on the calendar grid to schedule an event
          </div>
        </div>
      )}
    </div>
  );
};
