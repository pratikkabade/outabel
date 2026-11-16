import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plane, 
  Hotel, 
  Camera, 
  UtensilsCrossed, 
  Coffee, 
  FileText
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { ItemType, TravelMode, MealType, ItineraryItem } from '../types/trip';
import { addMinutesToTime, getDurationMinutes } from '../utils/time';
import { CURRENCIES } from '../utils/currency';

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1 hour 30 min (Default)' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 300, label: '5 hours' },
  { value: 420, label: '7 hours' },
  { value: 480, label: '8 hours (Full Day)' },
];

export const AddItemModal: React.FC = () => {
  const { 
    isAddModalOpen, 
    closeAddModal, 
    activeDay, 
    modalPreset, 
    editingItem, 
    addItem, 
    updateItem, 
    currentTrip,
    currency 
  } = useTrip();

  const [type, setType] = useState<ItemType>('activity');
  const [title, setTitle] = useState<string>('');
  const [day, setDay] = useState<number>(activeDay);
  const [start, setStart] = useState<string>('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [location, setLocation] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [travelMode, setTravelMode] = useState<TravelMode>('flight');
  const [fromLoc, setFromLoc] = useState<string>('');
  const [toLoc, setToLoc] = useState<string>('');

  const [stayName, setStayName] = useState<string>('');
  const [isCheckIn, setIsCheckIn] = useState<boolean>(true);
  const [isCheckOut, setIsCheckOut] = useState<boolean>(false);

  const [mealType, setMealType] = useState<MealType>('lunch');

  const currencySymbol = CURRENCIES[currency]?.symbol || '$';

  useEffect(() => {
    if (!isAddModalOpen) return;

    if (editingItem) {
      setType(editingItem.type);
      setTitle(editingItem.title);
      setDay(editingItem.day);
      setStart(editingItem.start);
      const computedDuration = getDurationMinutes(editingItem.start, editingItem.end);
      setDurationMinutes(computedDuration > 0 ? computedDuration : 90);
      setLocation(editingItem.location || '');
      setCost(editingItem.cost ? editingItem.cost.toString() : '');
      setNotes(editingItem.notes || '');
      setTravelMode(editingItem.travelMode || 'flight');
      setFromLoc(editingItem.from || '');
      setToLoc(editingItem.to || '');
      setStayName(editingItem.stayName || '');
      setIsCheckIn(editingItem.isCheckIn ?? true);
      setIsCheckOut(editingItem.isCheckOut ?? false);
      setMealType(editingItem.mealType || 'lunch');
    } else {
      const presetDay = modalPreset?.day ?? activeDay;
      setDay(presetDay);
      setType(modalPreset?.type ?? 'activity');
      setTitle(modalPreset?.title ?? '');
      
      const defaultStart = modalPreset?.start || (currentTrip?.preferences.dailyStartTime ?? '10:00');
      setStart(defaultStart);

      if (modalPreset?.start && modalPreset?.end) {
        const dur = getDurationMinutes(modalPreset.start, modalPreset.end);
        setDurationMinutes(dur > 0 ? dur : 90);
      } else {
        setDurationMinutes(90);
      }

      setLocation(modalPreset?.location || '');
      setCost(modalPreset?.cost ? modalPreset.cost.toString() : '');
      setNotes(modalPreset?.notes || '');
      setTravelMode(modalPreset?.travelMode || 'flight');
      setFromLoc(modalPreset?.from || (currentTrip?.from || ''));
      setToLoc(modalPreset?.to || (currentTrip?.to || ''));
      setStayName(modalPreset?.stayName || '');
      setIsCheckIn(modalPreset?.isCheckIn ?? true);
      setIsCheckOut(modalPreset?.isCheckOut ?? false);
      setMealType(modalPreset?.mealType || 'lunch');
    }
  }, [isAddModalOpen, modalPreset, editingItem, activeDay, currentTrip]);

  if (!isAddModalOpen) return null;

  const calculatedEnd = addMinutesToTime(start, durationMinutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || getDefaultTitleForType(type);

    const payload: Omit<ItineraryItem, 'id'> = {
      type,
      title: finalTitle,
      day,
      start,
      end: calculatedEnd,
      location: location.trim() || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      notes: notes.trim() || undefined,
      travelMode: type === 'travel' ? travelMode : undefined,
      from: type === 'travel' ? fromLoc.trim() : undefined,
      to: type === 'travel' ? toLoc.trim() : undefined,
      stayName: type === 'stay' ? stayName.trim() : undefined,
      isCheckIn: type === 'stay' ? isCheckIn : undefined,
      isCheckOut: type === 'stay' ? isCheckOut : undefined,
      mealType: type === 'food' ? mealType : undefined,
    };

    if (editingItem) {
      updateItem({ ...payload, id: editingItem.id });
    } else {
      addItem(payload);
    }
    closeAddModal();
  };

  const getDefaultTitleForType = (t: ItemType): string => {
    switch (t) {
      case 'travel': return `${travelMode.toUpperCase()} Transit`;
      case 'stay': return stayName ? `Stay: ${stayName}` : 'Accommodations';
      case 'food': return `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Break`;
      case 'buffer': return 'Downtime & Rest';
      case 'note': return 'Itinerary Note';
      default: return 'Planned Activity';
    }
  };

  const fieldControlStyle = {
    height: '42px',
    boxSizing: 'border-box' as const,
  };

  return (
    <div className="modal-backdrop p-3 sm:p-4" onClick={closeAddModal}>
      <div 
        className="glass-card w-full max-w-lg h-[90vh] sm:h-[84vh] max-h-[740px] flex flex-col relative border border-white/80 dark:border-white/15 overflow-hidden shadow-2xl p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-black/10 dark:border-white/10 shrink-0 bg-white/70 dark:bg-[#161a22]/80 backdrop-blur-md">
          <div>
            <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
              {editingItem ? 'Edit Item' : 'Add Item to Schedule'}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Day {day} Itinerary
            </div>
          </div>
          <button
            type="button"
            onClick={closeAddModal}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 day-items-scroll">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                Category
              </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'activity' as ItemType, label: 'Activity', icon: Camera, color: 'text-emerald-500' },
                { id: 'travel' as ItemType, label: 'Travel', icon: Plane, color: 'text-blue-500' },
                { id: 'stay' as ItemType, label: 'Stay', icon: Hotel, color: 'text-indigo-500' },
                { id: 'food' as ItemType, label: 'Food', icon: UtensilsCrossed, color: 'text-amber-500' },
                { id: 'buffer' as ItemType, label: 'Buffer', icon: Coffee, color: 'text-purple-500' },
                { id: 'note' as ItemType, label: 'Note', icon: FileText, color: 'text-neutral-500' },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = type === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setType(cat.id);
                      if (!title || title.includes('Transit') || title.includes('Stay') || title.includes('Break')) {
                        setTitle(getDefaultTitleForType(cat.id));
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                        : 'bg-white/70 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-blue-400'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : cat.color}`} />
                    <span className="truncate w-full text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Meiji Shrine Morning Walk, Express Train, or Omakase Dinner"
              style={fieldControlStyle}
              className="input text-sm"
            />
          </div>

          {type === 'travel' && (
            <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Mode:</span>
                <select
                  value={travelMode}
                  onChange={(e) => setTravelMode(e.target.value as TravelMode)}
                  className="input text-xs py-1.5 px-2.5 w-auto cursor-pointer"
                >
                  <option value="flight">Flight</option>
                  <option value="train">Train / Metro</option>
                  <option value="car">Car / Drive</option>
                  <option value="rideshare">Taxi / Rideshare</option>
                  <option value="bus">Bus</option>
                  <option value="ferry">Ferry</option>
                  <option value="walk">Walk</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={fromLoc}
                  onChange={(e) => setFromLoc(e.target.value)}
                  placeholder="From (Origin)"
                  className="input text-xs"
                />
                <input
                  type="text"
                  value={toLoc}
                  onChange={(e) => setToLoc(e.target.value)}
                  placeholder="To (Destination)"
                  className="input text-xs"
                />
              </div>
            </div>
          )}

          {type === 'stay' && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-3">
              <input
                type="text"
                value={stayName}
                onChange={(e) => setStayName(e.target.value)}
                placeholder="Hotel / Accommodations Name"
                className="input text-xs"
              />
              <div className="flex items-center gap-4 text-xs text-neutral-700 dark:text-neutral-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCheckIn}
                    onChange={(e) => setIsCheckIn(e.target.checked)}
                    className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                  />
                  <span>Check-In</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCheckOut}
                    onChange={(e) => setIsCheckOut(e.target.checked)}
                    className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                  />
                  <span>Check-Out</span>
                </label>
              </div>
            </div>
          )}

          {type === 'food' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Meal:</span>
              <div className="flex flex-wrap gap-1.5">
                {(['breakfast', 'brunch', 'lunch', 'dinner', 'snack', 'coffee'] as MealType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMealType(m)}
                    className={`px-2.5 py-1 rounded-lg capitalize border cursor-pointer ${
                      mealType === m
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white/70 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={fieldControlStyle}
                className="input text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                style={fieldControlStyle}
                className="input text-sm cursor-pointer"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-right text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            Scheduled: {start} – {calculatedEnd}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ginza, Tokyo"
                style={fieldControlStyle}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Estimated Cost ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                style={fieldControlStyle}
                className="input text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Notes & Booking Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Confirmation number, entry tickets, right-hand window seat"
              className="input text-sm py-2 px-3 resize-none h-20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3 border-t border-black/10 dark:border-white/10 shrink-0 bg-white/70 dark:bg-[#161a22]/80 backdrop-blur-md">
            <button
              type="button"
              onClick={closeAddModal}
              className="btn-ghost text-xs py-2 px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-5 cursor-pointer shadow-xs"
            >
              {editingItem ? 'Save Changes' : 'Add to Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
