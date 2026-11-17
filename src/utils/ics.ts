import { ItineraryItem, Trip } from '../types/trip';
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
    if (item.cost) descriptionParts.push(`Cost: $${item.cost}`);
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
      lines.push(`DESCRIPTION:${escapeICSText(descriptionParts.join('\\n'))}`);
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
