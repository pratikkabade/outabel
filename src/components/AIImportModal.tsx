import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { buildGenAIItineraryPrompt } from '../utils/aiPrompt';
import { parseICSContent } from '../utils/ics';
import { formatCurrency } from '../utils/currency';
import { AnimatedModal } from './AnimatedModal';

interface AIImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AI_PROVIDERS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    subtitle: 'OpenAI',
    url: 'https://chatgpt.com/',
    accentClass:
      'border-emerald-300/80 dark:border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10',
  },
  {
    id: 'claude',
    name: 'Claude',
    subtitle: 'Anthropic',
    url: 'https://claude.ai/',
    accentClass:
      'border-amber-300/80 dark:border-amber-500/30 hover:border-amber-500 hover:bg-amber-50/70 dark:hover:bg-amber-500/10',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    subtitle: 'Google',
    url: 'https://gemini.google.com/app',
    accentClass:
      'border-blue-300/80 dark:border-blue-500/30 hover:border-blue-500 hover:bg-blue-50/70 dark:hover:bg-blue-500/10',
  },
] as const;

export const AIImportModal: React.FC<AIImportModalProps> = ({ isOpen, onClose }) => {
  const { currentTrip, calendarCategories, currency, addItemsBatch, showToast } = useTrip();

  const [copiedProvider, setCopiedProvider] = useState<string | null>(null);
  const [icsInputMode, setIcsInputMode] = useState<'upload' | 'paste'>('upload');
  const [pastedICS, setPastedICS] = useState('');
  const [icsError, setIcsError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const promptText = useMemo(() => {
    if (!currentTrip) return '';
    return buildGenAIItineraryPrompt({
      from: currentTrip.from,
      to: currentTrip.to,
      startDate: currentTrip.startDate,
      numDays: currentTrip.numDays,
      budget: currentTrip.budget || currentTrip.preferences.budget || 0,
      currency,
      wakeTime: currentTrip.preferences.preferredWakeTime,
      dailyStartTime: currentTrip.preferences.dailyStartTime,
      pace: currentTrip.preferences.pace,
      calendarCategories,
    });
  }, [currentTrip, calendarCategories, currency]);

  if (!currentTrip) return null;

  const handleCopyAndOpen = async (providerName?: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      if (providerName) {
        setCopiedProvider(providerName);
        showToast(`Prompt copied! Paste into ${providerName}, then import the .ics below.`);
      } else {
        showToast('Prompt copied to clipboard!');
      }
    } catch {
      if (providerName) setCopiedProvider(providerName);
      showToast('Unable to access clipboard automatically.');
    }
  };

  const handleImportICSText = (rawText: string) => {
    setIcsError(null);
    try {
      const parsed = parseICSContent(rawText, {
        startDate: currentTrip.startDate,
        numDays: currentTrip.numDays,
        calendarCategories,
      });
      addItemsBatch(parsed.items, parsed.numDays);
      setPastedICS('');
      onClose();
    } catch (err) {
      setIcsError(
        err instanceof Error ? err.message : 'Unable to parse that .ics calendar content.'
      );
    }
  };

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    const text = await file.text();
    handleImportICSText(text);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tripBudget = currentTrip.budget || currentTrip.preferences.budget || 0;

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      backdropClassName="p-4"
      panelClassName="glass-card w-full max-w-xl p-0 relative border border-white/80 dark:border-white/15 max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#161a22] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Generate with GenAI &amp; Import .ics
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {currentTrip.from} → {currentTrip.to} · {currentTrip.numDays} days
              {tripBudget > 0 ? ` · ${formatCurrency(tripBudget, currency)}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 day-items-scroll">
        {/* Step 1: Copy prompt & launch */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
              1. Copy Prompt &amp; Open AI
            </span>
            <button
              type="button"
              onClick={() => handleCopyAndOpen()}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Prompt</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {AI_PROVIDERS.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleCopyAndOpen(p.name)}
                className={`p-3 rounded-2xl border bg-white/80 dark:bg-white/[0.04] transition-colors flex items-center justify-between gap-2 cursor-pointer no-underline ${p.accentClass}`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {p.subtitle}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </a>
            ))}
          </div>

          {copiedProvider && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                Prompt copied! Paste it into {copiedProvider}, then upload or paste the generated <span className="font-mono">.ics</span> below.
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Import .ics */}
        <div className="space-y-3 pt-2 border-t border-black/8 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
              2. Import Generated .ics
            </span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[11px]">
              <button
                type="button"
                onClick={() => setIcsInputMode('upload')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  icsInputMode === 'upload'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setIcsInputMode('paste')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  icsInputMode === 'paste'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {icsInputMode === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] hover:border-emerald-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics,text/calendar"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <Upload className="w-7 h-7 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
              <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                Click or drop your .ics file here
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Events will be added directly to your timeline
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={5}
                value={pastedICS}
                onChange={(e) => setPastedICS(e.target.value)}
                placeholder="Paste raw .ics content (BEGIN:VCALENDAR ... END:VCALENDAR)"
                className="w-full p-3 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#1e2128] text-xs font-mono text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!pastedICS.trim()}
                  onClick={() => handleImportICSText(pastedICS)}
                  className="btn-primary text-xs py-2 px-4 disabled:opacity-40 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Import .ics Events</span>
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
        </div>
      </div>
    </AnimatedModal>
  );
};
