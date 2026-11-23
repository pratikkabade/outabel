import { CalendarCategoryOption, ItineraryItem, TravelMode, Trip } from '../types/trip';
import { getDayDate } from './time';

const formatICSDate = (date: Date, timeStr: string): string => {
  const [hStr, mStr] = timeStr.split(':');
  const hours = parseInt(hStr || '0', 10);
  const minutes = parseInt(mStr || '0', 10);

  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);

  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = '00';

  return `${year}${month}${day}T${h}${m}${s}`;
};

const escapeICSText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

const unescapeICSText = (text: string): string => {
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
};

export const generateICSFile = (trip: Trip): string => {
  const now = new Date();
  const dtStamp = formatICSDate(now, `${now.getHours()}:${now.getMinutes()}`) + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Outabel//The Trip Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(trip.title)}`,
  ];

  trip.items.forEach((item) => {
    const itemDate = getDayDate(trip.startDate, item.day);
    const dtStart = formatICSDate(itemDate, item.start);
    const dtEnd = formatICSDate(itemDate, item.end);
    const uid = `${item.id}-${item.day}@outabel.app`;

    const descriptionParts: string[] = [];
    if (item.type) descriptionParts.push(`Type: ${item.type.toUpperCase()}`);
    if (item.cost) descriptionParts.push(`Cost: ${item.cost}`);
    if (item.notes) descriptionParts.push(`Notes: ${item.notes}`);
    if (item.travelMode) descriptionParts.push(`Mode: ${item.travelMode}`);
    if (item.from && item.to) descriptionParts.push(`Route: ${item.from} -> ${item.to}`);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeICSText(item.title)}`);

    if (item.location) {
      lines.push(`LOCATION:${escapeICSText(item.location)}`);
    }

    if (descriptionParts.length > 0) {
      lines.push(`DESCRIPTION:${escapeICSText(descriptionParts.join('\n'))}`);
    }

    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

export const downloadICS = (trip: Trip) => {
  const icsData = generateICSFile(trip);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = trip.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  link.href = url;
  link.setAttribute('download', `${safeTitle}_itinerary.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface ParsedICSDateTime {
  dateStr: string;
  timeStr: string;
  isAllDay: boolean;
}

const parseICSDateTime = (rawValue: string): ParsedICSDateTime | null => {
  const cleaned = rawValue.trim();
  // Match YYYYMMDDTHHMMSS or YYYYMMDDTHHMM or YYYYMMDD
  const match = cleaned.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(?:\d{2})?)?/);
  if (!match) return null;

  const [, year, month, day, hh, mm] = match;
  const dateStr = `${year}-${month}-${day}`;
  if (hh === undefined || mm === undefined) {
    return { dateStr, timeStr: '09:00', isAllDay: true };
  }
  const hourNum = Math.min(23, Math.max(0, parseInt(hh, 10)));
  const minNum = Math.min(59, Math.max(0, parseInt(mm, 10)));
  return {
    dateStr,
    timeStr: `${hourNum.toString().padStart(2, '0')}:${minNum.toString().padStart(2, '0')}`,
    isAllDay: false,
  };
};

const addMinutesClamped = (timeStr: string, mins: number): string => {
  const [h, m] = timeStr.split(':').map(Number);
  const total = Math.min(23 * 60 + 55, (h || 0) * 60 + (m || 0) + mins);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
};

const timeToMins = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const diffDays = (baseDateStr: string, targetDateStr: string): number => {
  const [by, bm, bd] = baseDateStr.split('-').map(Number);
  const [ty, tm, td] = targetDateStr.split('-').map(Number);
  const baseUtc = Date.UTC(by, (bm || 1) - 1, bd || 1);
  const targetUtc = Date.UTC(ty, (tm || 1) - 1, td || 1);
  return Math.round((targetUtc - baseUtc) / (1000 * 60 * 60 * 24));
};

const normalizeTravelMode = (raw: string): TravelMode | undefined => {
  const val = raw.trim().toLowerCase();
  const valid: TravelMode[] = ['flight', 'train', 'car', 'bus', 'ferry', 'walk', 'rideshare'];
  if (valid.includes(val as TravelMode)) return val as TravelMode;
  if (val.includes('cab') || val.includes('taxi') || val.includes('uber') || val.includes('ola') || val.includes('auto')) {
    return 'rideshare';
  }
  if (val.includes('drive') || val.includes('road')) return 'car';
  if (val.includes('rail') || val.includes('metro')) return 'train';
  if (val.includes('boat') || val.includes('cruise')) return 'ferry';
  return undefined;
};

