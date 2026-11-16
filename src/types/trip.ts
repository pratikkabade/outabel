export type ItemType = 'travel' | 'stay' | 'activity' | 'food' | 'buffer' | 'note';

export type TravelMode = 'flight' | 'train' | 'car' | 'bus' | 'ferry' | 'walk' | 'rideshare';

export type MealType = 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack' | 'coffee';

export type TripPace = 'relaxed' | 'balanced' | 'packed';

export interface ItineraryItem {
  id: string;
  type: ItemType;
  title: string;
  day: number;
  start: string;
  end: string;
  location?: string;
  cost?: number;
  notes?: string;
  travelMode?: TravelMode;
  from?: string;
  to?: string;
  mealType?: MealType;
  stayName?: string;
  isCheckIn?: boolean;
  isCheckOut?: boolean;
}

export interface TripPreferences {
  preferredWakeTime: string;
  dailyStartTime: string;
  pace: TripPace;
}

export interface PackingItem {
  id: string;
  text: string;
  category: 'essentials' | 'clothing' | 'toiletries' | 'electronics' | 'documents';
  packed: boolean;
}

export interface Trip {
  id: string;
  title: string;
  from: string;
  to: string;
  startDate: string;
  numDays: number;
  preferences: TripPreferences;
  items: ItineraryItem[];
  packingList?: PackingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SmartSuggestion {
  id: string;
  label: string;
  type: ItemType;
  defaultTitle: string;
  defaultTime: string;
  defaultDurationMinutes: number;
  contextReason: string;
  metadata?: Partial<ItineraryItem>;
}

export type ViewScreen = 'home' | 'wizard' | 'planner' | 'review' | 'trips';
