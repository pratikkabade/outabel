import { ItineraryItem, Trip } from '../types/trip';
import { getDayDate } from './time';

const formatGCalDate = (date: Date, timeStr: string): string => {
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

export const getGoogleCalendarUrl = (item: ItineraryItem, trip: Trip): string => {
  const itemDate = getDayDate(trip.startDate, item.day);
  const startParam = formatGCalDate(itemDate, item.start);
  const endParam = formatGCalDate(itemDate, item.end);

  const detailsList: string[] = [];
  if (item.notes) detailsList.push(item.notes);
  if (item.cost) detailsList.push(`Budget: $${item.cost}`);
  if (item.travelMode) detailsList.push(`Transit: ${item.travelMode}`);
  detailsList.push(`Trip: ${trip.title}`);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.title,
    dates: `${startParam}/${endParam}`,
    details: detailsList.join('\n\n'),
    location: item.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const openGoogleCalendar = (item: ItineraryItem, trip: Trip) => {
  const url = getGoogleCalendarUrl(item, trip);
  window.open(url, '_blank', 'noopener,noreferrer');
};
