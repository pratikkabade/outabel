import { PackingCategoryColor, PackingCategoryOption } from '../types/trip';

export const DEFAULT_PACKING_CATEGORIES: PackingCategoryOption[] = [
  { id: 'essentials', label: 'Essentials', color: 'blue' },
  { id: 'documents', label: 'Documents', color: 'indigo' },
  { id: 'clothing', label: 'Clothing', color: 'emerald' },
  { id: 'electronics', label: 'Electronics', color: 'amber' },
  { id: 'toiletries', label: 'Toiletries', color: 'rose' },
];

export interface PackingColorStyle {
  id: PackingCategoryColor;
  label: string;
  swatch: string;
  dot: string;
  cardBg: string;
  cardHover: string;
  cardBorder: string;
  badge: string;
  rgbAccent: [number, number, number];
}

export const PACKING_COLOR_STYLES: Record<PackingCategoryColor, PackingColorStyle> = {
  blue: {
    id: 'blue',
    label: 'Blue',
    swatch: 'bg-blue-500',
    dot: 'bg-blue-500',
    cardBg: 'bg-blue-50/85 dark:bg-blue-500/15',
    cardHover: 'hover:bg-blue-100/70 dark:hover:bg-blue-500/25',
    cardBorder: 'border-blue-200/80 dark:border-blue-400/25 border-l-[3px] border-l-blue-500 dark:border-l-blue-400',
    badge: 'bg-blue-500/15 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200',
    rgbAccent: [37, 99, 235],
  },
  indigo: {
    id: 'indigo',
    label: 'Indigo',
    swatch: 'bg-indigo-500',
    dot: 'bg-indigo-500',
    cardBg: 'bg-indigo-50/85 dark:bg-indigo-500/15',
    cardHover: 'hover:bg-indigo-100/70 dark:hover:bg-indigo-500/25',
    cardBorder: 'border-indigo-200/80 dark:border-indigo-400/25 border-l-[3px] border-l-indigo-500 dark:border-l-indigo-400',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-200',
    rgbAccent: [79, 70, 229],
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    swatch: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    cardBg: 'bg-emerald-50/85 dark:bg-emerald-500/15',
    cardHover: 'hover:bg-emerald-100/70 dark:hover:bg-emerald-500/25',
    cardBorder: 'border-emerald-200/80 dark:border-emerald-400/25 border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200',
    rgbAccent: [5, 150, 105],
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    swatch: 'bg-amber-500',
    dot: 'bg-amber-500',
    cardBg: 'bg-amber-50/85 dark:bg-amber-500/15',
    cardHover: 'hover:bg-amber-100/70 dark:hover:bg-amber-500/25',
    cardBorder: 'border-amber-200/80 dark:border-amber-400/25 border-l-[3px] border-l-amber-500 dark:border-l-amber-400',
    badge: 'bg-amber-500/15 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200',
    rgbAccent: [217, 119, 6],
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    swatch: 'bg-rose-500',
    dot: 'bg-rose-500',
    cardBg: 'bg-rose-50/85 dark:bg-rose-500/15',
    cardHover: 'hover:bg-rose-100/70 dark:hover:bg-rose-500/25',
    cardBorder: 'border-rose-200/80 dark:border-rose-400/25 border-l-[3px] border-l-rose-500 dark:border-l-rose-400',
    badge: 'bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200',
    rgbAccent: [225, 29, 72],
  },
  purple: {
    id: 'purple',
    label: 'Purple',
    swatch: 'bg-purple-500',
    dot: 'bg-purple-500',
    cardBg: 'bg-purple-50/85 dark:bg-purple-500/15',
    cardHover: 'hover:bg-purple-100/70 dark:hover:bg-purple-500/25',
    cardBorder: 'border-purple-200/80 dark:border-purple-400/25 border-l-[3px] border-l-purple-500 dark:border-l-purple-400',
    badge: 'bg-purple-500/15 text-purple-700 dark:bg-purple-400/20 dark:text-purple-200',
    rgbAccent: [147, 51, 234],
  },
  sky: {
    id: 'sky',
    label: 'Sky',
    swatch: 'bg-sky-500',
    dot: 'bg-sky-500',
    cardBg: 'bg-sky-50/85 dark:bg-sky-500/15',
    cardHover: 'hover:bg-sky-100/70 dark:hover:bg-sky-500/25',
    cardBorder: 'border-sky-200/80 dark:border-sky-400/25 border-l-[3px] border-l-sky-500 dark:border-l-sky-400',
    badge: 'bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-200',
    rgbAccent: [2, 132, 199],
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    swatch: 'bg-slate-500',
    dot: 'bg-slate-500',
    cardBg: 'bg-slate-100/85 dark:bg-slate-500/15',
    cardHover: 'hover:bg-slate-200/70 dark:hover:bg-slate-500/25',
    cardBorder: 'border-slate-200/90 dark:border-slate-400/25 border-l-[3px] border-l-slate-500 dark:border-l-slate-400',
    badge: 'bg-slate-500/15 text-slate-700 dark:bg-slate-400/20 dark:text-slate-200',
    rgbAccent: [71, 85, 105],
  },
};

export const PACKING_COLOR_LIST = Object.values(PACKING_COLOR_STYLES);

export const resolvePackingCategory = (
  categoryKey: string,
  categories: PackingCategoryOption[]
): { label: string; style: PackingColorStyle } => {
  const normalized = categoryKey.trim().toLowerCase();
  const match = categories.find(
    (c) => c.id.toLowerCase() === normalized || c.label.toLowerCase() === normalized
  );
  if (match) {
    return {
      label: match.label,
      style: PACKING_COLOR_STYLES[match.color] || PACKING_COLOR_STYLES.slate,
    };
  }
  const fallbackDefault = DEFAULT_PACKING_CATEGORIES.find(
    (c) => c.id.toLowerCase() === normalized
  );
  if (fallbackDefault) {
    return {
      label: fallbackDefault.label,
      style: PACKING_COLOR_STYLES[fallbackDefault.color],
    };
  }
  return {
    label: categoryKey || 'General',
    style: PACKING_COLOR_STYLES.slate,
  };
};
