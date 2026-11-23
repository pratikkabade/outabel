import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  Upload,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Ticket,
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import {
  ItemType,
  TravelMode,
  MealType,
  ItineraryItem,
  ItemAttachment,
} from '../types/trip';
import { addMinutesToTime, getDurationMinutes, formatDuration } from '../utils/time';
import { CURRENCIES } from '../utils/currency';
import {
  CALENDAR_COLOR_STYLES,
  getCalendarCategoryIcon,
  resolveCalendarCategory,
} from '../utils/calendarCategories';
import { AnimatedModal } from './AnimatedModal';

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

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024; // 2 MB per file for localStorage safety
const MAX_ATTACHMENTS_PER_ITEM = 5;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getTravelModeFieldConfig = (mode: TravelMode) => {
  switch (mode) {
    case 'flight':
      return {
        providerLabel: 'Airline & Flight #',
        providerPlaceholder: 'e.g. IndiGo 6E-204',
        terminalLabel: 'Terminal & Gate',
        terminalPlaceholder: 'e.g. T2 · Gate 14B',
        confirmationLabel: 'PNR / Booking Ref',
        confirmationPlaceholder: 'e.g. X7K9P2',
      };
    case 'train':
      return {
        providerLabel: 'Train Name / #',
        providerPlaceholder: 'e.g. 12051 Jan Shatabdi',
        terminalLabel: 'Platform & Coach / Seat',
        terminalPlaceholder: 'e.g. PF 4 · C3 / 42',
        confirmationLabel: 'PNR Number',
        confirmationPlaceholder: 'e.g. 841-2930411',
      };
    case 'bus':
      return {
        providerLabel: 'Bus Operator',
        providerPlaceholder: 'e.g. VRL Travels Volvo',
        terminalLabel: 'Boarding Point / Bay',
        terminalPlaceholder: 'e.g. Bay 12 · Majorda',
        confirmationLabel: 'Ticket / Booking Ref',
        confirmationPlaceholder: 'e.g. RB-994120',
      };
    case 'ferry':
      return {
        providerLabel: 'Ferry / Vessel',
        providerPlaceholder: 'e.g. M2M Ro-Pax Ferry',
        terminalLabel: 'Jetty / Pier',
        terminalPlaceholder: 'e.g. Ferry Wharf Pier 2',
        confirmationLabel: 'Ticket / Booking Ref',
        confirmationPlaceholder: 'e.g. FR-55210',
      };
    default:
      return {
        providerLabel: 'Rental / Cab Provider',
        providerPlaceholder: 'e.g. Uber Intercity / Zoomcar',
        terminalLabel: 'Pickup Point / Zone',
        terminalPlaceholder: 'e.g. Arrivals Pillar 4',
        confirmationLabel: 'Booking / Trip Ref',
        confirmationPlaceholder: 'e.g. TRP-4820',
      };
  }
};

interface FormSnapshotInput {
  type: ItemType;
  title: string;
  day: number;
  start: string;
  durationMinutes: number;
  location: string;
  cost: string;
  notes: string;
  travelMode: TravelMode;
  fromLoc: string;
  toLoc: string;
  stayName: string;
  isCheckIn: boolean;
  isCheckOut: boolean;
  mealType: MealType;
  confirmationNumber: string;
  terminalOrPlatform: string;
  providerName: string;
  attachments: ItemAttachment[];
}

