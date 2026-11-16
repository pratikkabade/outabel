import { ItineraryItem, SmartSuggestion, Trip } from '../types/trip';
import { timeToMinutes, addMinutesToTime } from './time';

export const generateSuggestionsForDay = (
  day: number,
  trip: Trip
): SmartSuggestion[] => {
  const suggestions: SmartSuggestion[] = [];
  const dayItems = trip.items
    .filter((item) => item.day === day)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  const isLastDay = day === trip.numDays;
  const isFirstDay = day === 1;

  const hasLunch = dayItems.some(
    (item) => item.type === 'food' && (item.mealType === 'lunch' || (timeToMinutes(item.start) >= 690 && timeToMinutes(item.start) <= 870))
  );

  const hasDinner = dayItems.some(
    (item) => item.type === 'food' && (item.mealType === 'dinner' || timeToMinutes(item.start) >= 1080)
  );

  const hasMorningActivity = dayItems.some(
    (item) => item.type === 'activity' && timeToMinutes(item.start) < 720
  );

  const hasStay = dayItems.some((item) => item.type === 'stay');

  const lastArrivalTravel = dayItems
    .filter((item) => item.type === 'travel')
    .slice(-1)[0];

  if (lastArrivalTravel) {
    const afterTravelTime = addMinutesToTime(lastArrivalTravel.end, 30);
    const hasImmediateStay = dayItems.some(
      (item) => item.type === 'stay' && Math.abs(timeToMinutes(item.start) - timeToMinutes(lastArrivalTravel.end)) < 120
    );

    if (!hasImmediateStay) {
      suggestions.push({
        id: `sugg-checkin-${day}`,
        label: 'Drop Luggage / Hotel Check-in',
        type: 'stay',
        defaultTitle: 'Hotel Check-in & Luggage Drop',
        defaultTime: afterTravelTime,
        defaultDurationMinutes: 45,
        contextReason: 'Convenient right after your transit arrival',
        metadata: {
          stayName: 'Accommodations',
          isCheckIn: true,
          location: trip.to,
        },
      });
    }
  }

  if (!hasMorningActivity && dayItems.length > 0) {
    const defaultMorning = trip.preferences.dailyStartTime || '09:30';
    suggestions.push({
      id: `sugg-morning-act-${day}`,
      label: 'Morning Sightseeing / Walk',
      type: 'activity',
      defaultTitle: 'Morning Exploration & Landmarks',
      defaultTime: defaultMorning,
      defaultDurationMinutes: 120,
      contextReason: 'Great for fresh morning energy before noon',
      metadata: {
        location: trip.to,
      },
    });
  }

  if (!hasLunch) {
    const lunchTime = '12:30';
    suggestions.push({
      id: `sugg-lunch-${day}`,
      label: 'Local Lunch Pause',
      type: 'food',
      defaultTitle: 'Lunch at Local Bistro',
      defaultTime: lunchTime,
      defaultDurationMinutes: 60,
      contextReason: 'Midday refueling window (12:00 – 14:00)',
      metadata: {
        mealType: 'lunch',
        cost: 25,
      },
    });
  }

  const longActivity = dayItems.find((item) => {
    if (item.type !== 'activity') return false;
    const dur = timeToMinutes(item.end) - timeToMinutes(item.start);
    return dur >= 180;
  });

  if (longActivity) {
    const bufferStart = addMinutesToTime(longActivity.end, 15);
    suggestions.push({
      id: `sugg-buffer-${longActivity.id}`,
      label: 'Rest Buffer & Tea Break',
      type: 'buffer',
      defaultTitle: 'Rest & Coffee Recharge',
      defaultTime: bufferStart,
      defaultDurationMinutes: 45,
      contextReason: `Unwind after ${longActivity.title} (>3 hrs)`,
      metadata: {
        notes: 'Casual downtime or café relaxation',
      },
    });
  }

  if (!hasDinner && dayItems.length > 0) {
    const dinnerTime = '19:00';
    suggestions.push({
      id: `sugg-dinner-${day}`,
      label: 'Evening Dinner & Drinks',
      type: 'food',
      defaultTitle: 'Regional Dinner Experience',
      defaultTime: dinnerTime,
      defaultDurationMinutes: 90,
      contextReason: 'Evening dining slot (19:00 – 21:00)',
      metadata: {
        mealType: 'dinner',
        cost: 40,
      },
    });
  }

  if (!hasStay && !isLastDay) {
    suggestions.push({
      id: `sugg-stay-night-${day}`,
      label: 'Accommodations / Stay',
      type: 'stay',
      defaultTitle: 'Evening Stay',
      defaultTime: '21:30',
      defaultDurationMinutes: 60,
      contextReason: 'No hotel or lodging recorded for tonight',
      metadata: {
        stayName: 'Hotel / Airbnb',
      },
    });
  }

  if (isLastDay) {
    const hasDepartureTravel = dayItems.some(
      (item) => item.type === 'travel' && timeToMinutes(item.start) >= 720
    );

    if (!hasDepartureTravel) {
      suggestions.push({
        id: `sugg-return-travel-${day}`,
        label: 'Return Travel Home',
        type: 'travel',
        defaultTitle: `Return Departure to ${trip.from || 'Home'}`,
        defaultTime: '15:00',
        defaultDurationMinutes: 180,
        contextReason: 'Final day return flight, train, or drive',
        metadata: {
          travelMode: 'flight',
          from: trip.to,
          to: trip.from || 'Home',
        },
      });
    }
  }

  return suggestions.slice(0, 4);
};
