import React, { useState, useRef } from 'react';
import { Plus, AlertCircle, Calendar, Clock, List } from 'lucide-react';
import { ItineraryItem, Trip } from '../types/trip';
import { ItemCard } from './ItemCard';
import { SuggestionStrip } from './SuggestionStrip';
import { useTrip } from '../context/TripContext';
import { formatDayDate, formatDayOfWeek, checkDayConflicts, timeToMinutes, addMinutesToTime } from '../utils/time';
import { formatCurrency } from '../utils/currency';

interface DayColumnProps {
  day: number;
  trip: Trip;
  items: ItineraryItem[];
  isActive: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0');
  return `${h}:00`;
});

export const DayColumn: React.FC<DayColumnProps> = ({ day, trip, items, isActive }) => {
  const { openAddModal, moveItemToDay, currency } = useTrip();
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [dragHoverHour, setDragHoverHour] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const sortedItems = [...items].sort((a, b) => a.start.localeCompare(b.start));
  const conflicts = checkDayConflicts(sortedItems);
  const totalCost = sortedItems.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  const getConflictWarningForItem = (itemId: string): string | undefined => {
    const match = conflicts.find((c) => c.itemId1 === itemId || c.itemId2 === itemId);
    return match?.message;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
      setDragHoverHour(null);
    }
  };

  const handleDrop = (e: React.DragEvent, specificHour?: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    setDragHoverHour(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) {
      moveItemToDay(itemId, day, specificHour);
    }
  };

  const handleHourClick = (hourStr: string) => {
    openAddModal(day, {
      start: hourStr,
      end: addMinutesToTime(hourStr, 90),
    });
  };

  const getItemsForHour = (hourStr: string) => {
    const hourStart = timeToMinutes(hourStr);
    const hourEnd = hourStart + 60;
    return sortedItems.filter((i) => {
      const itemStart = timeToMinutes(i.start);
      return itemStart >= hourStart && itemStart < hourEnd;
    });
  };

  const dateLabel = formatDayDate(trip.startDate, day);
  const dayOfWeek = formatDayOfWeek(trip.startDate, day);

  return (
    <div
      id={`day-column-${day}`}
      data-day={day}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e)}
      className={`day-column-section w-[330px] sm:w-[370px] shrink-0 flex flex-col glass-card p-4 sm:p-5 border transition-all h-[calc(100vh-210px)] min-h-[580px] ${
        isDragOver
          ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-500/5'
          : isActive
          ? 'border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
          : 'border-black/10 dark:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {dayOfWeek}
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{dateLabel}</span>
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
            Day {day}
          </h3>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-[10px]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Cards view"
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="24-Hour schedule view"
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
              {sortedItems.length} items
            </span>
            {totalCost > 0 && (
              <>
                <span className="text-neutral-300 dark:text-neutral-600">·</span>
                <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                  {formatCurrency(totalCost, currency)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="mb-2 p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected</span>
        </div>
      )}

      {isDragOver && (
        <div className="pointer-events-none mb-2 p-2 rounded-xl border border-dashed border-blue-500 bg-blue-500/10 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse shrink-0">
          Drop here to move event to Day {day}
        </div>
      )}

      <div className="mb-2 shrink-0 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
          Day Schedule
        </span>
        <button
          type="button"
          onClick={() => openAddModal(day)}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto day-items-scroll pr-1.5 space-y-2.5 relative min-h-0">
        {viewMode === 'cards' ? (
          <>
            {sortedItems.length > 0 && (
              <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-neutral-200 dark:bg-neutral-800 -z-0 pointer-events-none" />
            )}

            {sortedItems.map((item) => (
              <div key={item.id} className="relative z-10 space-y-2">
                <ItemCard
                  item={item}
                  conflictWarning={getConflictWarningForItem(item.id)}
                />

                <div className="flex justify-center py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const sensibleStart = addMinutesToTime(item.end, 15);
                      openAddModal(day, { start: sensibleStart });
                    }}
                    title="Insert event after this item"
                    className="opacity-40 hover:opacity-100 p-1 rounded-full bg-white dark:bg-neutral-800 border border-black/10 dark:border-white/20 text-neutral-500 hover:text-blue-500 hover:scale-110 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {sortedItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-neutral-400 mb-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-2 font-medium">
                  No items scheduled for Day {day}.
                </p>
                <p className="text-[11px] text-neutral-400 mb-3">
                  Click any hour above or start scheduling:
                </p>
                <button
                  type="button"
                  onClick={() => openAddModal(day, { start: trip.preferences.dailyStartTime || '09:00' })}
                  className="chip text-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add First Item</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-1.5">
            {HOURS.map((hourStr) => {
              const hourItems = getItemsForHour(hourStr);
              const isHovered = dragHoverHour === hourStr;

              return (
                <div
                  key={hourStr}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragHoverHour(hourStr);
                  }}
                  onDrop={(e) => handleDrop(e, hourStr)}
                  className={`p-2 rounded-xl border transition-all ${
                    isHovered
                      ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                      : hourItems.length > 0
                      ? 'bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/5'
                      : 'border-dashed border-black/10 dark:border-white/10 hover:border-blue-400 hover:bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono tabular-nums text-neutral-400 text-[11px]">
                      {hourStr}
                    </span>
                    {hourItems.length === 0 && (
                      <button
                        type="button"
                        onClick={() => handleHourClick(hourStr)}
                        className="text-[10px] text-blue-500 hover:underline cursor-pointer opacity-70 hover:opacity-100 flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Schedule</span>
                      </button>
                    )}
                  </div>

                  {hourItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => openAddModal(day, undefined, item)}
                      className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 shadow-2xs hover:border-blue-400 cursor-pointer text-xs mb-1 transition-all"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-neutral-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 shrink-0">
                          {item.start}–{item.end}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 pt-2">
        <SuggestionStrip day={day} />
      </div>
    </div>
  );
};
