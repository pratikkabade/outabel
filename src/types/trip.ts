export type ItemType = string;

export type TravelMode = 'flight' | 'train' | 'car' | 'bus' | 'ferry' | 'walk' | 'rideshare';

export type MealType = 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack' | 'coffee';

export type TripPace = 'relaxed' | 'balanced' | 'packed';

export interface ItemAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  addedAt: string;
}

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
  confirmationNumber?: string;
  terminalOrPlatform?: string;
  providerName?: string;
  attachments?: ItemAttachment[];
}

export interface TripPreferences {
  preferredWakeTime: string;
  dailyStartTime: string;
  pace: TripPace;
  budget?: number;
}

export type CategoryColor =
  | 'blue'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'sky'
  | 'slate';

export type PackingCategoryColor = CategoryColor;

export type CalendarCategoryIcon =
  | 'plane'
  | 'hotel'
  | 'utensils'
  | 'camera'
  | 'coffee'
  | 'file'
  | 'tag';

export interface CalendarCategoryOption {
  id: string;
  label: string;
  color: CategoryColor;
  icon?: CalendarCategoryIcon;
}

export interface PackingCategoryOption {
  id: string;
  label: string;
  color: CategoryColor;
}

export interface PackingItem {
  id: string;
  text: string;
  category: string;
  packed: boolean;
}

export interface Trip {
  id: string;
  title: string;
  from: string;
  to: string;
  startDate: string;
  numDays: number;
  budget?: number;
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

export type ViewScreen = 'home' | 'wizard' | 'planner' | 'review' | 'trips' | 'settings';
