import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Trash2, 
  Copy, 
  Edit3, 
  ExternalLink, 
  Sparkles, 
  Filter, 
  Plane, 
  Hotel, 
  UtensilsCrossed, 
  Camera, 
  Coffee, 
  FileText,
  Search,
  Grid,
  Columns,
  List,
  GripVertical,
  X
} from 'lucide-react';
import { useTrip, CalendarDensity } from '../context/TripContext';
import { ItineraryItem, ItemType } from '../types/trip';
import { 
  timeToMinutes, 
  formatDayDate, 
  formatDayOfWeek, 
  formatDuration, 
  getDurationMinutes, 
  addMinutesToTime, 
  checkDayConflicts, 
  formatTimeDisplay, 
  formatHourGutterLabel,
  layoutCalendarEvents,
  getDayDate,
  formatShortDate
} from '../utils/time';
import { openGoogleCalendar } from '../utils/gcal';
import { formatCurrency } from '../utils/currency';
import { generateSuggestionsForDay } from '../utils/suggestions';
type ViewMode = 'multi-day' | 'day' | 'agenda';

interface GoogleCalendarTimelineProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const DENSITY_HEIGHTS: Record<CalendarDensity, number> = {
  compact: 52,
  normal: 68,
  spacious: 88,
};

// Colors authentic to Google Calendar categories
const TYPE_STYLES: Record<ItemType, {
  bg: string;
  hoverBg: string;
  borderLeft: string;
  badgeBg: string;
  text: string;
  label: string;
  icon: React.ElementType;
}> = {
  travel: {
    bg: 'bg-blue-600 dark:bg-blue-600',
    hoverBg: 'hover:bg-blue-700 dark:hover:bg-blue-500',
    borderLeft: 'border-l-[3px] border-blue-300 dark:border-blue-200',
    badgeBg: 'bg-blue-500/20 text-blue-100',
    text: 'text-white',
    label: 'Travel',
    icon: Plane,
  },
  stay: {
    bg: 'bg-indigo-600 dark:bg-indigo-600',
    hoverBg: 'hover:bg-indigo-700 dark:hover:bg-indigo-500',
    borderLeft: 'border-l-[3px] border-indigo-300 dark:border-indigo-200',
    badgeBg: 'bg-indigo-500/20 text-indigo-100',
    text: 'text-white',
    label: 'Stay',
    icon: Hotel,
  },
  food: {
    bg: 'bg-amber-600 dark:bg-amber-600',
    hoverBg: 'hover:bg-amber-700 dark:hover:bg-amber-500',
    borderLeft: 'border-l-[3px] border-amber-300 dark:border-amber-200',
    badgeBg: 'bg-amber-500/20 text-amber-100',
    text: 'text-white',
    label: 'Food',
    icon: UtensilsCrossed,
  },
  activity: {
    bg: 'bg-emerald-600 dark:bg-emerald-600',
    hoverBg: 'hover:bg-emerald-700 dark:hover:bg-emerald-500',
    borderLeft: 'border-l-[3px] border-emerald-300 dark:border-emerald-200',
    badgeBg: 'bg-emerald-500/20 text-emerald-100',
    text: 'text-white',
    label: 'Activity',
    icon: Camera,
  },
  buffer: {
    bg: 'bg-sky-600 dark:bg-sky-600',
    hoverBg: 'hover:bg-sky-700 dark:hover:bg-sky-500',
    borderLeft: 'border-l-[3px] border-sky-300 dark:border-sky-200',
    badgeBg: 'bg-sky-500/20 text-sky-100',
    text: 'text-white',
    label: 'Buffer',
    icon: Coffee,
  },
  note: {
    bg: 'bg-slate-600 dark:bg-slate-600',
    hoverBg: 'hover:bg-slate-700 dark:hover:bg-slate-500',
    borderLeft: 'border-l-[3px] border-slate-300 dark:border-slate-200',
    badgeBg: 'bg-slate-500/20 text-slate-100',
    text: 'text-white',
    label: 'Note',
    icon: FileText,
  },
};

