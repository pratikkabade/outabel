import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarPlus,
  Download, 
  FileDown,
  Plus, 
  MapPin, 
  ExternalLink,
  Luggage,
  CheckSquare,
  Square,
  Trash2,
  X,
  FileJson,
  FileArchive,
  Receipt,
  Pencil
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { downloadICS } from '../utils/ics';
import { openGoogleCalendar } from '../utils/gcal';
import { exportTripPDF } from '../utils/pdf';
import { downloadTripJSON, downloadTripZIP } from '../utils/tripPackage';
import { formatDayDate, formatDayOfWeek, formatShortDate, formatTimeDisplay } from '../utils/time';
import { formatCurrency } from '../utils/currency';
import { resolvePackingCategory } from '../utils/packingCategories';
import { resolveCalendarCategory } from '../utils/calendarCategories';
import { AnimatedModal } from './AnimatedModal';

export const CalendarView: React.FC = () => {
  const { 
    currentTrip, 
    setScreen,
    openAddModal, 
    showToast, 
    togglePackingItem, 
    addPackingItem, 
    deletePackingItem,
    packingCategories,
    calendarCategories,
    currency,
    use12h
  } = useTrip();

  const [viewMode, setViewMode] = useState<'calendar' | 'packing' | 'expenses'>('calendar');
  const [calendarViewType, setCalendarViewType] = useState<'week' | 'month'>('week');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [newPackingText, setNewPackingText] = useState('');
  const [newPackingCategory, setNewPackingCategory] = useState<string>('essentials');
  const [isGCalBatchModalOpen, setIsGCalBatchModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const expenseItems = useMemo(() => {
    if (!currentTrip) return [];
    return currentTrip.items
      .filter((item) => typeof item.cost === 'number' && item.cost > 0)
      .sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.start.localeCompare(b.start);
      });
  }, [currentTrip]);

  const filteredExpenses = useMemo(() => {
    if (expenseCategoryFilter === 'all') return expenseItems;
    return expenseItems.filter(
      (item) => (item.type || '').toLowerCase() === expenseCategoryFilter.toLowerCase()
    );
  }, [expenseItems, expenseCategoryFilter]);

  const filteredExpenseTotal = useMemo(
    () => filteredExpenses.reduce((sum, item) => sum + (item.cost || 0), 0),
    [filteredExpenses]
  );

  const totalAllExpenses = useMemo(
    () => expenseItems.reduce((sum, item) => sum + (item.cost || 0), 0),
    [expenseItems]
  );

  if (!currentTrip) return null;

  const activePackingCategory = packingCategories.some((c) => c.id === newPackingCategory)
    ? newPackingCategory
    : (packingCategories[0]?.id || 'essentials');

  const handleExportICS = () => {
    downloadICS(currentTrip);
    showToast('Downloaded .ics file for Apple & Outlook calendars');
    setIsDownloadModalOpen(false);
  };

  const handleExportJSON = () => {
    downloadTripJSON(currentTrip, calendarCategories, packingCategories);
    showToast('Downloaded structured .json trip package');
    setIsDownloadModalOpen(false);
  };

  const handleExportZIP = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadTripZIP(currentTrip, calendarCategories, packingCategories);
      showToast('Downloaded .zip archive (.ics + .json)');
      setIsDownloadModalOpen(false);
    } catch {
      showToast('Failed to generate .zip archive');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleExportPDF = () => {
    exportTripPDF(currentTrip, currency, use12h, packingCategories, calendarCategories);
    showToast('Exported itinerary & packing checklist as PDF');
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

  const handleAddPacking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackingText.trim()) return;
    addPackingItem(newPackingText.trim(), activePackingCategory);
    setNewPackingText('');
  };

  const handleSelectViewMode = (nextMode: 'calendar' | 'packing' | 'expenses') => {
    setViewMode(nextMode);
    if (typeof window !== 'undefined' && window.scrollY > 60) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const packingList = currentTrip.packingList || [];
  const packedCount = packingList.filter((i) => i.packed).length;

  return (
    <div className="relative z-10 w-full min-h-[calc(100dvh-65px)] pb-24 md:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="glass-card px-5 pt-5 pb-4 sm:px-6 sm:pt-6 md:pb-0 border border-black/5 dark:border-white/10 mb-6 no-print">
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
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{currentTrip.from} → {currentTrip.to}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setScreen('planner')}
                title="Back to Calendar & Edit"
                aria-label="Edit"
                className="group inline-flex items-center h-9 px-2.5 rounded-xl border border-amber-200/90 dark:border-amber-400/25 bg-amber-50/80 dark:bg-amber-500/10 hover:bg-amber-100/90 dark:hover:bg-amber-500/20 hover:border-amber-400/60 text-amber-700 dark:text-amber-300 text-xs font-medium shadow-2xs transition-colors duration-200 cursor-pointer"
              >
                <Pencil className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="inline-grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
                  <span className="min-w-0 overflow-hidden whitespace-nowrap">
                    <span className="inline-block pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
                      Edit
                    </span>
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsGCalBatchModalOpen(true)}
                title="Import"
                aria-label="Import"
                className="group inline-flex items-center h-9 px-2.5 rounded-xl border border-blue-200/90 dark:border-blue-400/25 bg-blue-50/80 dark:bg-blue-500/10 hover:bg-blue-100/90 dark:hover:bg-blue-500/20 hover:border-blue-400/60 text-blue-700 dark:text-blue-300 text-xs font-medium shadow-2xs transition-colors duration-200 cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="inline-grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
                  <span className="min-w-0 overflow-hidden whitespace-nowrap">
                    <span className="inline-block pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
                      Import
                    </span>
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(true)}
                title="Download (.ics, .json, .zip)"
                aria-label="Download"
                className="group inline-flex items-center h-9 px-2.5 rounded-xl border border-emerald-200/90 dark:border-emerald-400/25 bg-emerald-50/80 dark:bg-emerald-500/10 hover:bg-emerald-100/90 dark:hover:bg-emerald-500/20 hover:border-emerald-400/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium shadow-2xs transition-colors duration-200 cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="inline-grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
                  <span className="min-w-0 overflow-hidden whitespace-nowrap">
                    <span className="inline-block pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
                      Download
                    </span>
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                title="Export Daily Flow & Packing Checklist as PDF"
                aria-label="Export as PDF"
                className="group inline-flex items-center h-9 px-2.5 rounded-xl border border-rose-200/90 dark:border-rose-400/25 bg-rose-50/80 dark:bg-rose-500/10 hover:bg-rose-100/90 dark:hover:bg-rose-500/20 hover:border-rose-400/60 text-rose-700 dark:text-rose-300 text-xs font-medium shadow-2xs transition-colors duration-200 cursor-pointer"
              >
                <FileDown className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="inline-grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
                  <span className="min-w-0 overflow-hidden whitespace-nowrap">
                    <span className="inline-block pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
                      Export as PDF
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Standard Underline Tabs */}
          <nav
            aria-label="Report sections"
            role="tablist"
            className="hidden md:flex items-center gap-7 mt-5 border-t border-black/8 dark:border-white/10"
          >
            {[
              {
                id: 'calendar' as const,
                label: 'Calendar Schedule',
                badge: `${currentTrip.items.length}`,
                icon: CalendarIcon,
              },
              {
                id: 'packing' as const,
                label: 'Packing Checklist',
                badge: `${packedCount}/${packingList.length}`,
                icon: Luggage,
              },
              {
                id: 'expenses' as const,
                label: 'Expenses',
                badge: formatCurrency(totalAllExpenses, currency),
                icon: Receipt,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectViewMode(tab.id)}
                  className={`relative flex items-center gap-2 py-3.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-500/12 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300'
                        : 'bg-black/[0.045] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              );
            })}
          </nav>
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
                    <section 
                      key={d}
                      className="rounded-3xl bg-white dark:bg-[#171a21]/90 border border-black/5 dark:border-white/10 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.04),0_2px_6px_-1px_rgba(0,0,0,0.02)] dark:shadow-[0_14px_40px_-8px_rgba(0,0,0,0.6)] overflow-clip"
                    >
                      <div
                        style={{ top: 'var(--navbar-height, 56px)' }}
                        className="sticky z-20 flex items-center justify-between px-5 py-3.5 rounded-t-3xl glass-sticky border-b border-black/5 dark:border-white/10 transition-colors"
                      >
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
                      </div>

                      <div className="p-5 pt-4">
                        {dayItems.length === 0 ? (
                          <div className="py-4 text-center text-xs text-neutral-400">
                            No items scheduled for this day
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {dayItems.map((item) => {
                              const { label: catLabel, style, icon: Icon } = resolveCalendarCategory(
                                item.type,
                                calendarCategories
                              );

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => openAddModal(item.day, undefined, item)}
                                  className={`p-3.5 rounded-xl shadow-xs transition-all cursor-pointer flex flex-col justify-between ${style.bg} ${style.hoverBg} ${style.border}`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                                      <span className={`font-mono tabular-nums font-semibold ${style.timeText}`}>
                                        {formatTimeDisplay(item.start, use12h)} – {formatTimeDisplay(item.end, use12h)}
                                      </span>
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold py-0.5 px-2 rounded-full shrink-0 ${style.badge}`}>
                                        <Icon className="w-2.5 h-2.5" />
                                        <span>{catLabel}</span>
                                      </span>
                                    </div>
                                    <div className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                                      {item.title}
                                    </div>
                                    {item.location && (
                                      <a
                                        href={`https://maps.google.co.in/?q=${encodeURIComponent(item.location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        title={`View "${item.location}" on Google Maps`}
                                        className={`inline-flex items-center gap-1 text-[11px] hover:underline max-w-full truncate mt-1.5 cursor-pointer font-medium ${style.link}`}
                                      >
                                        <MapPin className="w-3 h-3 shrink-0 opacity-90" />
                                        <span className="truncate">{item.location}</span>
                                      </a>
                                    )}
                                  </div>
                                  {item.cost ? (
                                    <div className={`mt-2.5 pt-1.5 border-t text-[11px] font-mono font-semibold text-right text-neutral-800 dark:text-neutral-100 ${style.divider}`}>
                                      {formatCurrency(item.cost, currency)}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: currentTrip.numDays }, (_, i) => i + 1).map((d) => {
                  const dayItems = currentTrip.items
                    .filter((item) => item.day === d)
                    .sort((a, b) => a.start.localeCompare(b.start));
                  return (
                    <section 
                      key={d}
                      className="rounded-3xl bg-white dark:bg-[#171a21]/90 border border-black/5 dark:border-white/10 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.04),0_2px_6px_-1px_rgba(0,0,0,0.02)] dark:shadow-[0_14px_40px_-8px_rgba(0,0,0,0.6)] flex flex-col overflow-clip"
                    >
                      <div
                        style={{ top: 'var(--navbar-height, 56px)' }}
                        className="sticky z-20 flex items-center justify-between px-4 py-3 rounded-t-3xl glass-sticky border-b border-black/5 dark:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                            D{d}
                          </span>
                          <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                            {formatDayOfWeek(currentTrip.startDate, d)}, {formatDayDate(currentTrip.startDate, d)}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500 font-mono shrink-0">{formatShortDate(currentTrip.startDate, d)}</span>
                      </div>
                      <div className="p-4 pt-3 space-y-1.5 flex-1">
                        {dayItems.map((item) => {
                          const { style, icon: Icon } = resolveCalendarCategory(
                            item.type,
                            calendarCategories
                          );

                          return (
                            <div 
                              key={item.id}
                              onClick={() => openAddModal(item.day, undefined, item)}
                              className={`p-2 rounded-lg text-xs cursor-pointer transition-all shadow-2xs ${style.bg} ${style.hoverBg} ${style.border}`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0 truncate">
                                  <Icon className={`w-3 h-3 shrink-0 ${style.timeText}`} />
                                  <span className={`font-mono font-medium shrink-0 ${style.timeText}`}>{formatTimeDisplay(item.start, use12h)}</span>
                                  <span className="font-semibold text-neutral-900 dark:text-white truncate">{item.title}</span>
                                </div>
                                {item.location && (
                                  <a
                                    href={`https://maps.google.co.in/?q=${encodeURIComponent(item.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title={`View "${item.location}" on Google Maps`}
                                    className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 shrink-0 transition-colors ${style.link}`}
                                  >
                                    <MapPin className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {dayItems.length === 0 && (
                          <div className="py-6 text-center text-xs text-neutral-400">Empty</div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === 'packing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Packing Checklist &amp; Gear
              </h2>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-mono font-medium text-neutral-700 dark:text-neutral-200">
                <span>{packedCount} / {packingList.length} Packed</span>
              </div>
            </div>

            <section className="rounded-3xl bg-white dark:bg-[#171a21]/90 border border-black/5 dark:border-white/10 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.04),0_2px_6px_-1px_rgba(0,0,0,0.02)] dark:shadow-[0_14px_40px_-8px_rgba(0,0,0,0.6)] overflow-clip">
              <div
                style={{ top: 'var(--navbar-height, 56px)' }}
                className="sticky z-20 flex items-center justify-between px-5 py-3.5 rounded-t-3xl glass-sticky border-b border-black/5 dark:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Luggage className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                    Essentials for {currentTrip.to}
                  </span>
                </div>
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  {packingList.length} item{packingList.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="p-5 pt-4 space-y-4">
                <form onSubmit={handleAddPacking} className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={newPackingText}
                    onChange={(e) => setNewPackingText(e.target.value)}
                    placeholder="Add item (e.g. Universal adapter, Rain poncho)..."
                    className="input text-xs py-2 px-3.5 flex-1 min-w-0"
                  />
                  <select
                    value={activePackingCategory}
                    onChange={(e) => setNewPackingCategory(e.target.value)}
                    className="input text-xs py-2 px-3 w-fit shrink-0 cursor-pointer"
                  >
                    {packingCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 px-4 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {packingList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400">
                    No packing items added yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {packingList.map((item) => {
                      const { label: catLabel, style: catStyle } = resolvePackingCategory(
                        item.category,
                        packingCategories
                      );

                      return (
                        <div
                          key={item.id}
                          onClick={() => togglePackingItem(item.id)}
                          className={`p-3.5 rounded-xl border shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                            item.packed
                              ? 'bg-neutral-100/80 dark:bg-white/[0.03] border-black/10 dark:border-white/10 text-neutral-400 dark:text-neutral-500 opacity-75'
                              : `${catStyle.cardBg} ${catStyle.cardHover} ${catStyle.cardBorder} text-neutral-900 dark:text-neutral-100`
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${catStyle.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                              <span>{catLabel}</span>
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePackingItem(item.id);
                              }}
                              className="p-1 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            {item.packed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                            )}
                            <span
                              className={`text-xs font-bold truncate ${
                                item.packed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-white'
                              }`}
                            >
                              {item.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {viewMode === 'expenses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Trip Expenses &amp; Budget
              </h2>

              <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setExpenseCategoryFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    expenseCategoryFilter === 'all'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  All
                </button>
                {calendarCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setExpenseCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      expenseCategoryFilter === cat.id
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <section className="rounded-3xl bg-white dark:bg-[#171a21]/90 border border-black/5 dark:border-white/10 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.04),0_2px_6px_-1px_rgba(0,0,0,0.02)] dark:shadow-[0_14px_40px_-8px_rgba(0,0,0,0.6)] overflow-clip">
              <div
                style={{ top: 'var(--navbar-height, 56px)' }}
                className="sticky z-20 flex items-center justify-between px-5 py-3.5 rounded-t-3xl glass-sticky border-b border-black/5 dark:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                    {expenseCategoryFilter === 'all'
                      ? 'All Trip Expenses'
                      : `${calendarCategories.find((c) => c.id === expenseCategoryFilter)?.label || expenseCategoryFilter} Expenses`}
                  </span>
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    · {filteredExpenses.length} item{filteredExpenses.length === 1 ? '' : 's'}
                  </span>
                </div>

                <span className="text-sm font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(filteredExpenseTotal, currency)}
                </span>
              </div>

              <div className="p-5 pt-4">
                {filteredExpenses.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400">
                    {expenseItems.length === 0
                      ? 'No expenses recorded yet.'
                      : 'No expenses match this category.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {filteredExpenses.map((item) => {
                      const { label: catLabel, style, icon: Icon } = resolveCalendarCategory(
                        item.type,
                        calendarCategories
                      );

                      return (
                        <div
                          key={item.id}
                          onClick={() => openAddModal(item.day, undefined, item)}
                          className={`p-3.5 rounded-xl shadow-xs transition-all cursor-pointer flex flex-col justify-between ${style.bg} ${style.hoverBg} ${style.border}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                              <span className={`font-mono tabular-nums font-semibold ${style.timeText}`}>
                                Day {item.day} · {formatTimeDisplay(item.start, use12h)}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold py-0.5 px-2 rounded-full shrink-0 ${style.badge}`}>
                                <Icon className="w-2.5 h-2.5" />
                                <span>{catLabel}</span>
                              </span>
                            </div>
                            <div className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                              {item.title}
                            </div>
                          </div>

                          <div className={`mt-2.5 pt-1.5 border-t text-xs font-mono font-bold text-right text-neutral-900 dark:text-white ${style.divider}`}>
                            {formatCurrency(item.cost || 0, currency)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <AnimatedModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        backdropClassName="p-4"
        panelClassName="glass-card w-full max-w-md p-6 relative border border-white/80 dark:border-white/15"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Download Trip Files
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsDownloadModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-4 leading-relaxed">
          Choose which format to download. Structured <span className="font-mono font-semibold">.json</span> and <span className="font-mono font-semibold">.zip</span> exports include all item names, categories, colors, and your packing checklist for re-importing.
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleExportICS}
            className="w-full p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:border-emerald-400 dark:hover:border-emerald-400/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-colors flex items-center gap-3.5 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                Download .ics
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Calendar schedule for Apple Calendar &amp; Outlook
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="w-full p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:border-blue-400 dark:hover:border-blue-400/60 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-colors flex items-center gap-3.5 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileJson className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                Download .json
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Events, category names, colors &amp; packing checklist for import
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={isDownloadingZip}
            onClick={handleExportZIP}
            className="w-full p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-400/30 bg-indigo-50/70 dark:bg-indigo-500/10 hover:border-indigo-400 hover:bg-indigo-100/70 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-3.5 text-left cursor-pointer disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileArchive className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                {isDownloadingZip ? 'Creating .zip archive...' : 'Download .zip (Both .ics + .json)'}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Complete bundle containing both calendar &amp; full backup JSON
              </div>
            </div>
          </button>
        </div>
      </AnimatedModal>

      <AnimatedModal
        isOpen={isGCalBatchModalOpen}
        onClose={() => setIsGCalBatchModalOpen(false)}
        backdropClassName="p-4"
        panelClassName="glass-card w-full max-w-md p-6 relative border border-white/80 dark:border-white/15"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Import All
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
      </AnimatedModal>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Report sections"
        role="tablist"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-sticky border-t border-black/10 dark:border-white/10 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_-6px_24px_-4px_rgba(0,0,0,0.45)] pb-[env(safe-area-inset-bottom)] no-print"
      >
        <div className="grid grid-cols-3 h-14 px-1.5">
          {[
            {
              id: 'calendar' as const,
              label: 'Schedule',
              meta: `${currentTrip.items.length}`,
              icon: CalendarIcon,
            },
            {
              id: 'packing' as const,
              label: 'Packing',
              meta: `${packedCount}/${packingList.length}`,
              icon: Luggage,
            },
            {
              id: 'expenses' as const,
              label: 'Expenses',
              meta: formatCurrency(totalAllExpenses, currency),
              icon: Receipt,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectViewMode(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 my-1 mx-0.5 rounded-xl px-1 transition-colors cursor-pointer min-w-0 ${
                  isActive
                    ? 'bg-blue-500/12 dark:bg-blue-400/15 text-blue-600 dark:text-blue-400'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1 max-w-full">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span
                    className={`text-[10px] font-mono tabular-nums font-semibold truncate ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-300'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {tab.meta}
                  </span>
                </div>
                <span className="text-[11px] font-semibold leading-tight truncate max-w-full">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