const buildFormSnapshot = (state: FormSnapshotInput): string =>
  JSON.stringify({
    ...state,
    attachments: state.attachments.map((a) => ({
      id: a.id,
      name: a.name,
      size: a.size,
      addedAt: a.addedAt,
    })),
  });

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
    calendarCategories,
    currency,
    showToast,
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
  const [confirmationNumber, setConfirmationNumber] = useState<string>('');
  const [terminalOrPlatform, setTerminalOrPlatform] = useState<string>('');
  const [providerName, setProviderName] = useState<string>('');
  const [attachments, setAttachments] = useState<ItemAttachment[]>([]);

  const [isEditSession, setIsEditSession] = useState<boolean>(false);
  const [copiedConfirmation, setCopiedConfirmation] = useState<boolean>(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ItemAttachment | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  const initialSnapshotRef = useRef<string>('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currencySymbol = CURRENCIES[currency]?.symbol || '$';

  useEffect(() => {
    if (!isAddModalOpen) return;
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus({ preventScroll: true });
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    if (!isAddModalOpen) return;

    setShowDiscardConfirm(false);
    setPreviewAttachment(null);
    setAttachmentError(null);
    setCopiedConfirmation(false);

    if (editingItem) {
      const computedDuration = getDurationMinutes(editingItem.start, editingItem.end);
      const initDuration = computedDuration > 0 ? computedDuration : 90;
      const initCost = editingItem.cost ? editingItem.cost.toString() : '';
      const initLocation = editingItem.location || '';
      const initNotes = editingItem.notes || '';
      const initTravelMode = editingItem.travelMode || 'flight';
      const initFrom = editingItem.from || '';
      const initTo = editingItem.to || '';
      const initStayName = editingItem.stayName || '';
      const initCheckIn = editingItem.isCheckIn ?? true;
      const initCheckOut = editingItem.isCheckOut ?? false;
      const initMealType = editingItem.mealType || 'lunch';
      const initConf = editingItem.confirmationNumber || '';
      const initTerminal = editingItem.terminalOrPlatform || '';
      const initProvider = editingItem.providerName || '';
      const initAttachments = editingItem.attachments ? [...editingItem.attachments] : [];

      setIsEditSession(true);
      setType(editingItem.type);
      setTitle(editingItem.title);
      setDay(editingItem.day);
      setStart(editingItem.start);
      setDurationMinutes(initDuration);
      setLocation(initLocation);
      setCost(initCost);
      setNotes(initNotes);
      setTravelMode(initTravelMode);
      setFromLoc(initFrom);
      setToLoc(initTo);
      setStayName(initStayName);
      setIsCheckIn(initCheckIn);
      setIsCheckOut(initCheckOut);
      setMealType(initMealType);
      setConfirmationNumber(initConf);
      setTerminalOrPlatform(initTerminal);
      setProviderName(initProvider);
      setAttachments(initAttachments);

      initialSnapshotRef.current = buildFormSnapshot({
        type: editingItem.type,
        title: editingItem.title,
        day: editingItem.day,
        start: editingItem.start,
        durationMinutes: initDuration,
        location: initLocation,
        cost: initCost,
        notes: initNotes,
        travelMode: initTravelMode,
        fromLoc: initFrom,
        toLoc: initTo,
        stayName: initStayName,
        isCheckIn: initCheckIn,
        isCheckOut: initCheckOut,
        mealType: initMealType,
        confirmationNumber: initConf,
        terminalOrPlatform: initTerminal,
        providerName: initProvider,
        attachments: initAttachments,
      });
    } else {
      const presetDay = modalPreset?.day ?? activeDay;
      const initType = modalPreset?.type ?? 'activity';
      const initTitle = modalPreset?.title ?? '';
      const defaultStart = modalPreset?.start || (currentTrip?.preferences.dailyStartTime ?? '10:00');
      const initDuration =
        modalPreset?.start && modalPreset?.end
          ? (() => {
              const dur = getDurationMinutes(modalPreset.start, modalPreset.end);
              return dur > 0 ? dur : 90;
            })()
          : 90;
      const initLocation = modalPreset?.location || '';
      const initCost = modalPreset?.cost ? modalPreset.cost.toString() : '';
      const initNotes = modalPreset?.notes || '';
      const initTravelMode = modalPreset?.travelMode || 'flight';
      const initFrom = modalPreset?.from || (currentTrip?.from || '');
      const initTo = modalPreset?.to || (currentTrip?.to || '');
      const initStayName = modalPreset?.stayName || '';
      const initCheckIn = modalPreset?.isCheckIn ?? true;
      const initCheckOut = modalPreset?.isCheckOut ?? false;
      const initMealType = modalPreset?.mealType || 'lunch';
      const initConf = modalPreset?.confirmationNumber || '';
      const initTerminal = modalPreset?.terminalOrPlatform || '';
      const initProvider = modalPreset?.providerName || '';
      const initAttachments = modalPreset?.attachments ? [...modalPreset.attachments] : [];

      setIsEditSession(false);
      setDay(presetDay);
      setType(initType);
      setTitle(initTitle);
      setStart(defaultStart);
      setDurationMinutes(initDuration);
      setLocation(initLocation);
      setCost(initCost);
      setNotes(initNotes);
      setTravelMode(initTravelMode);
      setFromLoc(initFrom);
      setToLoc(initTo);
      setStayName(initStayName);
      setIsCheckIn(initCheckIn);
      setIsCheckOut(initCheckOut);
      setMealType(initMealType);
      setConfirmationNumber(initConf);
      setTerminalOrPlatform(initTerminal);
      setProviderName(initProvider);
      setAttachments(initAttachments);

      initialSnapshotRef.current = buildFormSnapshot({
        type: initType,
        title: initTitle,
        day: presetDay,
        start: defaultStart,
        durationMinutes: initDuration,
        location: initLocation,
        cost: initCost,
        notes: initNotes,
        travelMode: initTravelMode,
        fromLoc: initFrom,
        toLoc: initTo,
        stayName: initStayName,
        isCheckIn: initCheckIn,
        isCheckOut: initCheckOut,
        mealType: initMealType,
        confirmationNumber: initConf,
        terminalOrPlatform: initTerminal,
        providerName: initProvider,
        attachments: initAttachments,
      });
    }
  }, [isAddModalOpen, modalPreset, editingItem, activeDay, currentTrip]);

  const currentSnapshot = useMemo(
    () =>
      buildFormSnapshot({
        type,
        title,
        day,
        start,
        durationMinutes,
        location,
        cost,
        notes,
        travelMode,
        fromLoc,
        toLoc,
        stayName,
        isCheckIn,
        isCheckOut,
        mealType,
        confirmationNumber,
        terminalOrPlatform,
        providerName,
        attachments,
      }),
    [
      type,
      title,
      day,
      start,
      durationMinutes,
      location,
      cost,
      notes,
      travelMode,
      fromLoc,
      toLoc,
      stayName,
      isCheckIn,
      isCheckOut,
      mealType,
      confirmationNumber,
      terminalOrPlatform,
      providerName,
      attachments,
    ]
  );

  const isDirty = isAddModalOpen && currentSnapshot !== initialSnapshotRef.current;

  const requestClose = () => {
    if (previewAttachment) {
      setPreviewAttachment(null);
      return;
    }
    if (showDiscardConfirm) {
      setShowDiscardConfirm(false);
      return;
    }
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    closeAddModal();
  };

  const matchedCategoryIcon = calendarCategories.find(
    (c) => c.id.toLowerCase() === type.toLowerCase()
  )?.icon;
  const needsBookingDocs =
    type === 'travel' ||
    type === 'stay' ||
    matchedCategoryIcon === 'plane' ||
    matchedCategoryIcon === 'hotel' ||
    attachments.length > 0;

  const calculatedEnd = addMinutesToTime(start, durationMinutes);
  const travelFields = getTravelModeFieldConfig(travelMode);

  const handleCopyConfirmation = async () => {
    const val = confirmationNumber.trim();
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      setCopiedConfirmation(true);
      showToast(`Copied confirmation "${val}"`);
      setTimeout(() => setCopiedConfirmation(false), 1800);
    } catch {
      showToast('Unable to copy automatically — select text to copy');
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setAttachmentError(null);
    const files = Array.from(fileList);

    if (attachments.length + files.length > MAX_ATTACHMENTS_PER_ITEM) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS_PER_ITEM} files per event.`);
      e.target.value = '';
      return;
    }

    const readFileAsDataUrl = (file: File): Promise<ItemAttachment> =>
      new Promise((resolve, reject) => {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          reject(new Error(`"${file.name}" exceeds the 2 MB file size limit.`));
          return;
        }
        const isAllowed =
          file.type === 'application/pdf' ||
          file.type.startsWith('image/') ||
          file.name.toLowerCase().endsWith('.pdf');
        if (!isAllowed) {
          reject(new Error(`"${file.name}" must be a PDF or image file.`));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve({
              id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              mimeType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png'),
              size: file.size,
              dataUrl: reader.result,
              addedAt: new Date().toISOString(),
            });
          } else {
            reject(new Error(`Failed to read "${file.name}".`));
          }
        };
        reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
        reader.readAsDataURL(file);
      });

    try {
      const nextAttachments = await Promise.all(files.map(readFileAsDataUrl));
      setAttachments((prev) => [...prev, ...nextAttachments]);
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : 'Unable to attach file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    if (previewAttachment?.id === id) {
      setPreviewAttachment(null);
    }
  };

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
      from: type === 'travel' ? fromLoc.trim() || undefined : undefined,
      to: type === 'travel' ? toLoc.trim() || undefined : undefined,
      stayName: type === 'stay' ? stayName.trim() || undefined : undefined,
      isCheckIn: type === 'stay' ? isCheckIn : undefined,
      isCheckOut: type === 'stay' ? isCheckOut : undefined,
      mealType: type === 'food' ? mealType : undefined,
      confirmationNumber: needsBookingDocs ? confirmationNumber.trim() || undefined : undefined,
      terminalOrPlatform: needsBookingDocs ? terminalOrPlatform.trim() || undefined : undefined,
      providerName: needsBookingDocs ? providerName.trim() || undefined : undefined,
      attachments: needsBookingDocs && attachments.length > 0 ? attachments : undefined,
    };

    if (editingItem) {
      updateItem({ ...payload, id: editingItem.id });
    } else {
      addItem(payload);
    }
    setShowDiscardConfirm(false);
    closeAddModal();
  };

  const getDefaultTitleForType = (t: ItemType): string => {
    switch (t) {
      case 'travel': return `${travelMode.toUpperCase()} Transit`;
      case 'stay': return stayName ? `Stay: ${stayName}` : 'Accommodations';
      case 'food': return `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Break`;
      case 'buffer': return 'Downtime & Rest';
      case 'note': return 'Itinerary Note';
      case 'activity': return 'Planned Activity';
      default: {
        const resolved = resolveCalendarCategory(t, calendarCategories);
        return resolved.label ? `${resolved.label} Item` : 'Planned Activity';
      }
    }
  };

  const fieldControlStyle = {
    height: '42px',
    boxSizing: 'border-box' as const,
  };

  const trimmedLocation = location.trim();

  return (
    <AnimatedModal
      isOpen={isAddModalOpen}
      onClose={requestClose}
      backdropClassName="p-3 sm:p-4"
      panelClassName="glass-card w-full max-w-lg h-[90vh] sm:h-[84vh] max-h-[760px] flex flex-col relative border border-white/80 dark:border-white/15 overflow-hidden shadow-2xl p-0"
    >
      <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-black/10 dark:border-white/10 shrink-0 bg-white dark:bg-[#161a22]">
        <div>
          <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
            {isEditSession ? 'Edit Item' : 'Add Item to Schedule'}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Day {day} Itinerary
          </div>
        </div>
        <button
          type="button"
          onClick={requestClose}
          aria-label="Close modal"
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
              {calendarCategories.map((cat) => {
                const Icon = getCalendarCategoryIcon(cat.icon);
                const catStyle = CALENDAR_COLOR_STYLES[cat.color] || CALENDAR_COLOR_STYLES.slate;
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
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? catStyle.selectedModal
                        : 'bg-white/70 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/25'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${catStyle.iconText}`} />
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
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sindhudurg Fort Visit, Ghat Drive, or Malvani Fish Thali"
              style={fieldControlStyle}
              className="input text-sm"
            />
          </div>

          {type === 'travel' && (
            <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                {confirmationNumber.trim() && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300">
                    <Ticket className="w-3 h-3" />
                    <span>{confirmationNumber.trim()}</span>
                  </span>
                )}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-blue-500/15">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    {travelFields.providerLabel}
                  </label>
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder={travelFields.providerPlaceholder}
                    className="input text-xs py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    {travelFields.terminalLabel}
                  </label>
                  <input
                    type="text"
                    value={terminalOrPlatform}
                    onChange={(e) => setTerminalOrPlatform(e.target.value)}
                    placeholder={travelFields.terminalPlaceholder}
                    className="input text-xs py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                  {travelFields.confirmationLabel}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={confirmationNumber}
                    onChange={(e) => setConfirmationNumber(e.target.value)}
                    placeholder={travelFields.confirmationPlaceholder}
                    className="input text-xs py-1.5 font-mono uppercase tracking-wide flex-1"
                  />
                  {confirmationNumber.trim() && (
                    <button
                      type="button"
                      onClick={handleCopyConfirmation}
                      title="Copy confirmation code"
                      className="px-2.5 py-1.5 rounded-lg border border-blue-500/25 bg-white dark:bg-neutral-900 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      {copiedConfirmation ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedConfirmation ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
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
              <div className="flex items-center justify-between flex-wrap gap-2">
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
                {confirmationNumber.trim() && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-indigo-700 dark:text-indigo-300">
                    <Ticket className="w-3 h-3" />
                    <span>{confirmationNumber.trim()}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-indigo-500/15">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Booking Platform / Host
                  </label>
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="e.g. Booking.com / Direct"
                    className="input text-xs py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Room Type / Floor
                  </label>
                  <input
                    type="text"
                    value={terminalOrPlatform}
                    onChange={(e) => setTerminalOrPlatform(e.target.value)}
                    placeholder="e.g. Deluxe Suite · Rm 304"
                    className="input text-xs py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                  Confirmation / Reservation #
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={confirmationNumber}
                    onChange={(e) => setConfirmationNumber(e.target.value)}
                    placeholder="e.g. HTL-928341"
                    className="input text-xs py-1.5 font-mono uppercase tracking-wide flex-1"
                  />
                  {confirmationNumber.trim() && (
                    <button
                      type="button"
                      onClick={handleCopyConfirmation}
                      title="Copy confirmation number"
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-500/25 bg-white dark:bg-neutral-900 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-medium inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      {copiedConfirmation ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedConfirmation ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
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
                {!DURATION_OPTIONS.some((opt) => opt.value === durationMinutes) && (
                  <option value={durationMinutes}>
                    {formatDuration(durationMinutes)}
                  </option>
                )}
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
              {trimmedLocation ? (
                <a
                  href={`https://maps.google.co.in/?q=${encodeURIComponent(trimmedLocation)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open "${trimmedLocation}" in Google Maps`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>Location</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
                </a>
              ) : (
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Location
                </label>
              )}
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Tarkarli Beach, Malvan"
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
              Notes &amp; Booking Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Boarding notes, entry rules, right-hand window seat"
              className="input text-sm py-2 px-3 resize-none h-20"
            />
          </div>

          {/* Confirmation PDF / Ticket Attachments: Only for Travel / Stay */}
          {needsBookingDocs && (
            <div className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-neutral-50/80 dark:bg-white/[0.03] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Booking Confirmations &amp; Tickets
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Attach e-tickets, boarding passes, or hotel vouchers (PDF / Image, max 2 MB each)
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  onChange={handleAttachmentUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach File</span>
                </button>
              </div>

              {attachmentError && (
                <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                  {attachmentError}
                </div>
              )}

              {attachments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {attachments.map((att) => {
                    const isPdf = att.mimeType.includes('pdf') || att.name.toLowerCase().endsWith('.pdf');
                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-900/70 border border-black/8 dark:border-white/10 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                            {isPdf ? <FileText className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {att.name}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                              {formatBytes(att.size)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewAttachment(att)}
                            title="Preview file"
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={att.dataUrl}
                            download={att.name}
                            title="Download file"
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            title="Remove file"
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3 border-t border-black/10 dark:border-white/10 shrink-0 bg-white dark:bg-[#161a22]">
          <button
            type="button"
            onClick={requestClose}
            className="btn-ghost text-xs py-2 px-4 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary text-xs py-2 px-5 cursor-pointer shadow-xs"
          >
            {isEditSession ? 'Save Changes' : 'Add to Schedule'}
          </button>
        </div>
      </form>

      {/* In-Modal File Preview Overlay */}
      {previewAttachment && (
        <div className="absolute inset-0 z-30 bg-white/95 dark:bg-[#141821]/98 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-black/10 dark:border-white/10">
            <div className="min-w-0">
              <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {previewAttachment.name}
              </div>
              <div className="text-[10px] font-mono text-neutral-500">
                {formatBytes(previewAttachment.size)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={previewAttachment.dataUrl}
                download={previewAttachment.name}
                className="px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 p-3 overflow-auto flex items-center justify-center bg-neutral-100 dark:bg-black/30">
            {previewAttachment.mimeType.includes('pdf') || previewAttachment.name.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={previewAttachment.dataUrl}
                title={previewAttachment.name}
                className="w-full h-full rounded-lg border border-black/10 dark:border-white/10 bg-white"
              />
            ) : (
              <img
                src={previewAttachment.dataUrl}
                alt={previewAttachment.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            )}
          </div>
        </div>
      )}

      {/* Unsaved Changes Discard Confirmation Overlay */}
      {showDiscardConfirm && (
        <div className="absolute inset-0 z-40 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1f2b] border border-black/10 dark:border-white/15 shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Discard unsaved changes?
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  You have unsaved edits. Closing without saving will discard your changes. Are you sure?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="btn-ghost text-xs py-2 px-3.5 cursor-pointer whitespace-nowrap"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  closeAddModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatedModal>
  );
};

