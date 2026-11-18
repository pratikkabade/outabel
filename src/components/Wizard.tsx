import React, { useState, useRef } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { TripPace } from '../types/trip';
import {
  CategoryDiffResult,
  compareCategoriesWithWorkspace,
  ParsedTripImport,
  parseTripImportFile,
} from '../utils/tripPackage';
import { CALENDAR_COLOR_STYLES } from '../utils/calendarCategories';
import { OutabelLogo } from './OutabelLogo';

type WizardMode = 'choose' | 'steps' | 'import-warning';

export const Wizard: React.FC = () => {
  const {
    createTrip,
    setScreen,
    calendarCategories,
    packingCategories,
    importTripPackage,
  } = useTrip();

  const [mode, setMode] = useState<WizardMode>('choose');
  const [step, setStep] = useState<number>(0);
  const [from, setFrom] = useState<string>('Pune');
  const [to, setTo] = useState<string>('Malvan, Konkan');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [numDays, setNumDays] = useState<number>(5);
  const [wakeTime, setWakeTime] = useState<string>('07:30');
  const [dailyStartTime, setDailyStartTime] = useState<string>('09:00');
  const [pace, setPace] = useState<TripPace>('balanced');

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [pendingImport, setPendingImport] = useState<ParsedTripImport | null>(null);
  const [categoryDiff, setCategoryDiff] = useState<CategoryDiffResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 7;

  const handleImportFile = async (file: File | undefined | null) => {
    if (!file) return;
    setImportError(null);
    setIsImporting(true);

    try {
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
        setMode('import-warning');
      } else {
        importTripPackage(parsed, { replaceCategories: false });
        setScreen('planner');
      }
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Unable to read that file. Please upload an exported .json or .zip file.'
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
    importTripPackage(pendingImport, { replaceCategories });
    setPendingImport(null);
    setCategoryDiff(null);
    setScreen('planner');
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep((prev) => prev + 1);
    } else {
      createTrip({
        from: from.trim() || 'Home',
        to: to.trim() || 'Destination',
        startDate,
        numDays: Math.max(1, numDays),
        preferredWakeTime: wakeTime,
        dailyStartTime,
        pace,
      });
      setScreen('planner');
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    } else {
      setMode('choose');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  if (mode === 'choose') {
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
                Build a fresh itinerary step-by-step or import an exported .json / .zip package with your events, categories, colors, and packing checklist.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Step-by-step Wizard */}
              <button
                type="button"
                onClick={() => {
                  setImportError(null);
                  setStep(0);
                  setMode('steps');
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
                    Set your departure, destination, dates, wake-up routine, and pace in 7 quick steps.
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Start Step 1</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Option 2: Import from .zip / .json */}
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
                  handleImportFile(file);
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
                  accept=".json,.zip,application/json,application/zip"
                  className="hidden"
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                />

                <div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <FileArchive className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Import from .zip / .json
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                    Select or drop an exported Outabel file to load all trip events, categories, colors, and packing items automatically.
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Reading file...' : 'Choose .zip or .json file'}</span>
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
                onClick={() => setScreen('home')}
                className="btn-ghost text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>

              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <FileJson className="w-3.5 h-3.5" />
                <span>Supports .json &amp; .zip exports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'import-warning' && pendingImport && categoryDiff) {
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

            {/* Parsed Trip Preview */}
            <div className="p-3.5 rounded-2xl bg-black/[0.025] dark:bg-white/[0.04] border border-black/8 dark:border-white/10 space-y-1">
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {pendingImport.trip.title}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>{pendingImport.trip.from} → {pendingImport.trip.to}</span>
                <span>·</span>
                <span>{pendingImport.trip.numDays} days</span>
                <span>·</span>
                <span>{pendingImport.trip.items.length} events</span>
                <span>·</span>
                <span>{pendingImport.trip.packingList?.length || 0} packing items</span>
              </div>
            </div>

            {/* Category & Color Differences */}
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
                  setMode('choose');
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

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 sm:p-6 pb-20">
      <div className="w-full max-w-xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-2.5">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
              <span>Step {step + 1} of {totalSteps}</span>
            </span>
            <span className="font-mono tabular-nums">{Math.round(((step + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-6 sm:p-10 border border-black/10 dark:border-white/10 relative overflow-hidden transition-all duration-200">
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
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="e.g. Sangli, Pune, Mumbai, Bengaluru, New Delhi"
                  className="input text-lg py-3 px-4"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Sangli', 'Bengaluru', 'Pune', 'Mumbai', 'New Delhi', 'Hyderabad'].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setFrom(city)}
                    className="chip cursor-pointer"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="e.g. Malvan, Puducherry, Tirupati, Mahabalipuram"
                  className="input text-lg py-3 px-4"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Malvan, Konkan', 'Puducherry', 'Tirupati, AP', 'Auroville', 'Mahabalipuram'].map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setTo(dest)}
                    className="chip cursor-pointer"
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input text-lg py-3 px-4 cursor-pointer"
                />
              </div>
            </div>
          )}

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
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                {[3, 4, 5, 7, 10, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setNumDays(d)}
                    className={`py-3 rounded-2xl text-base font-semibold border transition-all cursor-pointer ${
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
                <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Or custom days:</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={numDays}
                  onChange={(e) => setNumDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="input py-2 px-3 text-center font-mono w-24 text-base"
                />
              </div>
            </div>
          )}

          {step === 4 && (
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
                    onClick={() => setWakeTime(item.time)}
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
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="input py-2 px-3 font-mono text-base"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6" onKeyDown={handleKeyDown}>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Daily departure & first activity
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
                    onClick={() => setDailyStartTime(item.time)}
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
                  onChange={(e) => setDailyStartTime(e.target.value)}
                  className="input py-2 px-3 font-mono text-base"
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Choose your travel pace
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Our suggestion strip will tailor buffer recommendations to match this rhythm.
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
                    onClick={() => setPace(option.id)}
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

          <div className="flex items-center justify-between pt-8 mt-6 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={handlePrev}
              className="btn-ghost text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="btn-primary text-sm py-2.5 px-6 shadow-md shadow-blue-500/25 cursor-pointer"
            >
              <span>{step === totalSteps - 1 ? 'Build Itinerary' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
