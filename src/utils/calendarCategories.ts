import React from 'react';
import {
  Plane,
  Hotel,
  UtensilsCrossed,
  Camera,
  Coffee,
  FileText,
  Tag,
} from 'lucide-react';
import {
  CalendarCategoryIcon,
  CalendarCategoryOption,
  CategoryColor,
} from '../types/trip';

export const DEFAULT_CALENDAR_CATEGORIES: CalendarCategoryOption[] = [
  { id: 'travel', label: 'Travel', color: 'blue', icon: 'plane' },
  { id: 'stay', label: 'Stay', color: 'indigo', icon: 'hotel' },
  { id: 'food', label: 'Food', color: 'amber', icon: 'utensils' },
  { id: 'activity', label: 'Activity', color: 'emerald', icon: 'camera' },
  { id: 'buffer', label: 'Buffer', color: 'sky', icon: 'coffee' },
  { id: 'note', label: 'Note', color: 'slate', icon: 'file' },
];

export interface CalendarColorStyle {
  id: CategoryColor;
  label: string;
  swatch: string;
  bg: string;
  hoverBg: string;
  border: string;
  text: string;
  timeText: string;
  badge: string;
  link: string;
  divider: string;
  iconText: string;
  selectedModal: string;
  resizePill: string;
  resizePillHover: string;
  rgbAccent: [number, number, number];
  rgbFill: [number, number, number];
}