const resolveItemType = (
  rawType: string | undefined,
  summary: string,
  categories: string | undefined,
  validCategories?: CalendarCategoryOption[]
): string => {
  const candidate = (rawType || categories || '').trim().toLowerCase();
  if (candidate && validCategories?.length) {
    const exactId = validCategories.find((c) => c.id.toLowerCase() === candidate);
    if (exactId) return exactId.id;
    const exactLabel = validCategories.find((c) => c.label.toLowerCase() === candidate);
    if (exactLabel) return exactLabel.id;
  }

  const combined = `${candidate} ${summary}`.toLowerCase();
  if (
    candidate === 'travel' ||
    candidate === 'flight' ||
    candidate === 'transit' ||
    candidate === 'transport' ||
    /\b(flight|fly|train|express|bus|drive|depart|arrival|transfer|ferry|cab|taxi|airport)\b/.test(combined)
  ) {
    const travelCat = validCategories?.find((c) => c.id.toLowerCase() === 'travel' || c.id.toLowerCase() === 'flight');
    return travelCat ? travelCat.id : 'travel';
  }
  if (
    candidate === 'stay' ||
    candidate === 'hotel' ||
    candidate === 'lodging' ||
    candidate === 'accommodation' ||
    /\b(check-in|check in|check-out|check out|hotel|resort|hostel|villa|homestay|stay)\b/.test(combined)
  ) {
    return 'stay';
  }
  if (
    candidate === 'food' ||
    candidate === 'meal' ||
    candidate === 'dining' ||
    candidate === 'restaurant' ||
    /\b(breakfast|brunch|lunch|dinner|cafe|coffee|restaurant|thali|snack|food|eat|bar|tea)\b/.test(combined)
  ) {
    return 'food';
  }
  if (
    candidate === 'buffer' ||
    candidate === 'rest' ||
    candidate === 'break' ||
    /\b(rest|relax|buffer|downtime|leisure|nap|free time|siesta|freshen up)\b/.test(combined)
  ) {
    return 'buffer';
  }
  if (candidate === 'note' || candidate === 'reminder') {
    return 'note';
  }
  return 'activity';
};

export interface ParsedICSResult {
  title: string;
  startDate: string;
  numDays: number;
  items: ItineraryItem[];
}

