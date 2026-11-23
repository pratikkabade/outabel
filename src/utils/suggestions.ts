import { SmartSuggestion, Trip } from '../types/trip';
import { timeToMinutes, addMinutesToTime } from './time';

export const generateSuggestionsForDay = (
  day: number,
  trip: Trip
): SmartSuggestion[] => {
  const suggestions: SmartSuggestion[] = [];
  const dayItems = trip.items
    .filter((item) => item.day === day)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  const isFirstDay = day === 1;
  const isLastDay = day === trip.numDays;
  const destination = trip.to || 'Destination';
  const origin = trip.from || 'Home';

  const hasBreakfast = dayItems.some(
    (item) =>
      item.type === 'food' &&
      (item.mealType === 'breakfast' ||
        item.mealType === 'coffee' ||
        timeToMinutes(item.start) < 660)
  );

  const hasLunch = dayItems.some(
    (item) =>
      item.type === 'food' &&
      (item.mealType === 'lunch' ||
        (timeToMinutes(item.start) >= 690 && timeToMinutes(item.start) <= 900))
  );

  const hasDinner = dayItems.some(
    (item) =>
      item.type === 'food' &&
      (item.mealType === 'dinner' || timeToMinutes(item.start) >= 1080)
  );

  const hasMorningActivity = dayItems.some(
    (item) => item.type === 'activity' && timeToMinutes(item.start) < 720
  );

  const hasAfternoonActivity = dayItems.some(
    (item) =>
      item.type === 'activity' &&
      timeToMinutes(item.start) >= 720 &&
      timeToMinutes(item.start) < 1080
  );

  const hasStay = dayItems.some((item) => item.type === 'stay');

  const lastArrivalTravel = dayItems
    .filter((item) => item.type === 'travel')
    .slice(-1)[0];

  // Context-aware post-arrival check-in
  if (lastArrivalTravel) {
    const afterTravelTime = addMinutesToTime(lastArrivalTravel.end, 30);
    const hasImmediateStay = dayItems.some(
      (item) =>
        item.type === 'stay' &&
        Math.abs(timeToMinutes(item.start) - timeToMinutes(lastArrivalTravel.end)) < 120
    );

    if (!hasImmediateStay) {
      suggestions.push({
        id: `sugg-checkin-${day}`,
        label: 'Hotel Check-in',
        type: 'stay',
        defaultTitle: `Check-in at ${destination} Stay`,
        defaultTime: afterTravelTime,
        defaultDurationMinutes: 45,
        contextReason: 'Drop luggage right after your transit arrival',
        metadata: {
          stayName: `${destination} Stay`,
          isCheckIn: true,
          location: destination,
        },
      });
    }
  }

  // Day 1 outbound transit if none yet
  if (isFirstDay && !lastArrivalTravel) {
    suggestions.push({
      id: `sugg-outbound-${day}`,
      label: `Transit to ${destination}`,
      type: 'travel',
      defaultTitle: `Departure: ${origin} → ${destination}`,
      defaultTime: trip.preferences.dailyStartTime || '08:30',
      defaultDurationMinutes: 180,
      contextReason: 'Outbound journey to start your trip',
      metadata: {
        travelMode: 'train',
        from: origin,
        to: destination,
        location: origin,
      },
    });
  }

  // Last day return transit
  if (isLastDay) {
    const hasDepartureTravel = dayItems.some(
      (item) => item.type === 'travel' && timeToMinutes(item.start) >= 720
    );

    if (!hasDepartureTravel) {
      suggestions.push({
        id: `sugg-return-travel-${day}`,
        label: `Return to ${origin}`,
        type: 'travel',
        defaultTitle: `Return Journey to ${origin}`,
        defaultTime: '15:00',
        defaultDurationMinutes: 180,
        contextReason: 'Final day return transit home',
        metadata: {
          travelMode: 'train',
          from: destination,
          to: origin,
          location: destination,
        },
      });
    }
  }

  // Breakfast / morning coffee
  if (!hasBreakfast) {
    suggestions.push({
      id: `sugg-breakfast-${day}`,
      label: 'Breakfast / Cafe',
      type: 'food',
      defaultTitle: `Breakfast in ${destination}`,
      defaultTime: trip.preferences.preferredWakeTime
        ? addMinutesToTime(trip.preferences.preferredWakeTime, 45)
        : '08:30',
      defaultDurationMinutes: 45,
      contextReason: 'Morning fuel before exploring',
      metadata: {
        mealType: 'breakfast',
        location: destination,
      },
    });
  }

  // Morning exploration (available even on empty days)
  if (!hasMorningActivity) {
    suggestions.push({
      id: `sugg-morning-act-${day}`,
      label: 'Morning Sightseeing',
      type: 'activity',
      defaultTitle: `Explore ${destination} Landmarks`,
      defaultTime: trip.preferences.dailyStartTime || '09:30',
      defaultDurationMinutes: trip.preferences.pace === 'packed' ? 150 : 120,
      contextReason: 'Great for cooler morning hours',
      metadata: {
        location: destination,
      },
    });
  }

  // Midday lunch
  if (!hasLunch) {
    suggestions.push({
      id: `sugg-lunch-${day}`,
      label: 'Local Lunch',
      type: 'food',
      defaultTitle: `Regional Lunch in ${destination}`,
      defaultTime: '13:00',
      defaultDurationMinutes: 60,
      contextReason: 'Midday dining break',
      metadata: {
        mealType: 'lunch',
        location: destination,
      },
    });
  }

  // Afternoon activity
  if (!hasAfternoonActivity) {
    suggestions.push({
      id: `sugg-afternoon-act-${day}`,
      label: 'Afternoon Exploration',
      type: 'activity',
      defaultTitle: `${destination} Market / Heritage Walk`,
      defaultTime: '15:00',
      defaultDurationMinutes: 120,
      contextReason: 'Afternoon sightseeing or cultural stop',
      metadata: {
        location: destination,
      },
    });
  }

  // Long activity recovery or general rest buffer
  const longActivity = dayItems.find((item) => {
    if (item.type !== 'activity') return false;
    return timeToMinutes(item.end) - timeToMinutes(item.start) >= 180;
  });

  suggestions.push({
    id: longActivity ? `sugg-buffer-${longActivity.id}` : `sugg-buffer-${day}`,
    label: 'Rest & Tea Buffer',
    type: 'buffer',
    defaultTitle: 'Rest & Refreshment Break',
    defaultTime: longActivity ? addMinutesToTime(longActivity.end, 15) : '17:00',
    defaultDurationMinutes: 45,
    contextReason: longActivity
      ? `Unwind after ${longActivity.title}`
      : 'Breathing room between daytime and evening plans',
    metadata: {
      notes: 'Casual downtime or café stop',
    },
  });

  // Evening dinner
  if (!hasDinner) {
    suggestions.push({
      id: `sugg-dinner-${day}`,
      label: 'Evening Dinner',
      type: 'food',
      defaultTitle: `Dinner in ${destination}`,
      defaultTime: '19:30',
      defaultDurationMinutes: 90,
      contextReason: 'Evening dining window',
      metadata: {
        mealType: 'dinner',
        location: destination,
      },
    });
  }

  // Overnight stay
  if (!hasStay && !isLastDay) {
    suggestions.push({
      id: `sugg-stay-night-${day}`,
      label: 'Overnight Stay',
      type: 'stay',
      defaultTitle: `Overnight at ${destination} Hotel`,
      defaultTime: '21:30',
      defaultDurationMinutes: 60,
      contextReason: 'Accommodations for tonight',
      metadata: {
        stayName: `${destination} Hotel`,
        location: destination,
      },
    });
  }

  // Local transit / cab block always handy
  suggestions.push({
    id: `sugg-local-transit-${day}`,
    label: 'Local Commute',
    type: 'travel',
    defaultTitle: `Local Transfer in ${destination}`,
    defaultTime: '14:15',
    defaultDurationMinutes: 45,
    contextReason: 'Commute between stops',
    metadata: {
      travelMode: 'rideshare',
      from: destination,
      to: destination,
      location: destination,
    },
  });

  return suggestions.slice(0, 6);
};