export const CALENDAR_COLOR_STYLES: Record<CategoryColor, CalendarColorStyle> = {
  blue: {
    id: 'blue',
    label: 'Blue',
    swatch: 'bg-blue-500',
    bg: 'bg-blue-100/80 dark:bg-blue-500/20',
    hoverBg: 'hover:bg-blue-200/80 dark:hover:bg-blue-500/30',
    border:
      'border border-blue-200/90 dark:border-blue-400/25 border-l-[3px] border-l-blue-500 dark:border-l-blue-400',
    text: 'text-neutral-900 dark:text-white',
    timeText: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-500/15 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200',
    link: 'text-blue-700 dark:text-blue-300',
    divider: 'border-blue-200/70 dark:border-blue-400/20',
    iconText: 'text-blue-600 dark:text-blue-400',
    selectedModal:
      'bg-blue-100/90 dark:bg-blue-500/25 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500/35 shadow-xs',
    resizePill: 'bg-blue-500/40 group-hover/event:bg-blue-500/70 dark:bg-blue-300/45 dark:group-hover/event:bg-blue-300/75',
    resizePillHover: 'bg-blue-600 dark:bg-white shadow-xs',
    rgbAccent: [37, 99, 235],
    rgbFill: [239, 246, 255],
  },
  indigo: {
    id: 'indigo',
    label: 'Indigo',
    swatch: 'bg-indigo-500',
    bg: 'bg-indigo-100/80 dark:bg-indigo-500/20',
    hoverBg: 'hover:bg-indigo-200/80 dark:hover:bg-indigo-500/30',
    border:
      'border border-indigo-200/90 dark:border-indigo-400/25 border-l-[3px] border-l-indigo-500 dark:border-l-indigo-400',
    text: 'text-neutral-900 dark:text-white',
    timeText: 'text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-200',
    link: 'text-indigo-700 dark:text-indigo-300',
    divider: 'border-indigo-200/70 dark:border-indigo-400/20',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    selectedModal:
      'bg-indigo-100/90 dark:bg-indigo-500/25 border-indigo-500 dark:border-indigo-400 text-indigo-900 dark:text-indigo-100 ring-1 ring-indigo-500/35 shadow-xs',
    resizePill: 'bg-indigo-500/40 group-hover/event:bg-indigo-500/70 dark:bg-indigo-300/45 dark:group-hover/event:bg-indigo-300/75',
    resizePillHover: 'bg-indigo-600 dark:bg-white shadow-xs',
    rgbAccent: [79, 70, 229],
    rgbFill: [238, 242, 255],
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    swatch: 'bg-emerald-500',
    bg: 'bg-emerald-100/80 dark:bg-emerald-500/20',
    hoverBg: 'hover:bg-emerald-200/80 dark:hover:bg-emerald-500/30',
    border:
      'border border-emerald-200/90 dark:border-emerald-400/25 border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400',
    text: 'text-neutral-900 dark:text-white',
    timeText: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200',
    link: 'text-emerald-700 dark:text-emerald-300',
    divider: 'border-emerald-200/70 dark:border-emerald-400/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    selectedModal:
      'bg-emerald-100/90 dark:bg-emerald-500/25 border-emerald-500 dark:border-emerald-400 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/35 shadow-xs',
    resizePill: 'bg-emerald-500/40 group-hover/event:bg-emerald-500/70 dark:bg-emerald-300/45 dark:group-hover/event:bg-emerald-300/75',
    resizePillHover: 'bg-emerald-600 dark:bg-white shadow-xs',
    rgbAccent: [5, 150, 105],
    rgbFill: [236, 253, 245],
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    swatch: 'bg-amber-500',
    bg: 'bg-amber-100/80 dark:bg-amber-500/20',
    hoverBg: 'hover:bg-amber-200/80 dark:hover:bg-amber-500/30',
    border:
      'border border-amber-200/90 dark:border-amber-400/25 border-l-[3px] border-l-amber-500 dark:border-l-amber-400',
    text: 'text-neutral-900 dark:text-white',
    timeText: 'text-amber-800 dark:text-amber-300',
    badge: 'bg-amber-500/15 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200',
    link: 'text-amber-800 dark:text-amber-300',
    divider: 'border-amber-200/70 dark:border-amber-400/20',
    iconText: 'text-amber-600 dark:text-amber-400',
    selectedModal:
      'bg-amber-100/90 dark:bg-amber-500/25 border-amber-500 dark:border-amber-400 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500/35 shadow-xs',
    resizePill: 'bg-amber-500/40 group-hover/event:bg-amber-500/70 dark:bg-amber-300/45 dark:group-hover/event:bg-amber-300/75',
    resizePillHover: 'bg-amber-600 dark:bg-white shadow-xs',
    rgbAccent: [217, 119, 6],
    rgbFill: [255, 251, 235],
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    swatch: 'bg-rose-500',
    bg: 'bg-rose-100/80 dark:bg-rose-500/20',
    hoverBg: 'hover:bg-rose-200/80 dark:hover:bg-rose-500/30',
    border:
      'border border-rose-200/90 dark:border-rose-400/25 border-l-[3px] border-l-rose-500 dark:border-l-rose-400',
    text: 'text-neutral-900 dark:text-white',
    timeText: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200',
    link: 'text-rose-700 dark:text-rose-300',
    divider: 'border-rose-200/70 dark:border-rose-400/20',
    iconText: 'text-rose-600 dark:text-rose-400',
    selectedModal:
      'bg-rose-100/90 dark:bg-rose-500/25 border-rose-500 dark:border-rose-400 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500/35 shadow-xs',
    resizePill: 'bg-rose-500/40 group-hover/event:bg-rose-500/70 dark:bg-rose-300/45 dark:group-hover/event:bg-rose-300/75',
    resizePillHover: 'bg-rose-600 dark:bg-white shadow-xs',
    rgbAccent: [225, 29, 72],
    rgbFill: [255, 241, 242],
  },
  purple: {
    id: 'purple',
    label: 'Purple',
    swatch: 'bg-purple-500',
    bg: 'bg-purple-100/80 dark:bg-purple-500/20',
    hoverBg: 'hover:bg-purple-200/80 dark:hover:bg-purple-500/30',
    border:
      'border border-purple-200/90 dark:border-purple-400/25 border-l-[3px] border-l-purple-500 dark:border-l-purple-400',
    text: 'text-neutral-900 dark:text-white',
    timeText: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-500/15 text-purple-700 dark:bg-purple-400/20 dark:text-purple-200',
    link: 'text-purple-700 dark:text-purple-300',
    divider: 'border-purple-200/70 dark:border-purple-400/20',
    iconText: 'text-purple-600 dark:text-purple-400',
    selectedModal:
      'bg-purple-100/90 dark:bg-purple-500/25 border-purple-500 dark:border-purple-400 text-purple-900 dark:text-purple-100 ring-1 ring-purple-500/35 shadow-xs',
    resizePill: 'bg-purple-500/40 group-hover/event:bg-purple-500/70 dark:bg-purple-300/45 dark:group-hover/event:bg-purple-300/75',
    resizePillHover: 'bg-purple-600 dark:bg-white shadow-xs',
    rgbAccent: [147, 51, 234],
    rgbFill: [250, 245, 255],
  },
  sky: {
    id: 'sky',
    label: 'Sky',
    swatch: 'bg-sky-500',
    bg: 'bg-sky-100/80 dark:bg-sky-500/20',
    hoverBg: 'hover:bg-sky-200/80 dark:hover:bg-sky-500/30',
    border:
      'border border-sky-200/90 dark:border-sky-400/25 border-l-[3px] border-l-sky-500 dark:border-l-sky-400',
    text: 'text-neutral-900 dark:text-white',
    timeText: 'text-sky-700 dark:text-sky-300',
    badge: 'bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-200',
    link: 'text-sky-700 dark:text-sky-300',
    divider: 'border-sky-200/70 dark:border-sky-400/20',
    iconText: 'text-sky-600 dark:text-sky-400',
    selectedModal:
      'bg-sky-100/90 dark:bg-sky-500/25 border-sky-500 dark:border-sky-400 text-sky-900 dark:text-sky-100 ring-1 ring-sky-500/35 shadow-xs',
    resizePill: 'bg-sky-500/40 group-hover/event:bg-sky-500/70 dark:bg-sky-300/45 dark:group-hover/event:bg-sky-300/75',
    resizePillHover: 'bg-sky-600 dark:bg-white shadow-xs',
    rgbAccent: [2, 132, 199],
    rgbFill: [240, 249, 255],
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    swatch: 'bg-slate-500',
    bg: 'bg-slate-100/90 dark:bg-slate-500/20',
    hoverBg: 'hover:bg-slate-200/80 dark:hover:bg-slate-500/30',
    border:
      'border border-slate-200/90 dark:border-slate-400/25 border-l-[3px] border-l-slate-500 dark:border-l-slate-400',
    text: 'text-neutral-900 dark:text-white',
    timeText: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-500/15 text-slate-700 dark:bg-slate-400/20 dark:text-slate-200',
    link: 'text-slate-700 dark:text-slate-300',
    divider: 'border-slate-200/80 dark:border-slate-400/20',
    iconText: 'text-slate-600 dark:text-slate-400',
    selectedModal:
      'bg-slate-200/90 dark:bg-slate-500/25 border-slate-500 dark:border-slate-400 text-slate-900 dark:text-slate-100 ring-1 ring-slate-500/35 shadow-xs',
    resizePill: 'bg-slate-500/40 group-hover/event:bg-slate-500/70 dark:bg-slate-300/45 dark:group-hover/event:bg-slate-300/75',
    resizePillHover: 'bg-slate-600 dark:bg-white shadow-xs',
    rgbAccent: [71, 85, 105],
    rgbFill: [248, 250, 252],
  },
};

