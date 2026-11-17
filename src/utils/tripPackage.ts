import JSZip from 'jszip';
import {
  CalendarCategoryOption,
  CategoryColor,
  ItineraryItem,
  PackingCategoryOption,
  PackingItem,
  Trip,
} from '../types/trip';
import { generateICSFile } from './ics';
import {
  CALENDAR_COLOR_STYLES,
  DEFAULT_CALENDAR_CATEGORIES,
  resolveCalendarCategory,
} from './calendarCategories';
import {
  DEFAULT_PACKING_CATEGORIES,
  PACKING_COLOR_STYLES,
  resolvePackingCategory,
} from './packingCategories';

export interface ExportedItineraryItem extends ItineraryItem {
  categoryLabel: string;
  categoryColor: CategoryColor;
}

export interface ExportedPackingItem extends PackingItem {
  categoryLabel: string;
  categoryColor: CategoryColor;
}

export interface ExportedTripPackage {
  format: 'outabel-trip-package';
  version: 1;
  exportedAt: string;
  trip: Omit<Trip, 'items' | 'packingList'> & {
    items: ExportedItineraryItem[];
    packingList: ExportedPackingItem[];
  };
  categories: {
    calendar: CalendarCategoryOption[];
    packing: PackingCategoryOption[];
  };
}

export interface ParsedTripImport {
  trip: Trip;
  calendarCategories: CalendarCategoryOption[];
  packingCategories: PackingCategoryOption[];
  hasExplicitCalendarCategories: boolean;
  hasExplicitPackingCategories: boolean;
}

export interface CategoryDiffItem {
  scope: 'Calendar' | 'Packing';
  type: 'color' | 'label' | 'added' | 'removed';
  message: string;
  fromColor?: CategoryColor;
  toColor?: CategoryColor;
}

export interface CategoryDiffResult {
  hasDifferences: boolean;
  items: CategoryDiffItem[];
}

const VALID_COLORS: Set<CategoryColor> = new Set([
  'blue',
  'indigo',
  'emerald',
  'amber',
  'rose',
  'purple',
  'sky',
  'slate',
]);

const sanitizeColor = (color: unknown, fallback: CategoryColor = 'slate'): CategoryColor => {
  if (typeof color === 'string' && VALID_COLORS.has(color as CategoryColor)) {
    return color as CategoryColor;
  }
  return fallback;
};

const getSafeFilePrefix = (title: string): string => {
  const safe = (title || 'trip').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  return safe || 'trip';
};

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const buildTripPackage = (
  trip: Trip,
  calendarCategories: CalendarCategoryOption[],
  packingCategories: PackingCategoryOption[]
): ExportedTripPackage => {
  const exportedItems: ExportedItineraryItem[] = trip.items.map((item) => {
    const resolved = resolveCalendarCategory(item.type, calendarCategories);
    return {
      ...item,
      categoryLabel: resolved.label,
      categoryColor: resolved.style.id,
    };
  });

  const exportedPacking: ExportedPackingItem[] = (trip.packingList || []).map((pack) => {
    const resolved = resolvePackingCategory(pack.category, packingCategories);
    return {
      ...pack,
      categoryLabel: resolved.label,
      categoryColor: resolved.style.id,
    };
  });

  return {
    format: 'outabel-trip-package',
    version: 1,
    exportedAt: new Date().toISOString(),
    trip: {
      ...trip,
      items: exportedItems,
      packingList: exportedPacking,
    },
    categories: {
      calendar: calendarCategories.map((c) => ({ ...c })),
      packing: packingCategories.map((c) => ({ ...c })),
    },
  };
};

export const downloadTripJSON = (
  trip: Trip,
  calendarCategories: CalendarCategoryOption[],
  packingCategories: PackingCategoryOption[]
) => {
  const pkg = buildTripPackage(trip, calendarCategories, packingCategories);
  const jsonText = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
  const prefix = getSafeFilePrefix(trip.title);
  triggerBlobDownload(blob, `${prefix}_itinerary.json`);
};

