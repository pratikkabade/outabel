import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Navigation,
  Calendar,
  Clock,
  Gauge,
  Check,
  Sun,
  Coffee,
  Upload,
  FileArchive,
  FileJson,
  Sparkles,
  AlertTriangle,
  Wallet,
  Copy,
  ExternalLink,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bot,
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { TripPace } from '../types/trip';
import {
  CategoryDiffResult,
  compareCategoriesWithWorkspace,
  ParsedTripImport,
  parseTripImportFile,
} from '../utils/tripPackage';
import { parseICSContent } from '../utils/ics';
import { buildGenAIItineraryPrompt } from '../utils/aiPrompt';
import { CURRENCIES, CurrencyCode, formatCurrency } from '../utils/currency';
import { CALENDAR_COLOR_STYLES } from '../utils/calendarCategories';
import { OutabelLogo } from './OutabelLogo';

const TOTAL_STEPS = 10;

const BUDGET_PRESETS: Record<CurrencyCode, number[]> = {
  INR: [10000, 25000, 50000, 100000],
  USD: [500, 1500, 3000, 5000],
  EUR: [500, 1500, 3000, 5000],
  GBP: [400, 1200, 2500, 4000],
  JPY: [50000, 120000, 250000, 500000],
};

const AI_PROVIDERS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    subtitle: 'OpenAI',
    url: 'https://chatgpt.com/',
    accentClass:
      'border-emerald-300/80 dark:border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10',
    badgeClass: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'claude',
    name: 'Claude',
    subtitle: 'Anthropic',
    url: 'https://claude.ai/',
    accentClass:
      'border-amber-300/80 dark:border-amber-500/30 hover:border-amber-500 hover:bg-amber-50/70 dark:hover:bg-amber-500/10',
    badgeClass: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    subtitle: 'Google',
    url: 'https://gemini.google.com/app',
    accentClass:
      'border-blue-300/80 dark:border-blue-500/30 hover:border-blue-500 hover:bg-blue-50/70 dark:hover:bg-blue-500/10',
    badgeClass: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
  },
] as const;