export const CALENDAR_COLOR_LIST = Object.values(CALENDAR_COLOR_STYLES);

const ICON_MAP: Record<CalendarCategoryIcon, React.ElementType> = {
  plane: Plane,
  hotel: Hotel,
  utensils: UtensilsCrossed,
  camera: Camera,
  coffee: Coffee,
  file: FileText,
  tag: Tag,
};

export const getCalendarCategoryIcon = (icon?: CalendarCategoryIcon): React.ElementType => {
  return (icon && ICON_MAP[icon]) || Tag;
};

export const resolveCalendarCategory = (
  typeKey: string,
  categories: CalendarCategoryOption[]
): {
  label: string;
  style: CalendarColorStyle;
  icon: React.ElementType;
} => {
  const normalized = (typeKey || '').trim().toLowerCase();
  const match = categories.find(
    (c) => c.id.toLowerCase() === normalized || c.label.toLowerCase() === normalized
  );
  if (match) {
    return {
      label: match.label,
      style: CALENDAR_COLOR_STYLES[match.color] || CALENDAR_COLOR_STYLES.slate,
      icon: getCalendarCategoryIcon(match.icon),
    };
  }
  const fallbackDefault = DEFAULT_CALENDAR_CATEGORIES.find(
    (c) => c.id.toLowerCase() === normalized
  );
  if (fallbackDefault) {
    return {
      label: fallbackDefault.label,
      style: CALENDAR_COLOR_STYLES[fallbackDefault.color],
      icon: getCalendarCategoryIcon(fallbackDefault.icon),
    };
  }
  return {
    label: typeKey || 'Activity',
    style: CALENDAR_COLOR_STYLES.emerald,
    icon: Tag,
  };
};
