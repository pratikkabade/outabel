import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Trip, ItineraryItem, ViewScreen, PackingItem, PackingCategoryColor, PackingCategoryOption, CalendarCategoryOption, CategoryColor } from '../types/trip';
import { CurrencyCode } from '../utils/currency';
import { SAMPLE_TRIP, SAMPLE_TRIPS } from '../utils/sampleData';
import { decodeTripFromHash } from '../utils/share';
import { getDurationMinutes, addMinutesToTime } from '../utils/time';
import { DEFAULT_PACKING_CATEGORIES } from '../utils/packingCategories';
import { DEFAULT_CALENDAR_CATEGORIES } from '../utils/calendarCategories';
import { ParsedTripImport } from '../utils/tripPackage';

export type CalendarDensity = 'compact' | 'normal' | 'spacious';

interface TripContextType {
  screen: ViewScreen;
  setScreen: (screen: ViewScreen) => void;
  trips: Trip[];
  currentTrip: Trip | null;
  setCurrentTrip: (trip: Trip | null) => void;
  createTrip: (data: {
    from: string;
    to: string;
    startDate: string;
    numDays: number;
    preferredWakeTime: string;
    dailyStartTime: string;
    pace: 'relaxed' | 'balanced' | 'packed';
  }) => Trip;
  saveTrip: (trip: Trip) => void;
  importTripPackage: (pkg: ParsedTripImport, options: { replaceCategories: boolean }) => Trip;
  deleteTrip: (id: string) => void;
  loadSampleTrip: (tripId?: string) => void;
  activeDay: number;
  setActiveDay: (day: number) => void;
  addItem: (item: Omit<ItineraryItem, 'id'>) => void;
  updateItem: (item: ItineraryItem) => void;
  deleteItem: (itemId: string) => void;
  duplicateItem: (itemId: string) => void;
  reorderItems: (items: ItineraryItem[]) => void;
  moveItemToDay: (itemId: string, targetDay: number, newStartTime?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  modalPreset: Partial<ItineraryItem> | null;
  editingItem: ItineraryItem | null;
  openAddModal: (day: number, preset?: Partial<ItineraryItem>, editItem?: ItineraryItem) => void;
  closeAddModal: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
  togglePackingItem: (itemId: string) => void;
  addPackingItem: (text: string, category: string) => void;
  deletePackingItem: (itemId: string) => void;
  packingCategories: PackingCategoryOption[];
  addPackingCategory: (label: string, color: PackingCategoryColor) => void;
  updatePackingCategory: (id: string, updates: Partial<Pick<PackingCategoryOption, 'label' | 'color'>>) => void;
  deletePackingCategory: (id: string) => void;
  resetPackingCategories: () => void;
  calendarCategories: CalendarCategoryOption[];
  addCalendarCategory: (label: string, color: CategoryColor) => void;
  updateCalendarCategory: (id: string, updates: Partial<Pick<CalendarCategoryOption, 'label' | 'color'>>) => void;
  deleteCalendarCategory: (id: string) => void;
  resetCalendarCategories: () => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  use12h: boolean;
  setUse12h: (val: boolean) => void;
  calendarDensity: CalendarDensity;
  setCalendarDensity: (d: CalendarDensity) => void;
}

const STORAGE_KEY_TRIPS = 'wayfarer_saved_trips_v1';
const STORAGE_KEY_ACTIVE = 'wayfarer_active_trip_id_v1';
const STORAGE_KEY_THEME = 'wayfarer_theme_preference_v1';
const STORAGE_KEY_CURRENCY = 'wayfarer_currency_v1';
const STORAGE_KEY_USE12H = 'wayfarer_use12h_v1';
const STORAGE_KEY_DENSITY = 'wayfarer_calendar_density_v1';
const STORAGE_KEY_PACKING_CATEGORIES = 'wayfarer_packing_categories_v1';
const STORAGE_KEY_CALENDAR_CATEGORIES = 'wayfarer_calendar_categories_v1';
const STORAGE_KEY_TEMPLATES_MIGRATED = 'wayfarer_indian_templates_v2';
const REMOVED_LEGACY_IDS = new Set([
  'trip-sample-kyoto-tokyo',
  'trip-template-mumbai-munnar',
  'trip-template-delhi-goa',
]);
const TEMPLATE_IDS = new Set(SAMPLE_TRIPS.map((t) => t.id));

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<ViewScreen>('home');
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_THEME);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {}
    return 'system';
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const migrated = localStorage.getItem(STORAGE_KEY_TEMPLATES_MIGRATED);
      const stored = localStorage.getItem(STORAGE_KEY_CURRENCY) as CurrencyCode;
      if (!migrated && (!stored || stored === 'USD')) {
        return 'INR';
      }
      if (stored && ['USD', 'EUR', 'GBP', 'JPY', 'INR'].includes(stored)) {
        return stored;
      }
    } catch {}
    return 'INR';
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [use12h, setUse12hState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USE12H);
      if (stored !== null) return stored === 'true';
    } catch {}
    return true;
  });

  const [calendarDensity, setCalendarDensityState] = useState<CalendarDensity>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DENSITY) as CalendarDensity;
      if (stored === 'compact' || stored === 'normal' || stored === 'spacious') {
        return stored;
      }
    } catch {}
    return 'normal';
  });

  const [packingCategories, setPackingCategories] = useState<PackingCategoryOption[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PACKING_CATEGORIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_PACKING_CATEGORIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PACKING_CATEGORIES, JSON.stringify(packingCategories));
    } catch {}
  }, [packingCategories]);

  const [calendarCategories, setCalendarCategories] = useState<CalendarCategoryOption[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CALENDAR_CATEGORIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_CALENDAR_CATEGORIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CALENDAR_CATEGORIES, JSON.stringify(calendarCategories));
    } catch {}
  }, [calendarCategories]);

  const setUse12h = useCallback((val: boolean) => {
    setUse12hState(val);
    try {
      localStorage.setItem(STORAGE_KEY_USE12H, String(val));
    } catch {}
  }, []);

  const setCalendarDensity = useCallback((d: CalendarDensity) => {
    setCalendarDensityState(d);
    try {
      localStorage.setItem(STORAGE_KEY_DENSITY, d);
    } catch {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  const [trips, setTrips] = useState<Trip[]>(() => {
    const fromHash = decodeTripFromHash();
    if (fromHash) {
      return [fromHash, ...SAMPLE_TRIPS];
    }
    try {
      const migrated = localStorage.getItem(STORAGE_KEY_TEMPLATES_MIGRATED);
      const stored = localStorage.getItem(STORAGE_KEY_TRIPS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const customTrips = parsed.filter(
            (t: Trip) => t && !REMOVED_LEGACY_IDS.has(t.id) && !TEMPLATE_IDS.has(t.id)
          );
          if (!migrated) {
            localStorage.setItem(STORAGE_KEY_TEMPLATES_MIGRATED, 'true');
            return [...SAMPLE_TRIPS, ...customTrips];
          }
          const cleaned = parsed.filter((t: Trip) => t && !REMOVED_LEGACY_IDS.has(t.id));
          if (cleaned.length > 0) {
            return cleaned;
          }
        }
      }
      localStorage.setItem(STORAGE_KEY_TEMPLATES_MIGRATED, 'true');
    } catch {}
    return SAMPLE_TRIPS;
  });

  const [currentTripId, setCurrentTripId] = useState<string | null>(() => {
    const fromHash = decodeTripFromHash();
    if (fromHash) return fromHash.id;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (stored && !REMOVED_LEGACY_IDS.has(stored)) return stored;
    } catch {}
    return SAMPLE_TRIP.id;
  });

  const [activeDay, setActiveDay] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [modalPreset, setModalPreset] = useState<Partial<ItineraryItem> | null>(null);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  const [history, setHistory] = useState<ItineraryItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mql.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setTheme = useCallback((t: 'light' | 'dark' | 'system') => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, t);
    } catch {}
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, c);
    } catch {}
    showToast(`Currency set to ${c}`);
  }, [showToast]);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const isCurrentlyDark = root.classList.contains('dark');
    setTheme(isCurrentlyDark ? 'light' : 'dark');
  }, [setTheme]);

  const currentTrip = useMemo(() => {
    if (!currentTripId) return trips[0] || null;
    return trips.find((t) => t.id === currentTripId) || trips[0] || null;
  }, [trips, currentTripId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
    } catch {}
  }, [trips]);

  useEffect(() => {
    try {
      if (currentTripId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE, currentTripId);
      }
    } catch {}
  }, [currentTripId]);

  const pushHistory = useCallback((items: ItineraryItem[]) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(items);
      return next.slice(-20);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 19));
  }, [historyIndex]);

  const updateCurrentTripItems = useCallback(
    (newItems: ItineraryItem[], recordHistory: boolean = true) => {
      if (!currentTrip) return;
      if (recordHistory) {
        pushHistory(currentTrip.items);
      }
      const updated: Trip = {
        ...currentTrip,
        items: newItems,
        updatedAt: new Date().toISOString(),
      };
      setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
    [currentTrip, pushHistory]
  );

  const saveTrip = useCallback((trip: Trip) => {
    const updated = { ...trip, updatedAt: new Date().toISOString() };
    setTrips((prev) => {
      const exists = prev.some((t) => t.id === updated.id);
      if (exists) {
        return prev.map((t) => (t.id === updated.id ? updated : t));
      }
      return [updated, ...prev];
    });
    setCurrentTripId(updated.id);
  }, []);

  const createTrip = useCallback(
    (data: {
      from: string;
      to: string;
      startDate: string;
      numDays: number;
      preferredWakeTime: string;
      dailyStartTime: string;
      pace: 'relaxed' | 'balanced' | 'packed';
    }) => {
      const newTrip: Trip = {
        id: 'trip-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        title: `${data.to} Itinerary`,
        from: data.from,
        to: data.to,
        startDate: data.startDate,
        numDays: Math.max(1, data.numDays),
        preferences: {
          preferredWakeTime: data.preferredWakeTime,
          dailyStartTime: data.dailyStartTime,
          pace: data.pace,
        },
        items: [],
        packingList: [
          { id: 'pk-1', text: 'Passport / Travel ID', category: 'documents', packed: false },
          { id: 'pk-2', text: 'Flight / Transit tickets', category: 'documents', packed: false },
          { id: 'pk-3', text: 'Phone charger & battery bank', category: 'electronics', packed: false },
          { id: 'pk-4', text: 'Weather appropriate attire', category: 'clothing', packed: false },
          { id: 'pk-5', text: 'Daily toiletries & medications', category: 'toiletries', packed: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTrips((prev) => [newTrip, ...prev]);
      setCurrentTripId(newTrip.id);
      setActiveDay(1);
      setHistory([]);
      setHistoryIndex(-1);
      showToast('Trip created! Start building your days.');
      return newTrip;
    },
    [showToast]
  );

  const deleteTrip = useCallback(
    (id: string) => {
      setTrips((prev) => {
        const remaining = prev.filter((t) => t.id !== id);
        if (currentTripId === id) {
          setCurrentTripId(remaining[0]?.id || null);
        }
        return remaining;
      });
      showToast('Trip removed.');
    },
    [currentTripId, showToast]
  );

  const loadSampleTrip = useCallback((tripId?: string) => {
    if (tripId) {
      const target = SAMPLE_TRIPS.find((t) => t.id === tripId) || SAMPLE_TRIP;
      setTrips((prev) => {
        const cleaned = prev.filter((t) => !REMOVED_LEGACY_IDS.has(t.id));
        const exists = cleaned.some((t) => t.id === target.id);
        return exists ? cleaned : [target, ...cleaned];
      });
      setCurrentTripId(target.id);
      setActiveDay(1);
      setScreen('planner');
      showToast(`Loaded "${target.title}".`);
      return;
    }

    setTrips((prev) => {
      const customOnly = prev.filter(
        (t) => !REMOVED_LEGACY_IDS.has(t.id) && !TEMPLATE_IDS.has(t.id)
      );
      return [...SAMPLE_TRIPS, ...customOnly];
    });
    setCurrentTripId((prevId) =>
      prevId && !REMOVED_LEGACY_IDS.has(prevId) ? prevId : SAMPLE_TRIP.id
    );
    setActiveDay(1);
    setScreen('trips');
    showToast('Loaded 3 curated India trip templates.');
  }, [showToast, setScreen]);

  const addItem = useCallback(
    (item: Omit<ItineraryItem, 'id'>) => {
      if (!currentTrip) return;
      const newItem: ItineraryItem = {
        ...item,
        id: 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      };
      const updated = [...currentTrip.items, newItem].sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.start.localeCompare(b.start);
      });
      updateCurrentTripItems(updated);
      showToast(`Added "${newItem.title}"`);
    },
    [currentTrip, updateCurrentTripItems, showToast]
  );

  const updateItem = useCallback(
    (item: ItineraryItem) => {
      if (!currentTrip) return;
      const updated = currentTrip.items.map((i) => (i.id === item.id ? item : i));
      updateCurrentTripItems(updated);
      showToast(`Updated "${item.title}"`);
    },
    [currentTrip, updateCurrentTripItems, showToast]
  );

  const deleteItem = useCallback(
    (itemId: string) => {
      if (!currentTrip) return;
      const target = currentTrip.items.find((i) => i.id === itemId);
      const updated = currentTrip.items.filter((i) => i.id !== itemId);
      updateCurrentTripItems(updated);
      if (target) {
        showToast(`Deleted "${target.title}"`);
      }
    },
    [currentTrip, updateCurrentTripItems, showToast]
  );

  const duplicateItem = useCallback(
    (itemId: string) => {
      if (!currentTrip) return;
      const target = currentTrip.items.find((i) => i.id === itemId);
      if (!target) return;
      const duplicated: ItineraryItem = {
        ...target,
        id: 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
        title: `${target.title} (Copy)`,
      };
      const updated = [...currentTrip.items, duplicated].sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.start.localeCompare(b.start);
      });
      updateCurrentTripItems(updated);
      showToast(`Duplicated "${target.title}"`);
    },
    [currentTrip, updateCurrentTripItems, showToast]
  );

  const reorderItems = useCallback(
    (items: ItineraryItem[]) => {
      updateCurrentTripItems(items);
    },
    [updateCurrentTripItems]
  );

  const moveItemToDay = useCallback(
    (itemId: string, targetDay: number, newStartTime?: string) => {
      if (!currentTrip) return;
      const target = currentTrip.items.find((i) => i.id === itemId);
      if (!target) return;

      const dur = getDurationMinutes(target.start, target.end);
      const finalStart = newStartTime || target.start;
      const finalEnd = newStartTime ? addMinutesToTime(newStartTime, dur > 0 ? dur : 90) : target.end;

      const updated = currentTrip.items.map((i) =>
        i.id === itemId 
          ? { ...i, day: targetDay, start: finalStart, end: finalEnd } 
          : i
      ).sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.start.localeCompare(b.start);
      });

      updateCurrentTripItems(updated);
      if (newStartTime) {
        showToast(`Moved "${target.title}" to Day ${targetDay} at ${newStartTime}`);
      } else {
        showToast(`Moved "${target.title}" to Day ${targetDay}`);
      }
    },
    [currentTrip, updateCurrentTripItems, showToast]
  );

  const undo = useCallback(() => {
    if (historyIndex < 0 || !currentTrip) return;
    const previousItems = history[historyIndex];
    if (previousItems) {
      updateCurrentTripItems(previousItems, false);
      setHistoryIndex((prev) => prev - 1);
      showToast('Action undone');
    }
  }, [historyIndex, history, currentTrip, updateCurrentTripItems, showToast]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !currentTrip) return;
    const nextItems = history[historyIndex + 1];
    if (nextItems) {
      updateCurrentTripItems(nextItems, false);
      setHistoryIndex((prev) => prev + 1);
      showToast('Action redone');
    }
  }, [historyIndex, history, currentTrip, updateCurrentTripItems, showToast]);

  const openAddModal = useCallback(
    (day: number, preset?: Partial<ItineraryItem>, editItem?: ItineraryItem) => {
      setActiveDay(day);
      setEditingItem(editItem || null);
      setModalPreset(preset || { day });
      setIsAddModalOpen(true);
    },
    []
  );

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setModalPreset(null);
    setEditingItem(null);
  }, []);

  const setCurrentTrip = useCallback(
    (trip: Trip | null) => {
      if (trip) {
        setCurrentTripId(trip.id);
        saveTrip(trip);
      } else {
        setCurrentTripId(null);
      }
    },
    [saveTrip]
  );

  const togglePackingItem = useCallback(
    (itemId: string) => {
      if (!currentTrip) return;
      const list = currentTrip.packingList || [];
      const updatedList = list.map((item) =>
        item.id === itemId ? { ...item, packed: !item.packed } : item
      );
      const updatedTrip = { ...currentTrip, packingList: updatedList };
      saveTrip(updatedTrip);
    },
    [currentTrip, saveTrip]
  );

  const addPackingItem = useCallback(
    (text: string, category: string) => {
      if (!currentTrip || !text.trim()) return;
      const list = currentTrip.packingList || [];
      const newItem: PackingItem = {
        id: 'pk-' + Date.now().toString(36),
        text: text.trim(),
        category,
        packed: false,
      };
      const updatedTrip = { ...currentTrip, packingList: [...list, newItem] };
      saveTrip(updatedTrip);
      showToast(`Added to packing checklist: ${text}`);
    },
    [currentTrip, saveTrip, showToast]
  );

  const deletePackingItem = useCallback(
    (itemId: string) => {
      if (!currentTrip) return;
      const list = currentTrip.packingList || [];
      const updatedList = list.filter((i) => i.id !== itemId);
      const updatedTrip = { ...currentTrip, packingList: updatedList };
      saveTrip(updatedTrip);
    },
    [currentTrip, saveTrip]
  );

  const addPackingCategory = useCallback(
    (label: string, color: PackingCategoryColor) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const idBase = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const uniqueId = `${idBase || 'category'}_${Date.now().toString(36).slice(-4)}`;
      setPackingCategories((prev) => [...prev, { id: uniqueId, label: trimmed, color }]);
      showToast(`Added packing category "${trimmed}"`);
    },
    [showToast]
  );

  const updatePackingCategory = useCallback(
    (id: string, updates: Partial<Pick<PackingCategoryOption, 'label' | 'color'>>) => {
      setPackingCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
      );
    },
    []
  );

  const deletePackingCategory = useCallback(
    (id: string) => {
      setPackingCategories((prev) => {
        if (prev.length <= 1) return prev;
        return prev.filter((cat) => cat.id !== id);
      });
      showToast('Removed packing category');
    },
    [showToast]
  );

  const resetPackingCategories = useCallback(() => {
    setPackingCategories(DEFAULT_PACKING_CATEGORIES);
    showToast('Reset packing categories to default');
  }, [showToast]);

  const addCalendarCategory = useCallback(
    (label: string, color: CategoryColor) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const idBase = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const uniqueId = `${idBase || 'category'}_${Date.now().toString(36).slice(-4)}`;
      setCalendarCategories((prev) => [
        ...prev,
        { id: uniqueId, label: trimmed, color, icon: 'tag' },
      ]);
      showToast(`Added calendar category "${trimmed}"`);
    },
    [showToast]
  );

  const updateCalendarCategory = useCallback(
    (id: string, updates: Partial<Pick<CalendarCategoryOption, 'label' | 'color'>>) => {
      setCalendarCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
      );
    },
    []
  );

  const deleteCalendarCategory = useCallback(
    (id: string) => {
      setCalendarCategories((prev) => {
        if (prev.length <= 1) return prev;
        return prev.filter((cat) => cat.id !== id);
      });
      showToast('Removed calendar category');
    },
    [showToast]
  );

  const resetCalendarCategories = useCallback(() => {
    setCalendarCategories(DEFAULT_CALENDAR_CATEGORIES);
    showToast('Reset calendar categories to default');
  }, [showToast]);

  const importTripPackage = useCallback(
    (pkg: ParsedTripImport, options: { replaceCategories: boolean }) => {
      if (options.replaceCategories) {
        if (pkg.calendarCategories.length > 0) {
          setCalendarCategories(pkg.calendarCategories);
        }
        if (pkg.packingCategories.length > 0) {
          setPackingCategories(pkg.packingCategories);
        }
      }

      const importedTrip: Trip = {
        ...pkg.trip,
        id: `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTrips((prev) => [importedTrip, ...prev]);
      setCurrentTripId(importedTrip.id);
      setActiveDay(1);
      setHistory([]);
      setHistoryIndex(-1);
      showToast(
        options.replaceCategories
          ? `Imported "${importedTrip.title}" and updated categories`
          : `Imported "${importedTrip.title}" (${importedTrip.items.length} events)`
      );
      return importedTrip;
    },
    [showToast]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape' && isAddModalOpen) {
          closeAddModal();
        }
        return;
      }

      if (e.key === 'Escape' && isAddModalOpen) {
        closeAddModal();
      } else if (e.key === 'n' || e.key === 'N') {
        if (!isAddModalOpen && screen === 'planner') {
          e.preventDefault();
          openAddModal(activeDay);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, closeAddModal, openAddModal, activeDay, screen]);

  return (
    <TripContext.Provider
      value={{
        screen,
        setScreen,
        trips,
        currentTrip,
        setCurrentTrip,
        createTrip,
        saveTrip,
        importTripPackage,
        deleteTrip,
        loadSampleTrip,
        activeDay,
        setActiveDay,
        addItem,
        updateItem,
        deleteItem,
        duplicateItem,
        reorderItems,
        moveItemToDay,
        undo,
        redo,
        canUndo: historyIndex >= 0,
        canRedo: historyIndex < history.length - 1,
        isAddModalOpen,
        setIsAddModalOpen,
        modalPreset,
        editingItem,
        openAddModal,
        closeAddModal,
        theme,
        setTheme,
        toggleTheme,
        toast,
        showToast,
        togglePackingItem,
        addPackingItem,
        deletePackingItem,
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
        currency,
        setCurrency,
        isProfileOpen,
        setIsProfileOpen,
        use12h,
        setUse12h,
        calendarDensity,
        setCalendarDensity,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
