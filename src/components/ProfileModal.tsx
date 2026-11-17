import React, { useState } from 'react';
import {
  X,
  Plus,
  Copy,
  Trash2,
  Sun,
  Moon,
  Laptop,
  RotateCcw,
  Luggage,
  Compass,
  Coins,
  Palette,
  Clock,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { CURRENCIES, CurrencyCode } from '../utils/currency';
import { PACKING_COLOR_LIST, PACKING_COLOR_STYLES } from '../utils/packingCategories';
import {
  CALENDAR_COLOR_LIST,
  CALENDAR_COLOR_STYLES,
  getCalendarCategoryIcon,
} from '../utils/calendarCategories';
import { CategoryColor, PackingCategoryColor } from '../types/trip';
import { AnimatedModal } from './AnimatedModal';

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
    setCalendarDensity,
    packingCategories,
    addPackingCategory,
    updatePackingCategory,
    deletePackingCategory,
    resetPackingCategories,
    calendarCategories,
    addCalendarCategory,
    updateCalendarCategory,
    deleteCalendarCategory,
    resetCalendarCategories,
  } = useTrip();

  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatColor, setNewCatColor] = useState<PackingCategoryColor>('purple');
  const [newCalCatLabel, setNewCalCatLabel] = useState('');
  const [newCalCatColor, setNewCalCatColor] = useState<CategoryColor>('purple');
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

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

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) return;
    addPackingCategory(newCatLabel, newCatColor);
    setNewCatLabel('');
  };

  const handleCreateCalendarCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalCatLabel.trim()) return;
    addCalendarCategory(newCalCatLabel, newCalCatColor);
    setNewCalCatLabel('');
  };

  return (
    <AnimatedModal
      isOpen={isProfileOpen}
      onClose={() => setIsProfileOpen(false)}
      backdropClassName="p-3 sm:p-5"
      panelClassName="glass-card w-full max-w-2xl p-0 relative border border-white/80 dark:border-white/15 max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
    >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#161a22] shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20 shrink-0">
              PK
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                Pratik Kabade
              </h2>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                thisispratikkabade@gmail.com
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileOpen(false)}
            aria-label="Close profile modal"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spacious Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7 day-items-scroll">
          {/* Section 1: My Trips */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                  My Trips ({trips.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setScreen('wizard');
                }}
                className="chip text-xs py-1.5 px-3 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Trip</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 day-items-scroll">
              {trips.map((trip) => {
                const isSelected = currentTrip?.id === trip.id;
                const isExpanded = expandedTripId === trip.id;

                return (
                  <div
                    key={trip.id}
                    onClick={() =>
                      setExpandedTripId((prev) => (prev === trip.id ? null : trip.id))
                    }
                    className={`px-3.5 py-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/40 shadow-2xs'
                        : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/8 dark:border-white/10 hover:border-blue-400'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2 py-2">
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Active trip" />
                      )}
                      <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                        {trip.title}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTrip(trip);
                            setScreen('planner');
                            setIsProfileOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(trip, e)}
                          title="Duplicate trip"
                          aria-label="Copy trip"
                          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {trips.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(trip.id, e)}
                            title="Delete trip"
                            aria-label="Delete trip"
                            className="p-2 rounded-xl hover:bg-red-500/10 text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Preferred Currency */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                Preferred Currency
              </h3>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] border border-black/8 dark:border-white/10">
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-mono font-medium border transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center ${
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
          </section>

          {/* Section 3: Appearance & Theme */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                Appearance & Theme
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] border border-black/8 dark:border-white/10">
              <div className="grid grid-cols-3 gap-2.5">
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
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 4: Time Format */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                Time Format
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] border border-black/8 dark:border-white/10">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setUse12h(true)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex flex-col items-center justify-center ${
                    use12h
                      ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                  }`}
                >
                  <span className="font-mono font-semibold">12-Hour</span>
                  <span className="opacity-75 text-[10px] mt-0.5">2:30 PM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUse12h(false)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex flex-col items-center justify-center ${
                    !use12h
                      ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                  }`}
                >
                  <span className="font-mono font-semibold">24-Hour</span>
                  <span className="opacity-75 text-[10px] mt-0.5">14:30</span>
                </button>
              </div>
            </div>
          </section>

          {/* Section 5: Calendar Grid Density */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                Calendar Grid Density
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] border border-black/8 dark:border-white/10">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'compact' as const, label: 'Compact', desc: '52px / hr' },
                  { id: 'normal' as const, label: 'Default', desc: '68px / hr' },
                  { id: 'spacious' as const, label: 'Spacious', desc: '88px / hr' },
                ].map((opt) => {
                  const isSelected = calendarDensity === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCalendarDensity(opt.id)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-center ${
                        isSelected
                          ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-[10px] opacity-75 font-mono mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 6: Calendar Categories & Colors */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                  Calendar Categories
                </h3>
              </div>

              <button
                type="button"
                onClick={resetCalendarCategories}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
                title="Restore default calendar categories"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] border border-black/8 dark:border-white/10 space-y-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Customize the event categories and light-tinted color themes shown on your Calendar timeline, Add/Edit modal, and PDF exports.
              </p>

              <div className="space-y-2.5">
                {calendarCategories.map((cat) => {
                  const colorStyle = CALENDAR_COLOR_STYLES[cat.color] || CALENDAR_COLOR_STYLES.slate;
                  const CatIcon = getCalendarCategoryIcon(cat.icon);
                  const pickerKey = `cal-${cat.id}`;
                  const isColorOpen = openColorPicker === pickerKey;

                  return (
                    <div
                      key={cat.id}
                      className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-black/8 dark:border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenColorPicker((prev) => (prev === pickerKey ? null : pickerKey))
                          }
                          title={`Change color (${colorStyle.label})`}
                          aria-label={`Change color for ${cat.label}`}
                          aria-expanded={isColorOpen}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${colorStyle.bg} ${
                            isColorOpen ? 'ring-2 ring-blue-500' : 'hover:scale-105'
                          }`}
                        >
                          <CatIcon className={`w-4 h-4 ${colorStyle.iconText}`} />
                        </button>

                        <input
                          type="text"
                          value={cat.label}
                          onChange={(e) =>
                            updateCalendarCategory(cat.id, { label: e.target.value })
                          }
                          onBlur={(e) => {
                            if (!e.target.value.trim()) {
                              updateCalendarCategory(cat.id, { label: 'Category' });
                            }
                          }}
                          aria-label={`Calendar category name for ${cat.label}`}
                          className="input h-9 text-xs py-1.5 px-3 flex-1 min-w-0"
                        />

                        <button
                          type="button"
                          disabled={calendarCategories.length <= 1}
                          onClick={() => deleteCalendarCategory(cat.id)}
                          title={
                            calendarCategories.length <= 1
                              ? 'At least one calendar category is required'
                              : `Remove ${cat.label}`
                          }
                          className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isColorOpen && (
                        <div
                          className="flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05]"
                          role="radiogroup"
                          aria-label={`Color for ${cat.label}`}
                        >
                          {CALENDAR_COLOR_LIST.map((colorOpt) => {
                            const isSelected = cat.color === colorOpt.id;
                            return (
                              <button
                                key={colorOpt.id}
                                type="button"
                                onClick={() => {
                                  updateCalendarCategory(cat.id, { color: colorOpt.id });
                                  setOpenColorPicker(null);
                                }}
                                title={colorOpt.label}
                                aria-label={`${colorOpt.label} color`}
                                aria-checked={isSelected}
                                role="radio"
                                className={`w-5 h-5 rounded-full transition-all cursor-pointer ${colorOpt.swatch} ${
                                  isSelected
                                    ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white ring-offset-white dark:ring-offset-neutral-800 scale-110'
                                    : 'opacity-75 hover:opacity-100'
                                }`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleCreateCalendarCategory}
                className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenColorPicker((prev) => (prev === 'cal-new' ? null : 'cal-new'))
                    }
                    title="Pick color for new category"
                    aria-label="Pick color for new calendar category"
                    aria-expanded={openColorPicker === 'cal-new'}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-black/8 dark:border-white/10 transition-all cursor-pointer ${
                      (CALENDAR_COLOR_STYLES[newCalCatColor] || CALENDAR_COLOR_STYLES.slate).bg
                    } ${openColorPicker === 'cal-new' ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${
                        CALENDAR_COLOR_LIST.find((c) => c.id === newCalCatColor)?.swatch || 'bg-purple-500'
                      }`}
                    />
                  </button>
                  <input
                    type="text"
                    value={newCalCatLabel}
                    onChange={(e) => setNewCalCatLabel(e.target.value)}
                    placeholder="New calendar category (e.g. Shopping, Tour)..."
                    className="input h-9 text-xs py-1.5 px-3 flex-1 min-w-0"
                  />
                  <button
                    type="submit"
                    className="btn-primary h-9 text-xs py-1.5 px-3 sm:px-3.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {openColorPicker === 'cal-new' && (
                  <div
                    className="flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-black/8 dark:border-white/10"
                    role="radiogroup"
                    aria-label="Color for new calendar category"
                  >
                    {CALENDAR_COLOR_LIST.map((colorOpt) => {
                      const isSelected = newCalCatColor === colorOpt.id;
                      return (
                        <button
                          key={colorOpt.id}
                          type="button"
                          onClick={() => {
                            setNewCalCatColor(colorOpt.id);
                            setOpenColorPicker(null);
                          }}
                          title={colorOpt.label}
                          aria-label={`${colorOpt.label} color`}
                          className={`w-5 h-5 rounded-full transition-all cursor-pointer ${colorOpt.swatch} ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white ring-offset-white dark:ring-offset-neutral-800 scale-110'
                              : 'opacity-75 hover:opacity-100'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </form>
            </div>
          </section>

          {/* Section 3: Packing Checklist Categories & Colors */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Luggage className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                  Packing Checklist Categories
                </h3>
              </div>

              <button
                type="button"
                onClick={resetPackingCategories}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
                title="Restore default packing categories"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] border border-black/8 dark:border-white/10 space-y-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Customize the dropdown categories and color tags used in your Packing Checklist.
              </p>

              <div className="space-y-2.5">
                {packingCategories.map((cat) => {
                  const colorStyle = PACKING_COLOR_STYLES[cat.color] || PACKING_COLOR_STYLES.slate;
                  const pickerKey = `pack-${cat.id}`;
                  const isColorOpen = openColorPicker === pickerKey;

                  return (
                    <div
                      key={cat.id}
                      className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-black/8 dark:border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenColorPicker((prev) => (prev === pickerKey ? null : pickerKey))
                          }
                          title={`Change color (${colorStyle.label})`}
                          aria-label={`Change color for ${cat.label}`}
                          aria-expanded={isColorOpen}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-black/[0.04] dark:bg-white/[0.06] transition-all cursor-pointer ${
                            isColorOpen ? 'ring-2 ring-blue-500' : 'hover:scale-105'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full ${colorStyle.swatch}`} />
                        </button>

                        <input
                          type="text"
                          value={cat.label}
                          onChange={(e) =>
                            updatePackingCategory(cat.id, { label: e.target.value })
                          }
                          onBlur={(e) => {
                            if (!e.target.value.trim()) {
                              updatePackingCategory(cat.id, { label: 'Category' });
                            }
                          }}
                          aria-label={`Category name for ${cat.label}`}
                          className="input h-9 text-xs py-1.5 px-3 flex-1 min-w-0"
                        />

                        <button
                          type="button"
                          disabled={packingCategories.length <= 1}
                          onClick={() => deletePackingCategory(cat.id)}
                          title={
                            packingCategories.length <= 1
                              ? 'At least one category is required'
                              : `Remove ${cat.label}`
                          }
                          className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isColorOpen && (
                        <div
                          className="flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05]"
                          role="radiogroup"
                          aria-label={`Color for ${cat.label}`}
                        >
                          {PACKING_COLOR_LIST.map((colorOpt) => {
                            const isSelected = cat.color === colorOpt.id;
                            return (
                              <button
                                key={colorOpt.id}
                                type="button"
                                onClick={() => {
                                  updatePackingCategory(cat.id, { color: colorOpt.id });
                                  setOpenColorPicker(null);
                                }}
                                title={colorOpt.label}
                                aria-label={`${colorOpt.label} color`}
                                aria-checked={isSelected}
                                role="radio"
                                className={`w-5 h-5 rounded-full transition-all cursor-pointer ${colorOpt.swatch} ${
                                  isSelected
                                    ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white ring-offset-white dark:ring-offset-neutral-800 scale-110'
                                    : 'opacity-75 hover:opacity-100'
                                }`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleCreateCategory}
                className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenColorPicker((prev) => (prev === 'pack-new' ? null : 'pack-new'))
                    }
                    title="Pick color for new category"
                    aria-label="Pick color for new packing category"
                    aria-expanded={openColorPicker === 'pack-new'}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white dark:bg-neutral-800 border border-black/8 dark:border-white/10 transition-all cursor-pointer ${
                      openColorPicker === 'pack-new' ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${
                        (PACKING_COLOR_STYLES[newCatColor] || PACKING_COLOR_STYLES.slate).swatch
                      }`}
                    />
                  </button>
                  <input
                    type="text"
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    placeholder="New category name (e.g. Footwear, Snacks)..."
                    className="input h-9 text-xs py-1.5 px-3 flex-1 min-w-0"
                  />
                  <button
                    type="submit"
                    className="btn-primary h-9 text-xs py-1.5 px-3 sm:px-3.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {openColorPicker === 'pack-new' && (
                  <div
                    className="flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-black/8 dark:border-white/10"
                    role="radiogroup"
                    aria-label="Color for new category"
                  >
                    {PACKING_COLOR_LIST.map((colorOpt) => {
                      const isSelected = newCatColor === colorOpt.id;
                      return (
                        <button
                          key={colorOpt.id}
                          type="button"
                          onClick={() => {
                            setNewCatColor(colorOpt.id);
                            setOpenColorPicker(null);
                          }}
                          title={colorOpt.label}
                          aria-label={`${colorOpt.label} color`}
                          className={`w-5 h-5 rounded-full transition-all cursor-pointer ${colorOpt.swatch} ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white ring-offset-white dark:ring-offset-neutral-800 scale-110'
                              : 'opacity-75 hover:opacity-100'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </form>
            </div>
          </section>
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-3.5 border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#161a22] flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
          <button
            type="button"
            onClick={() => {
              loadSampleTrip();
              setIsProfileOpen(false);
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
          >
            Restore 3 India Trip Templates
          </button>
        </div>
    </AnimatedModal>
  );
};
