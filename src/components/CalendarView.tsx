import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Download, 
  Share2, 
  Printer, 
  Plus, 
  Check, 
  Clock, 
  MapPin, 
  ExternalLink,
  Luggage,
  CheckSquare,
  Square,
  Trash2,
  X,
  Sparkles
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { downloadICS } from '../utils/ics';
import { openGoogleCalendar } from '../utils/gcal';
import { copyShareableUrl, triggerPrint } from '../utils/share';
import { formatDayDate, formatDayOfWeek, getDayDate, formatShortDate } from '../utils/time';
import { formatCurrency } from '../utils/currency';
import { PackingItem } from '../types/trip';

export const CalendarView: React.FC = () => {
  const { 
    currentTrip, 
    openAddModal, 
    showToast, 
    togglePackingItem, 
    addPackingItem, 
    deletePackingItem,
    currency 
  } = useTrip();

  const [viewMode, setViewMode] = useState<'calendar' | 'packing'>('calendar');
  const [calendarViewType, setCalendarViewType] = useState<'week' | 'month'>('week');
  const [newPackingText, setNewPackingText] = useState('');
  const [newPackingCategory, setNewPackingCategory] = useState<PackingItem['category']>('essentials');
  const [isGCalBatchModalOpen, setIsGCalBatchModalOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  if (!currentTrip) return null;

  const handleExportICS = () => {
    downloadICS(currentTrip);
    showToast('Downloaded .ics file for Apple & Outlook calendars');
  };

  const handleStartBatchGCal = () => {
    if (currentTrip.items.length === 0) {
      showToast('No events in itinerary to export');
      return;
    }

    let count = 0;
    const total = currentTrip.items.length;
    setBatchProgress(0);

    currentTrip.items.forEach((item, idx) => {
      setTimeout(() => {
        openGoogleCalendar(item, currentTrip);
        count++;
        setBatchProgress(Math.round((count / total) * 100));
        if (count === total) {
          showToast(`Opened all ${total} events in Google Calendar`);
          setTimeout(() => setIsGCalBatchModalOpen(false), 1200);
        }
      }, idx * 250);
    });
  };

  const handleShare = async () => {
    const ok = await copyShareableUrl(currentTrip);
    if (ok) {
      showToast('Shareable link copied to clipboard!');
    } else {
      showToast('Could not copy link to clipboard');
    }
  };

  const handleAddPacking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackingText.trim()) return;
    addPackingItem(newPackingText.trim(), newPackingCategory);
    setNewPackingText('');
  };

  const packingList = currentTrip.packingList || [];
  const packedCount = packingList.filter((i) => i.packed).length;

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-65px)] pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="glass-card p-5 sm:p-6 border border-black/5 dark:border-white/10 mb-6 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                <span>Itinerary Review & Export</span>
                <span>·</span>
                <span>{currentTrip.numDays} Days</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {currentTrip.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsGCalBatchModalOpen(true)}
                className="btn-primary text-xs py-2 px-3.5 cursor-pointer"
                title="Direct import to Google Calendar"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Import to Google Calendar</span>
              </button>

              <button
                type="button"
                onClick={handleExportICS}
                className="btn-ghost text-xs py-2 px-3.5 cursor-pointer"
                title="Universal iCal format for Apple Calendar & Outlook"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ics</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="btn-ghost text-xs py-2 px-3 cursor-pointer"
                title="Copy share link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={triggerPrint}
                className="btn-ghost text-xs py-2 px-3 cursor-pointer"
                title="Print itinerary"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-black/10'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('packing')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'packing'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-black/10'
              }`}
            >
              <Luggage className="w-3.5 h-3.5" />
              <span>Packing Checklist ({packedCount}/{packingList.length})</span>
            </button>
          </div>
        </div>

        {viewMode === 'calendar' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Trip Agenda & Timing
              </h2>

              <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setCalendarViewType('week')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    calendarViewType === 'week'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Daily Flow
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarViewType('month')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    calendarViewType === 'month'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Grid Overview
                </button>
              </div>
            </div>

            {calendarViewType === 'week' ? (
              <div className="space-y-4">
                {Array.from({ length: currentTrip.numDays }, (_, i) => i + 1).map((d) => {
                  const dayItems = currentTrip.items
                    .filter((item) => item.day === d)
                    .sort((a, b) => a.start.localeCompare(b.start));
                  const dateStr = formatDayDate(currentTrip.startDate, d);
                  const dow = formatDayOfWeek(currentTrip.startDate, d);

                  return (
                    <div 
                      key={d}
                      className="glass-card p-5 border border-black/5 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold font-mono text-xs flex items-center justify-center">
                            D{d}
                          </span>
                          <div>
                            <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                              {dow}, {dateStr}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openAddModal(d)}
                          className="no-print p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-blue-500 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Item</span>
                        </button>
                      </div>

                      {dayItems.length === 0 ? (
                        <div className="py-4 text-center text-xs text-neutral-400">
                          No items scheduled for this day
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {dayItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => openAddModal(item.day, undefined, item)}
                              className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400 font-medium">
                                    {item.start} – {item.end}
                                  </span>
                                  <span className="chip text-[10px] py-0 px-2 capitalize">
                                    {item.type}
                                  </span>
                                </div>
                                <div className="font-medium text-xs text-neutral-900 dark:text-white truncate">
                                  {item.title}
                                </div>
                                {item.location && (
                                  <a
                                    href={`https://maps.google.co.in/?q=${encodeURIComponent(item.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title={`View "${item.location}" on Google Maps`}
                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline max-w-full truncate mt-1 cursor-pointer font-medium"
                                  >
                                    <MapPin className="w-3 h-3 shrink-0 text-blue-500" />
                                    <span className="truncate">{item.location}</span>
                                  </a>
                                )}
                              </div>
                              {item.cost ? (
                                <div className="mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[11px] font-mono text-right text-neutral-600 dark:text-neutral-300">
                                  {formatCurrency(item.cost, currency)}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: currentTrip.numDays }, (_, i) => i + 1).map((d) => {
                  const dayItems = currentTrip.items.filter((item) => item.day === d);
                  return (
                    <div 
                      key={d}
                      className="glass-card p-4 border border-black/5 dark:border-white/10 flex flex-col"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10 mb-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">Day {d}</span>
                        <span className="text-xs text-neutral-500 font-mono">{formatShortDate(currentTrip.startDate, d)}</span>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        {dayItems.map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => openAddModal(item.day, undefined, item)}
                            className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.04] text-xs hover:bg-blue-500/10 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="min-w-0 truncate">
                                <span className="font-mono text-neutral-400 mr-1.5">{item.start}</span>
                                <span className="text-neutral-800 dark:text-neutral-200">{item.title}</span>
                              </div>
                              {item.location && (
                                <a
                                  href={`https://maps.google.co.in/?q=${encodeURIComponent(item.location)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title={`View "${item.location}" on Google Maps`}
                                  className="p-1 rounded hover:bg-blue-500/10 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 transition-colors"
                                >
                                  <MapPin className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                        {dayItems.length === 0 && (
                          <div className="py-6 text-center text-xs text-neutral-400">Empty</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === 'packing' && (
          <div className="glass-card p-6 border border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 mb-6">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Packing Checklist
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Check items off as you pack your bags for {currentTrip.to}.
                </p>
              </div>
              <div className="chip font-mono text-xs">
                {packedCount} / {packingList.length} Packed
              </div>
            </div>

            <form onSubmit={handleAddPacking} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newPackingText}
                onChange={(e) => setNewPackingText(e.target.value)}
                placeholder="Add item (e.g. Universal adapter, Rain poncho)..."
                className="input text-xs py-2 px-3.5 flex-1"
              />
              <select
                value={newPackingCategory}
                onChange={(e) => setNewPackingCategory(e.target.value as PackingItem['category'])}
                className="input text-xs py-2 px-2.5 w-auto cursor-pointer"
              >
                <option value="essentials">Essentials</option>
                <option value="documents">Documents</option>
                <option value="clothing">Clothing</option>
                <option value="electronics">Electronics</option>
                <option value="toiletries">Toiletries</option>
              </select>
              <button
                type="submit"
                className="btn-primary text-xs py-2 px-4 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packingList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => togglePackingItem(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    item.packed
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 text-neutral-400 line-through'
                      : 'bg-white/70 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.packed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                    <span className="text-xs truncate">{item.text}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                      {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePackingItem(item.id);
                      }}
                      className="p-1 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isGCalBatchModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsGCalBatchModalOpen(false)}>
          <div 
            className="glass-card w-full max-w-md p-6 relative border border-white/80 dark:border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Import All to Google Calendar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGCalBatchModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-4 leading-relaxed">
              Google Calendar Web allows importing all {currentTrip.items.length} events directly without downloading files to your computer. Click below to launch the pre-filled events in Google Calendar:
            </p>

            {batchProgress > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs font-mono text-neutral-500 mb-1">
                  <span>Launching calendar tabs...</span>
                  <span>{batchProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-200" 
                    style={{ width: `${batchProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleStartBatchGCal}
                className="w-full btn-primary text-xs py-2.5 px-4 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open All {currentTrip.items.length} Events in Google Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open('https://calendar.google.com/calendar/u/0/r/settings/export', '_blank');
                }}
                className="w-full btn-ghost text-xs py-2 px-4 cursor-pointer"
              >
                <span>Open Google Calendar Import Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
