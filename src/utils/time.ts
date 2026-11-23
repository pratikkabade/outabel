export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const parts = time.split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, minutes));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const getDurationMinutes = (start: string, end: string): number => {
  const startM = timeToMinutes(start);
  const endM = timeToMinutes(end);
  if (endM < startM) {
    return 24 * 60 - startM + endM;
  }
  return endM - startM;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const addMinutesToTime = (time: string, minutesToAdd: number): string => {
  const m = timeToMinutes(time);
  return minutesToTime(m + minutesToAdd);
};

export const getDayDate = (startDateStr: string, dayIndex: number): Date => {
  const [year, month, day] = startDateStr.split('-').map(Number);
  const baseDate = new Date(year, (month || 1) - 1, day || 1);
  baseDate.setDate(baseDate.getDate() + (dayIndex - 1));
  return baseDate;
};

export const shiftIsoDate = (dateStr: string, deltaDays: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year || 2026, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + deltaDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDayDate = (startDateStr: string, dayIndex: number): string => {
  try {
    const date = getDayDate(startDateStr, dayIndex);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return `Day ${dayIndex}`;
  }
};

export const formatShortDate = (startDateStr: string, dayIndex: number): string => {
  try {
    const date = getDayDate(startDateStr, dayIndex);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    });
  } catch {
    return `D${dayIndex}`;
  }
};

export const formatDayOfWeek = (startDateStr: string, dayIndex: number): string => {
  try {
    const date = getDayDate(startDateStr, dayIndex);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } catch {
    return `Day ${dayIndex}`;
  }
};

export interface ConflictWarning {
  itemId1: string;
  itemId2: string;
  type: 'overlap' | 'tight_gap';
  message: string;
}

export const checkDayConflicts = (
  items: Array<{ id: string; start: string; end: string; title: string; location?: string }>
): ConflictWarning[] => {
  const warnings: ConflictWarning[] = [];
  const sorted = [...items].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      const aStart = timeToMinutes(a.start);
      const aEnd = timeToMinutes(a.end);
      const bStart = timeToMinutes(b.start);
      const bEnd = timeToMinutes(b.end);

      if (bStart < aEnd) {
        warnings.push({
          itemId1: a.id,
          itemId2: b.id,
          type: 'overlap',
          message: `"${a.title}" overlaps with "${b.title}" (${a.end} vs ${b.start})`,
        });
      }
    }
  }

  return warnings;
};

export const formatTimeDisplay = (time: string, use12h: boolean = false): string => {
  if (!time) return '';
  if (!use12h) return time;
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ? mStr.padStart(2, '0') : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
};

export const formatHourGutterLabel = (hour: number, use12h: boolean = false): string => {
  if (!use12h) {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}:00 ${ampm}`;
};

export interface PositionedCalendarItem<T> {
  item: T;
  colIndex: number;
  totalCols: number;
}

export function layoutCalendarEvents<T extends { start: string; end: string; id: string }>(
  items: T[]
): PositionedCalendarItem<T>[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    const startDiff = timeToMinutes(a.start) - timeToMinutes(b.start);
    if (startDiff !== 0) return startDiff;
    return timeToMinutes(b.end) - timeToMinutes(a.end);
  });

  const clusters: T[][] = [];
  let currentCluster: T[] = [];
  let currentClusterEnd = -1;

  for (const item of sorted) {
    const itemStart = timeToMinutes(item.start);
    const itemEnd = Math.max(itemStart + 15, timeToMinutes(item.end));

    if (currentCluster.length === 0) {
      currentCluster.push(item);
      currentClusterEnd = itemEnd;
    } else if (itemStart < currentClusterEnd) {
      currentCluster.push(item);
      currentClusterEnd = Math.max(currentClusterEnd, itemEnd);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      currentClusterEnd = itemEnd;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const results: PositionedCalendarItem<T>[] = [];

  for (const cluster of clusters) {
    const colEnds: number[] = [];
    const clusterAssignments: { item: T; colIndex: number }[] = [];

    for (const item of cluster) {
      const itemStart = timeToMinutes(item.start);
      const itemEnd = Math.max(itemStart + 15, timeToMinutes(item.end));

      let placedCol = -1;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= itemStart) {
          placedCol = c;
          colEnds[c] = itemEnd;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = colEnds.length;
        colEnds.push(itemEnd);
      }
      clusterAssignments.push({ item, colIndex: placedCol });
    }

    const totalCols = Math.max(1, colEnds.length);
    for (const assign of clusterAssignments) {
      results.push({
        item: assign.item,
        colIndex: assign.colIndex,
        totalCols,
      });
    }
  }

  return results;
}
