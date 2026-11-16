import { Trip } from '../types/trip';

export const encodeTripToHash = (trip: Trip): string => {
  try {
    const compactTrip = {
      ...trip,
      updatedAt: undefined,
    };
    const json = JSON.stringify(compactTrip);
    const encoded = btoa(encodeURIComponent(json));
    return `#trip=${encoded}`;
  } catch {
    return '';
  }
};

export const decodeTripFromHash = (): Trip | null => {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#trip=')) return null;
    const base64 = hash.slice('#trip='.length);
    const json = decodeURIComponent(atob(base64));
    const trip = JSON.parse(json);
    if (trip && trip.id && trip.title) {
      return trip as Trip;
    }
  } catch {
    return null;
  }
  return null;
};

export const copyShareableUrl = async (trip: Trip): Promise<boolean> => {
  try {
    const hash = encodeTripToHash(trip);
    const fullUrl = `${window.location.origin}${window.location.pathname}${hash}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(fullUrl);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const triggerPrint = () => {
  window.print();
};