export const GoogleCalendarTimeline: React.FC<GoogleCalendarTimelineProps> = () => {
  const { 
    currentTrip, 
    activeDay, 
    setActiveDay, 
    openAddModal, 
    deleteItem, 
    duplicateItem, 
    moveItemToDay,
    currency,
    use12h,
    calendarDensity
  } = useTrip();

  const [viewMode, setViewMode] = useState<ViewMode>('multi-day');
  const [categoryFilter, setCategoryFilter] = useState<ItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [dragHoverTarget, setDragHoverTarget] = useState<{ day: number; hour: number; half: boolean } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  if (!currentTrip) return null;

  // Filter items
  const filteredItems = currentTrip.items.filter((item) => {
    if (categoryFilter !== 'all' && item.type !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchLoc = item.location?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchNotes) return false;
    }
    return true;
  });

  const hoursArray = Array.from({ length: totalHours }, (_, i) => startHour + i);

  // Days to show based on viewMode
  const visibleDays = viewMode === 'day' 
    ? [activeDay] 
    : Array.from({ length: currentTrip.numDays }, (_, i) => i + 1);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
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

  // Google Calendar "Now" indicator line calculation
  const currentLocalMinutes = (() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  })();
  const nowIndicatorTop = ((currentLocalMinutes - startHour * 60) / 60) * hourHeight;
  const isNowInGridRange = nowIndicatorTop >= 0 && nowIndicatorTop <= totalHours * hourHeight;

  // Active day suggestions
  const activeDaySuggestions = generateSuggestionsForDay(activeDay, currentTrip);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#12151c] rounded-2xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden select-none">
      {/* Google Calendar Toolbar */}
      <div className="px-3.5 py-2 border-b border-black/10 dark:border-white/10 bg-neutral-50/80 dark:bg-[#171b24]/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
        {/* Left: Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-200/60 dark:bg-neutral-800/80 text-[11px]">
            {(['all', 'travel', 'stay', 'food', 'activity'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Collapsible Search & View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Collapsible Search: icon-only by default, expands and focuses on click */}
          {isSearchOpen || searchQuery ? (
            <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-150">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery.trim()) {
                    setIsSearchOpen(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }
                }}
                placeholder="Search schedule..."
                className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-52 transition-all shadow-2xs"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                title="Close search"
                className="absolute right-2 p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              title="Search schedule"
              className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* View Mode Switcher: icon-only by default; reveals text on hover and when clicked (active) */}
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
                  className={`group relative flex items-center h-7 px-2 rounded-md font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out text-xs ${
                      isActive
                        ? 'max-w-24 opacity-100 ml-1.5'
                        : 'max-w-0 opacity-0 group-hover:max-w-24 group-hover:opacity-100 group-hover:ml-1.5'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      {viewMode === 'agenda' ? (
        /* Agenda View */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {Array.from({ length: currentTrip.numDays }, (_, i) => i + 1).map((day) => {
            const dayItems = filteredItems
              .filter((item) => item.day === day)
              .sort((a, b) => a.start.localeCompare(b.start));
            const dayConflicts = checkDayConflicts(dayItems);
            const dateStr = formatDayDate(currentTrip.startDate, day);
            const dow = formatDayOfWeek(currentTrip.startDate, day);

            return (
              <div 
                key={day}
                id={`agenda-day-${day}`}
                className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/40 dark:bg-neutral-900/40"
              >
                <div className="px-4 py-3 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {day}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {dow}, {dateStr}
                      </h3>
                      <span className="text-[11px] text-neutral-500">
                        {dayItems.length} event{dayItems.length !== 1 ? 's' : ''} scheduled
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openAddModal(day)}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-blue-600 text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {dayItems.map((item) => {
                    const style = TYPE_STYLES[item.type] || TYPE_STYLES.activity;
                    const Icon = style.icon;
                    const hasConflict = dayConflicts.some((c) => c.itemId1 === item.id || c.itemId2 === item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => openAddModal(item.day, undefined, item)}
                        className="p-3.5 flex items-start justify-between gap-4 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg} text-white`}>
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
              </div>
            );
          })}
        </div>
      ) : (
        /* True Google Calendar Multi-Day / Week / Day Grid View */
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative timeline-scroll-container"
        >
          <div 
            className="min-w-full"
            style={{
              // Column width: fixed width for multi-day to ensure readability, 100% for single day
              minWidth: viewMode === 'day' ? '100%' : `${64 + visibleDays.length * 240}px`,
            }}
          >
            {/* Sticky Day Header Row */}
            <div className="sticky top-0 z-30 flex bg-white/95 dark:bg-[#12151c]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
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
                  const isDayActive = activeDay === day;
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
              <div className="w-16 shrink-0 sticky left-0 z-20 bg-white/95 dark:bg-[#12151c]/95 border-r border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 select-none">
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

                        // Vertical position math
                        const topPx = ((startMin - startHour * 60) / 60) * hourHeight;
                        const heightPx = Math.max(28, (durationMin / 60) * hourHeight - 3);

                        // Horizontal position math for overlapping events
                        const colWidthPercent = 100 / totalCols;
                        const colLeftPercent = colIndex * colWidthPercent;

                        const style = TYPE_STYLES[item.type] || TYPE_STYLES.activity;
                        const Icon = style.icon;
                        const hasConflict = dayConflicts.some((c) => c.itemId1 === item.id || c.itemId2 === item.id);

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddModal(day, undefined, item);
                            }}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `calc(${colLeftPercent}% + 2px)`,
                              width: `calc(${colWidthPercent}% - 4px)`,
                            }}
                            className={`absolute z-10 rounded-lg p-1.5 sm:p-2 cursor-pointer shadow-xs transition-all overflow-hidden flex flex-col justify-between group/event select-none ${style.bg} ${style.hoverBg} ${style.borderLeft} ${style.text} ${
                              hasConflict ? 'ring-2 ring-amber-400' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1 leading-tight mb-0.5">
                                <div className="flex items-center gap-1 min-w-0">
                                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-90" />
                                  <span className="text-xs font-bold truncate">
                                    {item.title}
                                  </span>
                                </div>

                                {/* Event Quick Action Toolbar on Hover */}
                                <div className="opacity-0 group-hover/event:opacity-100 flex items-center gap-0.5 shrink-0 bg-black/20 dark:bg-black/40 rounded p-0.5 backdrop-blur-xs transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openGoogleCalendar(item, currentTrip);
                                    }}
                                    title="Add to Google Calendar"
                                    className="p-0.5 hover:text-blue-200"
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
                                    className="p-0.5 hover:text-blue-200"
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
                                    className="p-0.5 hover:text-red-300"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Time & Duration */}
                              <div className="text-[10px] font-mono opacity-90 flex items-center gap-1 truncate">
                                <span>
                                  {formatTimeDisplay(item.start, use12h)} – {formatTimeDisplay(item.end, use12h)}
                                </span>
                                <span>·</span>
                                <span>{formatDuration(durationMin)}</span>
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
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] opacity-90 hover:opacity-100 hover:underline max-w-full truncate cursor-pointer"
                                >
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </a>
                              )}
                            </div>

                            {/* Bottom row: cost or conflict tag (if height allows) */}
                            {heightPx > 42 && (
                              <div className="flex items-center justify-between gap-1 text-[9px] pt-0.5 mt-auto">
                                {hasConflict ? (
                                  <span className="inline-flex items-center gap-0.5 text-amber-200 font-semibold bg-black/20 px-1 rounded">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Conflict</span>
                                  </span>
                                ) : (
                                  <span className="opacity-70 capitalize font-medium">{item.type}</span>
                                )}

                                {item.cost ? (
                                  <span className="font-mono font-semibold tabular-nums ml-auto">
                                    {formatCurrency(item.cost, currency)}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Google Calendar Red Current Time Indicator Line */}
              {isNowInGridRange && (
                <div
                  style={{ top: `${nowIndicatorTop}px` }}
                  className="absolute left-16 right-0 z-20 pointer-events-none flex items-center"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shadow-xs" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Suggestions Strip at bottom */}
      {activeDaySuggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-[#171b24] flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1 shrink-0 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Smart Suggestions for Day {activeDay}:</span>
            </span>

            {activeDaySuggestions.slice(0, 4).map((sug) => (
              <button
                key={sug.id}
                type="button"
                onClick={() => {
                  openAddModal(activeDay, {
                    type: sug.type,
                    title: sug.defaultTitle,
                    day: activeDay,
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