export const Wizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stepNumber } = useParams<{ stepNumber?: string }>();

  const {
    createTrip,
    setScreen,
    calendarCategories,
    packingCategories,
    importTripPackage,
    currency,
    setCurrency,
    showToast,
    wizardDraft,
    updateWizardDraft,
    resetWizardDraft,
  } = useTrip();

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [icsError, setIcsError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingICS, setIsDraggingICS] = useState(false);
  const [pendingImport, setPendingImport] = useState<ParsedTripImport | null>(null);
  const [categoryDiff, setCategoryDiff] = useState<CategoryDiffResult | null>(null);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [icsInputMode, setIcsInputMode] = useState<'upload' | 'paste'>('upload');
  const [pastedICS, setPastedICS] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const icsInputRef = useRef<HTMLInputElement>(null);

  const isImportWarningRoute = location.pathname === '/new/import-warning';
  const parsedStepParam = stepNumber ? parseInt(stepNumber, 10) : NaN;
  const isStepsRoute =
    location.pathname.startsWith('/new/step/') &&
    !Number.isNaN(parsedStepParam) &&
    parsedStepParam >= 1 &&
    parsedStepParam <= TOTAL_STEPS;

  const step = isStepsRoute ? parsedStepParam - 1 : 0;

  const {
    from,
    to,
    startDate,
    numDays,
    budget,
    wakeTime,
    dailyStartTime,
    pace,
    copiedProvider,
    importedItems,
    importedSourceName,
  } = wizardDraft;

  const generatedPrompt = useMemo(
    () =>
      buildGenAIItineraryPrompt({
        from: from.trim() || 'Home',
        to: to.trim() || 'Destination',
        startDate,
        numDays: Math.max(1, numDays),
        budget,
        currency,
        wakeTime,
        dailyStartTime,
        pace,
        calendarCategories,
      }),
    [from, to, startDate, numDays, budget, currency, wakeTime, dailyStartTime, pace, calendarCategories]
  );

  const handleImportPackageOrICS = async (file: File | undefined | null) => {
    if (!file) return;
    setImportError(null);
    setIsImporting(true);

    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.ics') || file.type === 'text/calendar') {
        const text = await file.text();
        const parsed = parseICSContent(text, { calendarCategories });
        const newTrip = createTrip({
          from: 'Origin',
          to: parsed.title.replace(/\s+Itinerary$/i, '') || 'Destination',
          startDate: parsed.startDate,
          numDays: parsed.numDays,
          preferredWakeTime: wakeTime,
          dailyStartTime,
          pace,
          items: parsed.items,
        });
        resetWizardDraft();
        setScreen('planner', newTrip.id);
        return;
      }

      const parsed = await parseTripImportFile(file);
      const diff = compareCategoriesWithWorkspace(
        parsed.calendarCategories,
        calendarCategories,
        parsed.packingCategories,
        packingCategories
      );

      if (diff.hasDifferences) {
        setPendingImport(parsed);
        setCategoryDiff(diff);
        navigate('/new/import-warning');
      } else {
        const imported = importTripPackage(parsed, { replaceCategories: false });
        setScreen('planner', imported.id);
      }
    } catch (err) {
      setImportError(
        err instanceof Error
          ? err.message
          : 'Unable to read that file. Please upload an exported .json, .zip, or .ics file.'
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = (replaceCategories: boolean) => {
    if (!pendingImport) return;
    const imported = importTripPackage(pendingImport, { replaceCategories });
    setPendingImport(null);
    setCategoryDiff(null);
    setScreen('planner', imported.id);
  };

  const handleParseWizardICS = (rawText: string, sourceName: string) => {
    setIcsError(null);
    try {
      const parsed = parseICSContent(rawText, {
        startDate,
        numDays,
        calendarCategories,
      });
      updateWizardDraft({
        importedItems: parsed.items,
        importedSourceName: sourceName,
        numDays: Math.max(numDays, parsed.numDays),
      });
      showToast(`Loaded ${parsed.items.length} events from ${sourceName}`);
    } catch (err) {
      setIcsError(
        err instanceof Error ? err.message : 'Unable to parse that .ics calendar content.'
      );
    }
  };

  const handleWizardICSFile = async (file: File | undefined | null) => {
    if (!file) return;
    const text = await file.text();
    handleParseWizardICS(text, file.name);
    if (icsInputRef.current) {
      icsInputRef.current.value = '';
    }
  };

  const copyPromptToClipboard = async (providerName?: string) => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      if (providerName) {
        updateWizardDraft({ copiedProvider: providerName });
        showToast(`Prompt copied! Paste it into ${providerName}, then import the .ics in the next step.`);
      } else {
        showToast('Prompt copied to clipboard!');
      }
    } catch {
      if (providerName) {
        updateWizardDraft({ copiedProvider: providerName });
      }
      showToast('Copy the prompt from the preview below if clipboard access was blocked.');
    }
  };

  const handleFinalizeTrip = (includeImportedItems: boolean) => {
    const newTrip = createTrip({
      from: from.trim() || 'Home',
      to: to.trim() || 'Destination',
      startDate,
      numDays: Math.max(1, numDays),
      budget: budget > 0 ? budget : undefined,
      preferredWakeTime: wakeTime,
      dailyStartTime,
      pace,
      items: includeImportedItems ? importedItems : [],
    });
    resetWizardDraft();
    setScreen('planner', newTrip.id);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      navigate(`/new/step/${step + 2}`);
    } else {
      handleFinalizeTrip(true);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      navigate(`/new/step/${step}`);
    } else {
      navigate('/new');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const importedTotalCost = useMemo(
    () => importedItems.reduce((sum, item) => sum + (item.cost || 0), 0),
    [importedItems]
  );

  // Import Warning Screen
  if (isImportWarningRoute && pendingImport && categoryDiff) {
    return (
      <div className="relative z-10 w-full min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 sm:p-6 pb-20">
        <div className="w-full max-w-xl mx-auto">
          <div className="glass-card p-6 sm:p-8 border border-black/10 dark:border-white/10 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Replace Categories &amp; Colors?
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                  The imported file contains category names or colors that differ from your current workspace settings. Choose whether to replace your categories before importing the trip.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/[0.025] dark:bg-white/[0.04] border border-black/8 dark:border-white/10 space-y-1">
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {pendingImport.trip.title}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>
                  {pendingImport.trip.from} → {pendingImport.trip.to}
                </span>
                <span>·</span>
                <span>{pendingImport.trip.numDays} days</span>
                <span>·</span>
                <span>{pendingImport.trip.items.length} events</span>
                <span>·</span>
                <span>{pendingImport.trip.packingList?.length || 0} packing items</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/[0.07] dark:bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Detected Differences ({categoryDiff.items.length})
              </div>
              <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1 day-items-scroll">
                {categoryDiff.items.map((diff, idx) => {
                  const swatch = diff.toColor
                    ? CALENDAR_COLOR_STYLES[diff.toColor]?.swatch
                    : diff.fromColor
                    ? CALENDAR_COLOR_STYLES[diff.fromColor]?.swatch
                    : 'bg-neutral-400';

                  return (
                    <li
                      key={idx}
                      className="text-xs text-neutral-700 dark:text-neutral-200 flex items-center gap-2"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${swatch}`} />
                      <span>{diff.message}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setPendingImport(null);
                  setCategoryDiff(null);
                  navigate('/new');
                }}
                className="btn-ghost text-xs py-2 px-3.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmImport(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                >
                  Keep Current Categories
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmImport(true)}
                  className="btn-primary text-xs py-2 px-4 cursor-pointer shadow-xs"
                >
                  Replace Categories &amp; Import
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Choose Mode Screen (/new)
  if (!isStepsRoute) {
    return (
      <div className="relative z-10 w-full min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 sm:p-6 pb-20">
        <div className="w-full max-w-2xl mx-auto">
          <div className="glass-card p-6 sm:p-9 border border-black/10 dark:border-white/10">
            <div className="mb-7">
              <OutabelLogo className="w-11 h-11 mb-4 drop-shadow-sm" />
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
                New Trip Setup
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                How would you like to start?
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1.5">
                Build a tailored itinerary step-by-step (with an optional AI prompt &amp; .ics import) or import an existing .json, .zip, or .ics file.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Step-by-step Wizard */}
              <button
                type="button"
                onClick={() => {
                  setImportError(null);
                  setIcsError(null);
                  updateWizardDraft({
                    importedItems: [],
                    importedSourceName: null,
                    copiedProvider: null,
                  });
                  navigate('/new/step/1');
                }}
                className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] hover:border-blue-400 dark:hover:border-blue-400/60 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 text-left transition-colors flex flex-col justify-between gap-5 cursor-pointer group"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Create Step-by-Step
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                    Set your route, dates, budget, routine, and pace — then optionally auto-generate your schedule via ChatGPT, Claude, or Gemini.
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Start Step 1</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Option 2: Import from .zip / .json / .ics */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  const file = e.dataTransfer.files?.[0];
                  handleImportPackageOrICS(file);
                }}
                onClick={() => !isImporting && fileInputRef.current?.click()}
                className={`p-5 rounded-2xl border text-left transition-colors flex flex-col justify-between gap-5 cursor-pointer ${
                  isDraggingFile
                    ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15'
                    : 'border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] hover:border-emerald-400 dark:hover:border-emerald-400/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.zip,.ics,application/json,application/zip,text/calendar"
                  className="hidden"
                  onChange={(e) => handleImportPackageOrICS(e.target.files?.[0])}
                />

                <div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <FileArchive className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Import .zip / .json / .ics
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                    Select or drop an exported Outabel package or an .ics calendar file to populate your itinerary automatically.
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Reading file...' : 'Choose .zip, .json, or .ics'}</span>
                </div>
              </div>
            </div>

            {importError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-ghost text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>

              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <FileJson className="w-3.5 h-3.5" />
                <span>Supports .json, .zip &amp; .ics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step-by-step Wizard (/new/step/1..10)
  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 sm:p-6 pb-20">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-2.5">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
              <span>
                Step {step + 1} of {TOTAL_STEPS}
              </span>
            </span>
            <span className="font-mono tabular-nums">
              {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-6 sm:p-10 border border-black/10 dark:border-white/10 relative overflow-hidden transition-all duration-200">
          {/* Step 1: Departure */}
          {step === 0 && (
            <div className="space-y-6" onKeyDown={handleKeyDown}>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Where are you departing from?
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Your home city, airport, or journey starting point.
                </p>
              </div>
              <div>
                <input
                  type="text"
                  autoFocus
                  value={from}
                  onChange={(e) => updateWizardDraft({ from: e.target.value })}
                  placeholder="e.g. Sangli, Pune, Mumbai, Bengaluru, New Delhi"
                  className="input text-lg py-3 px-4"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Sangli', 'Bengaluru', 'Pune', 'Mumbai', 'New Delhi', 'Hyderabad'].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => updateWizardDraft({ from: city })}
                    className="chip cursor-pointer"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Destination */}
          {step === 1 && (
            <div className="space-y-6" onKeyDown={handleKeyDown}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Where are you traveling to?
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Your primary destination or multi-city route.
                </p>
              </div>
              <div>
                <input
                  type="text"
                  autoFocus
                  value={to}
                  onChange={(e) => updateWizardDraft({ to: e.target.value })}
                  placeholder="e.g. Malvan, Puducherry, Tirupati, Mahabalipuram"
                  className="input text-lg py-3 px-4"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Malvan, Konkan', 'Puducherry', 'Tirupati, AP', 'Auroville', 'Mahabalipuram'].map(
                  (dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => updateWizardDraft({ to: dest })}
                      className="chip cursor-pointer"
                    >
                      {dest}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Step 3: Start Date */}
          {step === 2 && (
            <div className="space-y-6" onKeyDown={handleKeyDown}>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  When does your journey begin?
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Select Day 1 departure date.
                </p>
              </div>
              <div>
                <input
                  type="date"
                  autoFocus
                  value={startDate}
                  onChange={(e) => updateWizardDraft({ startDate: e.target.value })}
                  className="input text-lg py-3 px-4 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Step 4: Number of Days */}
          {step === 3 && (
            <div className="space-y-6" onKeyDown={handleKeyDown}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  How many days will you explore?
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Select duration to generate your horizontal day timeline columns.
                </p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {[3, 4, 5, 7, 10, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateWizardDraft({ numDays: d })}
                    className={`py-3 rounded-2xl text-sm sm:text-base font-semibold border transition-all cursor-pointer ${
                      numDays === d
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30'
                        : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                  Or custom days:
                </span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={numDays}
                  onChange={(e) =>
                    updateWizardDraft({
                      numDays: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="input py-2 px-3 text-center font-mono w-24 text-base"
                />
              </div>
            </div>
          )}

          {/* Step 5: Trip Budget */}
          {step === 4 && (
            <div className="space-y-6" onKeyDown={handleKeyDown}>
              <div className="flex items-center justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>

                {/* Quick Currency Switcher */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10">
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCurrency(c);
                        updateWizardDraft({ budget: BUDGET_PRESETS[c][1] });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                        currency === c
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                      }`}
                    >
                      {CURRENCIES[c].symbol} {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  What is your trip budget?
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Used to track expenses and guide AI-generated itinerary cost estimates across {numDays} days.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {BUDGET_PRESETS[currency].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateWizardDraft({ budget: preset })}
                    className={`py-3 px-2 rounded-2xl text-sm font-mono tabular-nums font-semibold border transition-all cursor-pointer ${
                      budget === preset
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30'
                        : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                    }`}
                  >
                    {formatCurrency(preset, currency)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="relative flex-1 min-w-[180px]">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-semibold text-neutral-400">
                    {CURRENCIES[currency]?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={budget || ''}
                    onChange={(e) =>
                      updateWizardDraft({
                        budget: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    placeholder="Enter custom total budget"
                    className="input pl-8 pr-4 font-mono tabular-nums text-base"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => updateWizardDraft({ budget: 0 })}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    budget === 0
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent'
                      : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-blue-400'
                  }`}
                >
                  Flexible / No Cap
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Wake-up Time */}
          {step === 5 && (
            <div className="space-y-6" onKeyDown={handleKeyDown}>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Preferred wake-up time
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  When do you naturally rise when traveling?
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { time: '06:30', label: 'Early Riser' },
                  { time: '07:30', label: 'Balanced' },
                  { time: '09:00', label: 'Slow Morning' },
                ].map((item) => (
                  <button
                    key={item.time}
                    type="button"
                    onClick={() => updateWizardDraft({ wakeTime: item.time })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      wakeTime === item.time
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30'
                        : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-lg font-bold font-mono">{item.time}</div>
                    <div className="text-xs opacity-80 mt-1">{item.label}</div>
                  </button>
                ))}
              </div>
              <div>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => updateWizardDraft({ wakeTime: e.target.value })}
                  className="input py-2 px-3 font-mono text-base"
                />
              </div>
            </div>
          )}

          {/* Step 7: Daily Start Time */}
          {step === 6 && (
            <div className="space-y-6" onKeyDown={handleKeyDown}>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Daily departure &amp; first activity
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  What time do you typically walk out the door to start exploring?
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { time: '08:30', label: 'Beat the Crowds' },
                  { time: '09:30', label: 'Standard Start' },
                  { time: '10:30', label: 'Leisurely Brunch' },
                ].map((item) => (
                  <button
                    key={item.time}
                    type="button"
                    onClick={() => updateWizardDraft({ dailyStartTime: item.time })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      dailyStartTime === item.time
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30'
                        : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-lg font-bold font-mono">{item.time}</div>
                    <div className="text-xs opacity-80 mt-1">{item.label}</div>
                  </button>
                ))}
              </div>
              <div>
                <input
                  type="time"
                  value={dailyStartTime}
                  onChange={(e) => updateWizardDraft({ dailyStartTime: e.target.value })}
                  className="input py-2 px-3 font-mono text-base"
                />
              </div>
            </div>
          )}

          {/* Step 8: Travel Pace */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Choose your travel pace
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Our suggestion strip and AI prompt will tailor activity density to match this rhythm.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    id: 'relaxed' as TripPace,
                    title: 'Relaxed & Unhurried',
                    desc: '2–3 focal activities per day, extended dining, generous afternoon downtime.',
                  },
                  {
                    id: 'balanced' as TripPace,
                    title: 'Balanced & Thoughtful (Recommended)',
                    desc: '3–5 items per day, structured pacing with room for spontaneous wandering.',
                  },
                  {
                    id: 'packed' as TripPace,
                    title: 'Packed & Immersive',
                    desc: '5–7 items per day, early mornings to late evenings, maximizing sights.',
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateWizardDraft({ pace: option.id })}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-4 cursor-pointer ${
                      pace === option.id
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30'
                        : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-blue-400'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-base">{option.title}</div>
                      <div className="text-xs opacity-85 mt-1 leading-relaxed">{option.desc}</div>
                    </div>
                    {pace === option.id && <Check className="w-5 h-5 shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 9: Auto-generate with GenAI (Prompt + ChatGPT/Claude/Gemini Launchers) */}
          {step === 8 && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6" />
                </div>

                <button
                  type="button"
                  onClick={() => copyPromptToClipboard()}
                  className="btn-ghost text-xs py-2 px-3.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt</span>
                </button>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Auto-generate with GenAI
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Click any assistant below to copy your tailored itinerary prompt (complete with your route, budget, pace, and Outabel&apos;s <span className="font-mono">.ics</span> format) and open it in a new tab.
                </p>
              </div>

              {/* Trip Spec Summary Line */}
              <div className="px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/8 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {from || 'Home'} → {to || 'Destination'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{numDays} days</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Budget: {budget > 0 ? formatCurrency(budget, currency) : 'Flexible'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{pace} pace</span>
              </div>

              {/* Provider Buttons: ChatGPT, Claude, Gemini */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AI_PROVIDERS.map((provider) => (
                  <a
                    key={provider.id}
                    href={provider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => copyPromptToClipboard(provider.name)}
                    className={`p-4 rounded-2xl border bg-white/80 dark:bg-white/[0.04] transition-all flex flex-col justify-between gap-3 cursor-pointer no-underline ${provider.accentClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${provider.badgeClass}`}
                      >
                        {provider.subtitle}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-neutral-900 dark:text-white">
                        {provider.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Copy prompt &amp; open
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Instruction Callout */}
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed transition-colors ${
                  copiedProvider
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : 'bg-blue-500/[0.06] border-blue-500/20 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  {copiedProvider ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Prompt copied for {copiedProvider}!</span>
                    </>
                  ) : (
                    <span>How this works:</span>
                  )}
                </div>
                <p>
                  {copiedProvider
                    ? `Paste the copied prompt into ${copiedProvider}, download or copy the generated .ics calendar file it gives you, then click "Continue to Import .ics" below.`
                    : '1. Click ChatGPT, Claude, or Gemini above (the prompt copies automatically). 2. Paste it and ask it to generate your .ics file. 3. Return here and import that .ics file in the next step.'}
                </p>
              </div>

              {/* Collapsible Prompt Preview */}
              <div className="border border-black/8 dark:border-white/10 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPromptPreview((prev) => !prev)}
                  className="w-full px-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <span>Preview generated prompt &amp; .ics format</span>
                  {showPromptPreview ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showPromptPreview && (
                  <pre className="p-4 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 bg-white/60 dark:bg-black/25 max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed day-items-scroll border-t border-black/8 dark:border-white/10">
                    {generatedPrompt}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Step 10: Import Generated .ics Itinerary */}
          {step === 9 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>

                {/* Toggle Upload File vs Paste ICS Text */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-xs">
                  <button
                    type="button"
                    onClick={() => setIcsInputMode('upload')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      icsInputMode === 'upload'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    Upload .ics
                  </button>
                  <button
                    type="button"
                    onClick={() => setIcsInputMode('paste')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      icsInputMode === 'paste'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    Paste .ics Text
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Import your generated .ics
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Upload the <span className="font-mono">.ics</span> file downloaded from ChatGPT, Claude, or Gemini — or paste its code block directly — to populate your timeline.
                </p>
              </div>

              {icsInputMode === 'upload' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingICS(true);
                  }}
                  onDragLeave={() => setIsDraggingICS(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingICS(false);
                    handleWizardICSFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => icsInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed text-center transition-colors cursor-pointer ${
                    isDraggingICS
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] hover:border-emerald-400 hover:bg-emerald-500/[0.04]'
                  }`}
                >
                  <input
                    ref={icsInputRef}
                    type="file"
                    accept=".ics,text/calendar"
                    className="hidden"
                    onChange={(e) => handleWizardICSFile(e.target.files?.[0])}
                  />
                  <FileText className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 mb-2.5" />
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Click to select or drop your .ics file here
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Reads VEVENT dates, start/end times, locations, categories, and cost estimates
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <textarea
                    rows={6}
                    value={pastedICS}
                    onChange={(e) => setPastedICS(e.target.value)}
                    placeholder={`Paste raw .ics content here (starting with BEGIN:VCALENDAR ... END:VCALENDAR)`}
                    className="w-full p-3.5 rounded-2xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#1e2128] text-xs font-mono text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!pastedICS.trim()}
                      onClick={() => handleParseWizardICS(pastedICS, 'Pasted .ics')}
                      className="btn-primary text-xs py-2 px-4 disabled:opacity-40 cursor-pointer"
                    >
                      Parse .ics Events
                    </button>
                  </div>
                </div>
              )}

              {icsError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{icsError}</span>
                </div>
              )}

              {/* Parsed ICS Preview */}
              {importedItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>
                          Ready to import {importedItems.length} events
                          {importedSourceName ? ` (${importedSourceName})` : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 font-mono tabular-nums">
                        Est. Total: {formatCurrency(importedTotalCost, currency)}
                        {budget > 0 ? ` / ${formatCurrency(budget, currency)} budget` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateWizardDraft({ importedItems: [], importedSourceName: null })
                      }
                      title="Clear imported events"
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 day-items-scroll">
                    {importedItems.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-black/25 border border-black/5 dark:border-white/10 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-mono tabular-nums text-[11px] text-blue-600 dark:text-blue-400 font-semibold mr-2">
                            D{item.day} · {item.start}
                          </span>
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {item.title}
                          </span>
                        </div>
                        {item.cost ? (
                          <span className="font-mono tabular-nums text-[11px] text-neutral-500 shrink-0">
                            {formatCurrency(item.cost, currency)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                    {importedItems.length > 8 && (
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center pt-1">
                        +{importedItems.length - 8} more events
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-8 mt-6 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={handlePrev}
              className="btn-ghost text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2.5">
              {step === 8 && (
                <button
                  type="button"
                  onClick={() => handleFinalizeTrip(false)}
                  className="btn-ghost text-sm py-2.5 px-4 cursor-pointer"
                >
                  <span>Skip &amp; Build Blank</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="btn-primary text-sm py-2.5 px-6 shadow-md shadow-blue-500/25 cursor-pointer"
              >
                <span>
                  {step === 8
                    ? 'Continue to Import .ics'
                    : step === TOTAL_STEPS - 1
                    ? importedItems.length > 0
                      ? `Build Itinerary (${importedItems.length} events)`
                      : 'Build Blank Itinerary'
                    : 'Continue'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
