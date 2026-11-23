import React, { useState } from 'react';
import {
  CalendarDays,
  Check,
  Clock,
  Coins,
  Compass,
  Copy,
  Laptop,
  LayoutGrid,
  Luggage,
  Moon,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { CURRENCIES, CurrencyCode, formatCurrency } from '../utils/currency';
import { PACKING_COLOR_LIST, PACKING_COLOR_STYLES } from '../utils/packingCategories';
import {
  CALENDAR_COLOR_LIST,
  CALENDAR_COLOR_STYLES,
  getCalendarCategoryIcon,
} from '../utils/calendarCategories';
import { CategoryColor, PackingCategoryColor } from '../types/trip';

type SettingsTab = 'preferences' | 'categories' | 'trips';

export const SettingsPage: React.FC = () => {
  const {
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
    userName,
    setUserName,
    userEmail,
    userInitials,
  } = useTrip();

  const [activeTab, setActiveTab] = useState<SettingsTab>('preferences');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatColor, setNewCatColor] = useState<PackingCategoryColor>('purple');
  const [newCalCatLabel, setNewCalCatLabel] = useState('');
  const [newCalCatColor, setNewCalCatColor] = useState<CategoryColor>('purple');
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

  const handleSelectTab = (nextTab: SettingsTab) => {
    setActiveTab(nextTab);
    if (typeof window !== 'undefined' && window.scrollY > 60) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(userName);
      setIsEditingName(false);
      return;
    }
    setUserName(trimmed);
    setIsEditingName(false);
  };

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

  const totalCategoryCount = calendarCategories.length + packingCategories.length;

  return (
    <div className="relative z-10 w-full min-h-[calc(100dvh-65px)] pb-24 md:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Top Header Card — matches Review page (CalendarView) layout and tab system */}
        <div className="glass-card px-5 pt-5 pb-4 sm:px-6 sm:pt-6 md:pb-0 border border-black/5 dark:border-white/10 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 select-none">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  <span>Account &amp; Workspace Settings</span>
                  <span>·</span>
                  <span className="truncate">{userEmail}</span>
                </div>

                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-1.5 mt-1 max-w-xs">
                    <input
                      type="text"
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      placeholder="Your display name"
                      aria-label="Edit display name"
                      className="input h-8 text-sm py-1 px-2.5 flex-1 min-w-0"
                    />
                    <button
                      type="submit"
                      aria-label="Save name"
                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(userName);
                        setIsEditingName(false);
                      }}
                      aria-label="Cancel editing name"
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5 min-w-0">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white truncate">
                      {userName}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(userName);
                        setIsEditingName(true);
                      }}
                      title="Change display name"
                      aria-label="Change display name"
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setScreen('wizard')}
                className="btn-primary text-xs py-2 px-3.5 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Plan New Trip</span>
              </button>
            </div>
          </div>

          {/* Desktop Standard Underline Tabs — synced with Review page */}
          <nav
            aria-label="Settings sections"
            role="tablist"
            className="hidden md:flex items-center gap-7 mt-5 border-t border-black/8 dark:border-white/10"
          >
            {[
              {
                id: 'preferences' as const,
                label: 'Preferences',
                badge: `${currency} · ${use12h ? '12h' : '24h'}`,
                icon: SlidersHorizontal,
              },
              {
                id: 'categories' as const,
                label: 'Categories',
                badge: `${totalCategoryCount}`,
                icon: Tags,
              },
              {
                id: 'trips' as const,
                label: 'Saved Trips',
                badge: `${trips.length}`,
                icon: Compass,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectTab(tab.id)}
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

        {/* Tab 1: Preferences */}
        {activeTab === 'preferences' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appearance & Theme */}
            <section className="glass-card p-6 border border-black/5 dark:border-white/10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Appearance &amp; Theme
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Choose light, dark, or match your operating system automatically.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'system' as const, label: 'System', hint: 'Auto', icon: Laptop },
                  { id: 'light' as const, label: 'Light', hint: 'Day', icon: Sun },
                  { id: 'dark' as const, label: 'Dark', hint: 'Night', icon: Moon },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTheme(opt.id)}
                      className={`flex flex-col items-center justify-center gap-1 py-3 px-3 rounded-2xl text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white/75 dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-[11px] opacity-75">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Preferred Currency */}
            <section className="glass-card p-6 border border-black/5 dark:border-white/10 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Preferred Currency
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Used across budget caps, trip cost totals, and expense reports.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => {
                  const isSelected = currency === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`py-2.5 px-2 rounded-2xl text-xs font-mono tabular-nums font-semibold border transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5 whitespace-nowrap ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white/75 dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                      }`}
                    >
                      <span className="text-sm leading-none">{CURRENCIES[c].symbol}</span>
                      <span className="text-[11px] opacity-90">{c}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Time Format */}
            <section className="glass-card p-6 border border-black/5 dark:border-white/10 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Time Format
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Controls how event timestamps appear on timeline cards and schedules.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUse12h(true)}
                  className={`py-3 px-4 rounded-2xl text-xs font-medium border transition-colors cursor-pointer flex flex-col items-center justify-center ${
                    use12h
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white/75 dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                  }`}
                >
                  <span className="font-mono font-semibold text-sm">12-Hour</span>
                  <span className="opacity-80 text-[11px] font-mono tabular-nums mt-0.5">
                    2:30 PM
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setUse12h(false)}
                  className={`py-3 px-4 rounded-2xl text-xs font-medium border transition-colors cursor-pointer flex flex-col items-center justify-center ${
                    !use12h
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white/75 dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                  }`}
                >
                  <span className="font-mono font-semibold text-sm">24-Hour</span>
                  <span className="opacity-80 text-[11px] font-mono tabular-nums mt-0.5">
                    14:30
                  </span>
                </button>
              </div>
            </section>

            {/* Calendar Grid Density */}
            <section className="glass-card p-6 border border-black/5 dark:border-white/10 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-purple-500" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Calendar Grid Density
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Adjust vertical hour spacing in the interactive planner timeline.
                </p>
              </div>

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
                      className={`py-3 px-3 rounded-2xl text-xs font-medium border transition-colors cursor-pointer text-center ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white/75 dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-[11px] opacity-80 font-mono tabular-nums mt-0.5">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Tab 2: Categories */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Calendar Categories */}
            <section className="glass-card rounded-3xl border border-black/5 dark:border-white/10 overflow-hidden">
              <div
                style={{ top: 'var(--navbar-height, 56px)' }}
                className="sticky z-20 glass-sticky px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    Calendar Event Categories
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetCalendarCategories}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Customize the event categories and color themes used on your timeline, Add/Edit modal, and PDF exports.
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
                        className="p-2.5 sm:p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/8 dark:border-white/10 space-y-2.5"
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
                          CALENDAR_COLOR_LIST.find((c) => c.id === newCalCatColor)?.swatch ||
                          'bg-purple-500'
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
                      className="btn-primary h-9 text-xs py-1.5 px-3.5 shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {openColorPicker === 'cal-new' && (
                    <div
                      className="flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/8 dark:border-white/10"
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

            {/* Packing Checklist Categories */}
            <section className="glass-card rounded-3xl border border-black/5 dark:border-white/10 overflow-hidden">
              <div
                style={{ top: 'var(--navbar-height, 56px)' }}
                className="sticky z-20 glass-sticky px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Luggage className="w-4 h-4 text-emerald-500 shrink-0" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    Packing Checklist Categories
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetPackingCategories}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Customize the packing checklist groups and color tags shown in Review &amp; Export and PDF printouts.
                </p>

                <div className="space-y-2.5">
                  {packingCategories.map((cat) => {
                    const colorStyle =
                      PACKING_COLOR_STYLES[cat.color] || PACKING_COLOR_STYLES.slate;
                    const pickerKey = `pack-${cat.id}`;
                    const isColorOpen = openColorPicker === pickerKey;

                    return (
                      <div
                        key={cat.id}
                        className="p-2.5 sm:p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/8 dark:border-white/10 space-y-2.5"
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
                      className="btn-primary h-9 text-xs py-1.5 px-3.5 shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {openColorPicker === 'pack-new' && (
                    <div
                      className="flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/8 dark:border-white/10"
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
        )}

        {/* Tab 3: Saved Trips */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Saved Trips ({trips.length})
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Switch active itineraries, duplicate trips, or restore starter templates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadSampleTrip()}
                  className="btn-ghost text-xs py-2 px-3.5 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore 3 India Templates</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map((trip) => {
                const isSelected = currentTrip?.id === trip.id;
                const totalSpend = trip.items.reduce((acc, item) => acc + (item.cost || 0), 0);

                return (
                  <div
                    key={trip.id}
                    className={`glass-card p-5 border transition-colors flex flex-col justify-between gap-4 ${
                      isSelected
                        ? 'border-blue-500/45 ring-1 ring-blue-500/20'
                        : 'border-black/5 dark:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                        <span className="truncate font-medium">
                          {trip.from} → {trip.to}
                        </span>
                        {isSelected && (
                          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                            Active
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                        {trip.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums mt-2">
                        <span>{trip.startDate}</span>
                        <span>·</span>
                        <span>{trip.numDays}d</span>
                        <span>·</span>
                        <span>{trip.items.length} events</span>
                        {totalSpend > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
                              {formatCurrency(totalSpend, currency)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/5 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentTrip(trip);
                            setScreen('planner', trip.id);
                          }}
                          className="btn-primary text-xs py-1.5 px-3.5 whitespace-nowrap cursor-pointer"
                        >
                          Open Timeline
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentTrip(trip);
                            setScreen('review', trip.id);
                          }}
                          className="btn-ghost text-xs py-1.5 px-3 whitespace-nowrap cursor-pointer"
                        >
                          Review
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(trip)}
                          title="Duplicate trip"
                          aria-label={`Duplicate ${trip.title}`}
                          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {trips.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteTrip(trip.id)}
                            title="Delete trip"
                            aria-label={`Delete ${trip.title}`}
                            className="p-2 rounded-xl hover:bg-red-500/10 text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Tab Bar — matches Review page (CalendarView) */}
      <nav
        aria-label="Settings sections"
        role="tablist"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-sticky border-t border-black/10 dark:border-white/10 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_-6px_24px_-4px_rgba(0,0,0,0.45)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-3 h-14 px-1.5">
          {[
            {
              id: 'preferences' as const,
              label: 'Preferences',
              meta: currency,
              icon: SlidersHorizontal,
            },
            {
              id: 'categories' as const,
              label: 'Categories',
              meta: `${totalCategoryCount}`,
              icon: Tags,
            },
            {
              id: 'trips' as const,
              label: 'Trips',
              meta: `${trips.length}`,
              icon: Compass,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectTab(tab.id)}
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