export const downloadTripZIP = async (
  trip: Trip,
  calendarCategories: CalendarCategoryOption[],
  packingCategories: PackingCategoryOption[]
) => {
  const zip = new JSZip();
  const prefix = getSafeFilePrefix(trip.title);
  const icsContent = generateICSFile(trip);
  const pkg = buildTripPackage(trip, calendarCategories, packingCategories);
  const jsonContent = JSON.stringify(pkg, null, 2);

  zip.file(`${prefix}_itinerary.ics`, icsContent);
  zip.file(`${prefix}_itinerary.json`, jsonContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(blob, `${prefix}_itinerary.zip`);
};

const normalizeCalendarCategories = (raw: unknown): CalendarCategoryOption[] | null => {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const result: CalendarCategoryOption[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : '';
    const label = typeof obj.label === 'string' && obj.label.trim() ? obj.label.trim() : id;
    if (!id || !label) continue;
    result.push({
      id,
      label,
      color: sanitizeColor(obj.color, 'slate'),
      icon: typeof obj.icon === 'string' ? (obj.icon as CalendarCategoryOption['icon']) : 'tag',
    });
  }
  return result.length > 0 ? result : null;
};

const normalizePackingCategories = (raw: unknown): PackingCategoryOption[] | null => {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const result: PackingCategoryOption[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : '';
    const label = typeof obj.label === 'string' && obj.label.trim() ? obj.label.trim() : id;
    if (!id || !label) continue;
    result.push({
      id,
      label,
      color: sanitizeColor(obj.color, 'slate'),
    });
  }
  return result.length > 0 ? result : null;
};

const sanitizeItineraryItems = (rawItems: unknown): ItineraryItem[] => {
  if (!Array.isArray(rawItems)) return [];
  const items: ItineraryItem[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const raw = rawItems[i];
    if (!raw || typeof raw !== 'object') continue;
    const obj = raw as Record<string, unknown>;
    const title = typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : 'Untitled Event';
    const type = typeof obj.type === 'string' && obj.type.trim() ? obj.type.trim() : 'activity';
    const day = typeof obj.day === 'number' && Number.isFinite(obj.day) ? Math.max(1, Math.round(obj.day)) : 1;
    const start = typeof obj.start === 'string' && /^\d{2}:\d{2}$/.test(obj.start) ? obj.start : '09:00';
    const end = typeof obj.end === 'string' && /^\d{2}:\d{2}$/.test(obj.end) ? obj.end : '10:30';

    items.push({
      id: typeof obj.id === 'string' && obj.id.trim() ? obj.id : `item-imp-${i}-${Date.now().toString(36)}`,
      type,
      title,
      day,
      start,
      end,
      location: typeof obj.location === 'string' && obj.location.trim() ? obj.location : undefined,
      cost: typeof obj.cost === 'number' && Number.isFinite(obj.cost) ? obj.cost : undefined,
      notes: typeof obj.notes === 'string' && obj.notes.trim() ? obj.notes : undefined,
      travelMode: typeof obj.travelMode === 'string' ? (obj.travelMode as ItineraryItem['travelMode']) : undefined,
      from: typeof obj.from === 'string' ? obj.from : undefined,
      to: typeof obj.to === 'string' ? obj.to : undefined,
      mealType: typeof obj.mealType === 'string' ? (obj.mealType as ItineraryItem['mealType']) : undefined,
      stayName: typeof obj.stayName === 'string' ? obj.stayName : undefined,
      isCheckIn: typeof obj.isCheckIn === 'boolean' ? obj.isCheckIn : undefined,
      isCheckOut: typeof obj.isCheckOut === 'boolean' ? obj.isCheckOut : undefined,
    });
  }
  return items;
};

const sanitizePackingItems = (rawPacking: unknown): PackingItem[] => {
  if (!Array.isArray(rawPacking)) return [];
  const items: PackingItem[] = [];
  for (let i = 0; i < rawPacking.length; i++) {
    const raw = rawPacking[i];
    if (!raw || typeof raw !== 'object') continue;
    const obj = raw as Record<string, unknown>;
    const text = typeof obj.text === 'string' && obj.text.trim() ? obj.text.trim() : '';
    if (!text) continue;
    items.push({
      id: typeof obj.id === 'string' && obj.id.trim() ? obj.id : `pk-imp-${i}-${Date.now().toString(36)}`,
      text,
      category: typeof obj.category === 'string' && obj.category.trim() ? obj.category.trim() : 'essentials',
      packed: Boolean(obj.packed),
    });
  }
  return items;
};

export const parseTripImportFile = async (file: File): Promise<ParsedTripImport> => {
  const fileName = file.name.toLowerCase();
  let jsonText = '';

  const isZipByExt = fileName.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
  let looksLikeZip = isZipByExt;

  if (!looksLikeZip) {
    const headerSlice = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(headerSlice);
    if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
      looksLikeZip = true;
    }
  }

  if (looksLikeZip) {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const jsonEntries = Object.values(zip.files).filter(
      (entry) => !entry.dir && entry.name.toLowerCase().endsWith('.json') && !entry.name.startsWith('__MACOSX')
    );

    if (jsonEntries.length === 0) {
      throw new Error('This .zip archive does not contain an itinerary .json file.');
    }

    const preferredEntry =
      jsonEntries.find((e) => e.name.toLowerCase().includes('itinerary')) || jsonEntries[0];
    jsonText = await preferredEntry.async('text');
  } else {
    jsonText = await file.text();
  }

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(jsonText);
  } catch {
    throw new Error('Could not parse JSON data. Please select a valid exported .json or .zip file.');
  }

  if (!parsedRaw || typeof parsedRaw !== 'object') {
    throw new Error('Invalid trip package format.');
  }

  const root = parsedRaw as Record<string, unknown>;
  const rawTrip = (root.trip && typeof root.trip === 'object' ? root.trip : root) as Record<string, unknown>;

  if (typeof rawTrip.title !== 'string' || !Array.isArray(rawTrip.items)) {
    throw new Error('File is missing required trip title or itinerary items.');
  }

  const items = sanitizeItineraryItems(rawTrip.items);
  const packingList = sanitizePackingItems(rawTrip.packingList);

  const prefsRaw = (rawTrip.preferences && typeof rawTrip.preferences === 'object'
    ? rawTrip.preferences
    : {}) as Record<string, unknown>;

  const numDaysRaw = typeof rawTrip.numDays === 'number' && Number.isFinite(rawTrip.numDays) ? Math.max(1, Math.round(rawTrip.numDays)) : 5;
  const maxItemDay = items.reduce((max, item) => Math.max(max, item.day), 1);

  const nowIso = new Date().toISOString();
  const trip: Trip = {
    id: `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: rawTrip.title.trim() || 'Imported Trip',
    from: typeof rawTrip.from === 'string' && rawTrip.from.trim() ? rawTrip.from.trim() : 'Origin',
    to: typeof rawTrip.to === 'string' && rawTrip.to.trim() ? rawTrip.to.trim() : 'Destination',
    startDate:
      typeof rawTrip.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawTrip.startDate)
        ? rawTrip.startDate
        : new Date().toISOString().split('T')[0],
    numDays: Math.max(numDaysRaw, maxItemDay),
    preferences: {
      preferredWakeTime:
        typeof prefsRaw.preferredWakeTime === 'string' ? prefsRaw.preferredWakeTime : '07:30',
      dailyStartTime:
        typeof prefsRaw.dailyStartTime === 'string' ? prefsRaw.dailyStartTime : '09:00',
      pace:
        prefsRaw.pace === 'relaxed' || prefsRaw.pace === 'balanced' || prefsRaw.pace === 'packed'
          ? prefsRaw.pace
          : 'balanced',
    },
    items,
    packingList,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const categoriesBlock =
    root.categories && typeof root.categories === 'object'
      ? (root.categories as Record<string, unknown>)
      : root;

  const parsedCalendarCats =
    normalizeCalendarCategories(categoriesBlock.calendar) ||
    normalizeCalendarCategories(root.calendarCategories);
  const parsedPackingCats =
    normalizePackingCategories(categoriesBlock.packing) ||
    normalizePackingCategories(root.packingCategories);

  // Reconstruct any missing item categories from per-item categoryLabel/categoryColor metadata
  const calendarCategories: CalendarCategoryOption[] = parsedCalendarCats
    ? [...parsedCalendarCats]
    : [...DEFAULT_CALENDAR_CATEGORIES];

  if (Array.isArray(rawTrip.items)) {
    for (const rawItem of rawTrip.items) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      const obj = rawItem as Record<string, unknown>;
      const typeId = typeof obj.type === 'string' ? obj.type.trim() : '';
      if (!typeId) continue;
      const exists = calendarCategories.some(
        (c) => c.id.toLowerCase() === typeId.toLowerCase()
      );
      if (!exists) {
        calendarCategories.push({
          id: typeId,
          label:
            typeof obj.categoryLabel === 'string' && obj.categoryLabel.trim()
              ? obj.categoryLabel.trim()
              : typeId,
          color: sanitizeColor(obj.categoryColor, 'emerald'),
          icon: 'tag',
        });
      }
    }
  }

  const packingCategories: PackingCategoryOption[] = parsedPackingCats
    ? [...parsedPackingCats]
    : [...DEFAULT_PACKING_CATEGORIES];

  if (Array.isArray(rawTrip.packingList)) {
    for (const rawPack of rawTrip.packingList) {
      if (!rawPack || typeof rawPack !== 'object') continue;
      const obj = rawPack as Record<string, unknown>;
      const catId = typeof obj.category === 'string' ? obj.category.trim() : '';
      if (!catId) continue;
      const exists = packingCategories.some(
        (c) => c.id.toLowerCase() === catId.toLowerCase()
      );
      if (!exists) {
        packingCategories.push({
          id: catId,
          label:
            typeof obj.categoryLabel === 'string' && obj.categoryLabel.trim()
              ? obj.categoryLabel.trim()
              : catId,
          color: sanitizeColor(obj.categoryColor, 'slate'),
        });
      }
    }
  }

  return {
    trip,
    calendarCategories,
    packingCategories,
    hasExplicitCalendarCategories: Boolean(parsedCalendarCats),
    hasExplicitPackingCategories: Boolean(parsedPackingCats),
  };
};

export const compareCategoriesWithWorkspace = (
  importedCalendar: CalendarCategoryOption[],
  currentCalendar: CalendarCategoryOption[],
  importedPacking: PackingCategoryOption[],
  currentPacking: PackingCategoryOption[]
): CategoryDiffResult => {
  const diffs: CategoryDiffItem[] = [];

  const checkListDiffs = (
    scope: 'Calendar' | 'Packing',
    importedList: Array<{ id: string; label: string; color: CategoryColor }>,
    currentList: Array<{ id: string; label: string; color: CategoryColor }>,
    colorLabelMap: Record<CategoryColor, { label: string }>
  ) => {
    const currentById = new Map<string, { id: string; label: string; color: CategoryColor }>(
      currentList.map((c) => [c.id.toLowerCase(), c])
    );
    const importedById = new Map<string, { id: string; label: string; color: CategoryColor }>(
      importedList.map((c) => [c.id.toLowerCase(), c])
    );

    for (const imp of importedList) {
      const cur = currentById.get(imp.id.toLowerCase());
      if (!cur) {
        diffs.push({
          scope,
          type: 'added',
          message: `${scope}: Adds "${imp.label}" (${colorLabelMap[imp.color]?.label || imp.color})`,
          toColor: imp.color,
        });
      } else {
        if (cur.color !== imp.color) {
          diffs.push({
            scope,
            type: 'color',
            message: `${scope}: "${imp.label}" color differs (${colorLabelMap[cur.color]?.label || cur.color} → ${colorLabelMap[imp.color]?.label || imp.color})`,
            fromColor: cur.color,
            toColor: imp.color,
          });
        }
        if (cur.label.trim() !== imp.label.trim()) {
          diffs.push({
            scope,
            type: 'label',
            message: `${scope}: Category name differs ("${cur.label}" → "${imp.label}")`,
            fromColor: cur.color,
            toColor: imp.color,
          });
        }
      }
    }

    for (const cur of currentList) {
      if (!importedById.has(cur.id.toLowerCase())) {
        diffs.push({
          scope,
          type: 'removed',
          message: `${scope}: Current category "${cur.label}" is not in the imported file`,
          fromColor: cur.color,
        });
      }
    }
  };

  checkListDiffs('Calendar', importedCalendar, currentCalendar, CALENDAR_COLOR_STYLES);
  checkListDiffs('Packing', importedPacking, currentPacking, PACKING_COLOR_STYLES);

  return {
    hasDifferences: diffs.length > 0,
    items: diffs,
  };
};