export const parseICSContent = (
  icsText: string,
  options?: {
    startDate?: string;
    numDays?: number;
    calendarCategories?: CalendarCategoryOption[];
  }
): ParsedICSResult => {
  if (!icsText || !icsText.includes('BEGIN:VEVENT')) {
    throw new Error('No calendar events (BEGIN:VEVENT) found in the .ics content. Please make sure you pasted or uploaded a valid .ics calendar.');
  }

  // Unfold RFC 5545 folded lines (CRLF/LF followed by single space or tab)
  const unfolded = icsText.replace(/\r?\n[ \t]/g, '');
  const rawLines = unfolded.split(/\r?\n/);

  let calendarTitle = '';
  interface RawEvent {
    summary?: string;
    dtstart?: string;
    dtend?: string;
    location?: string;
    description?: string;
    categories?: string;
  }

  const rawEvents: RawEvent[] = [];
  let current: RawEvent | null = null;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.toUpperCase() === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (trimmed.toUpperCase() === 'END:VEVENT') {
      if (current) {
        rawEvents.push(current);
        current = null;
      }
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const propFull = trimmed.slice(0, colonIdx);
    const propName = propFull.split(';')[0].toUpperCase();
    const value = trimmed.slice(colonIdx + 1);

    if (!current) {
      if (propName === 'X-WR-CALNAME') {
        calendarTitle = unescapeICSText(value);
      }
      continue;
    }

    switch (propName) {
      case 'SUMMARY':
        current.summary = unescapeICSText(value);
        break;
      case 'DTSTART':
        current.dtstart = value;
        break;
      case 'DTEND':
        current.dtend = value;
        break;
      case 'LOCATION':
        current.location = unescapeICSText(value);
        break;
      case 'DESCRIPTION':
        current.description = unescapeICSText(value);
        break;
      case 'CATEGORIES':
        current.categories = unescapeICSText(value);
        break;
      default:
        break;
    }
  }

  if (rawEvents.length === 0) {
    throw new Error('No valid events could be read from this .ics file.');
  }

  const parsedStartDates: string[] = [];
  const tempEvents = rawEvents
    .map((ev, index) => {
      if (!ev.dtstart) return null;
      const startDt = parseICSDateTime(ev.dtstart);
      if (!startDt) return null;
      parsedStartDates.push(startDt.dateStr);

      const endDt = ev.dtend ? parseICSDateTime(ev.dtend) : null;
      let startStr = startDt.timeStr;
      let endStr = endDt && endDt.dateStr === startDt.dateStr ? endDt.timeStr : addMinutesClamped(startStr, 90);

      if (startDt.isAllDay) {
        startStr = '09:00';
        endStr = '11:00';
      } else if (timeToMins(endStr) <= timeToMins(startStr)) {
        endStr = addMinutesClamped(startStr, 60);
      }

      const desc = ev.description || '';
      const descLines = desc.split('\n').map((l) => l.trim()).filter(Boolean);

      let explicitType: string | undefined;
      let cost: number | undefined;
      let travelMode: TravelMode | undefined;
      let from: string | undefined;
      let to: string | undefined;
      let confirmationNumber: string | undefined;
      let terminalOrPlatform: string | undefined;
      let providerName: string | undefined;
      const remainingNotes: string[] = [];

      for (const dl of descLines) {
        const typeMatch = dl.match(/^Type:\s*(.+)$/i);
        if (typeMatch) {
          explicitType = typeMatch[1].trim();
          continue;
        }
        const costMatch = dl.match(/^(?:Cost|Budget|Price|Est\.?\s*Cost):\s*(.+)$/i);
        if (costMatch) {
          const numeric = parseFloat(costMatch[1].replace(/[^0-9.]/g, ''));
          if (!Number.isNaN(numeric) && numeric >= 0) {
            cost = numeric;
          }
          continue;
        }
        const modeMatch = dl.match(/^Mode:\s*(.+)$/i);
        if (modeMatch) {
          travelMode = normalizeTravelMode(modeMatch[1]);
          continue;
        }
        const routeMatch = dl.match(/^Route:\s*(.+?)\s*(?:->|→|to)\s*(.+)$/i);
        if (routeMatch) {
          from = routeMatch[1].trim();
          to = routeMatch[2].trim();
          continue;
        }
        const confMatch = dl.match(/^(?:Confirmation|PNR|Booking\s*Ref):\s*(.+)$/i);
        if (confMatch) {
          confirmationNumber = confMatch[1].trim();
          continue;
        }
        const termMatch = dl.match(/^(?:Terminal|Platform|Gate|Room):\s*(.+)$/i);
        if (termMatch) {
          terminalOrPlatform = termMatch[1].trim();
          continue;
        }
        const provMatch = dl.match(/^(?:Provider|Airline|Train|Operator|Hotel):\s*(.+)$/i);
        if (provMatch) {
          providerName = provMatch[1].trim();
          continue;
        }
        const notesMatch = dl.match(/^Notes?:\s*(.+)$/i);
        if (notesMatch) {
          remainingNotes.push(notesMatch[1].trim());
          continue;
        }
        remainingNotes.push(dl);
      }

      const title = ev.summary?.trim() || `Event ${index + 1}`;
      const itemType = resolveItemType(
        explicitType,
        title,
        ev.categories,
        options?.calendarCategories
      );

      return {
        index,
        dateStr: startDt.dateStr,
        title,
        type: itemType,
        start: startStr,
        end: endStr,
        location: ev.location?.trim() || undefined,
        cost,
        notes: remainingNotes.length > 0 ? remainingNotes.join(' ') : undefined,
        travelMode,
        from,
        to,
        confirmationNumber,
        terminalOrPlatform,
        providerName,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (tempEvents.length === 0) {
    throw new Error('Could not parse any event dates from the .ics file.');
  }

  parsedStartDates.sort();
  const earliestEventDate = parsedStartDates[0];
  const baseStartDate = options?.startDate || earliestEventDate;

  // If user configured a specific startDate in Wizard, check if the AI used different dates;
  // if all events fall before baseStartDate or far away (> 30 days offset), align earliest event to Day 1.
  const firstOffset = diffDays(baseStartDate, earliestEventDate);
  const effectiveBaseDate =
    options?.startDate && (firstOffset < 0 || firstOffset > 14)
      ? earliestEventDate
      : baseStartDate;

  const items: ItineraryItem[] = tempEvents.map((ev, idx) => {
    const dayOffset = diffDays(effectiveBaseDate, ev.dateStr) + 1;
    const day = Math.max(1, dayOffset);
    const titleLower = ev.title.toLowerCase();

    return {
      id: `item-ics-${idx}-${Date.now().toString(36)}`,
      type: ev.type,
      title: ev.title,
      day,
      start: ev.start,
      end: ev.end,
      location: ev.location,
      cost: ev.cost,
      notes: ev.notes,
      travelMode: ev.travelMode,
      from: ev.from,
      to: ev.to,
      confirmationNumber: ev.confirmationNumber,
      terminalOrPlatform: ev.terminalOrPlatform,
      providerName: ev.providerName,
      isCheckIn: ev.type === 'stay' && titleLower.includes('check-in') ? true : undefined,
      isCheckOut: ev.type === 'stay' && titleLower.includes('check-out') ? true : undefined,
    };
  });

  items.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.start.localeCompare(b.start);
  });

  const maxParsedDay = items.reduce((max, it) => Math.max(max, it.day), 1);
  const numDays = Math.max(options?.numDays || 1, maxParsedDay);

  return {
    title: calendarTitle || 'Imported Itinerary',
    startDate: baseStartDate,
    numDays,
    items,
  };
};
