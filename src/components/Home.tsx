import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CalendarCheck2,
  CheckSquare,
  Compass,
  Plus,
  Route,
  Settings,
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { Trip } from '../types/trip';
import { formatCurrency } from '../utils/currency';
import { generateDefaultPackingList } from '../utils/defaultPackingLists';
import { SAMPLE_TRIPS } from '../utils/sampleData';
import { OutabelLogo } from './OutabelLogo';

const TEMPLATE_IDS = new Set(SAMPLE_TRIPS.map((t) => t.id));

const getDefaultDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
};

export const Home: React.FC = () => {
  const {
    trips,
    currentTrip,
    setCurrentTrip,
    createTrip,
    setScreen,
    currency,
  } = useTrip();

  const [quickFrom, setQuickFrom] = useState('Pune');
  const [quickTo, setQuickTo] = useState('Goa');
  const [quickStartDate, setQuickStartDate] = useState(getDefaultDate);
  const [quickDays, setQuickDays] = useState(4);

  // Order trips so user-created / imported trips appear first, followed by saved templates
  const orderedSavedTrips = useMemo(() => {
    const custom = trips
      .filter((t) => !TEMPLATE_IDS.has(t.id))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    const savedTemplates = trips.filter((t) => TEMPLATE_IDS.has(t.id));
    return [...custom, ...savedTemplates];
  }, [trips]);

  const previewPackingCount = useMemo(
    () => generateDefaultPackingList(quickDays).length,
    [quickDays]
  );

  const openTripInPlanner = (trip: Trip) => {
    setCurrentTrip(trip);
    setScreen('planner', trip.id);
  };

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const fromVal = quickFrom.trim() || 'Home';
    const toVal = quickTo.trim() || 'Destination';
    const daysVal = Math.max(1, Math.min(30, Number(quickDays) || 3));

    const created = createTrip({
      from: fromVal,
      to: toVal,
      startDate: quickStartDate || getDefaultDate(),
      numDays: daysVal,
      preferredWakeTime: '07:30',
      dailyStartTime: '09:00',
      pace: 'balanced',
    });
    setScreen('planner', created.id);
  };

  return (
    <div className="relative z-10 w-full min-h-[calc(100dvh-65px)] pb-16">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Column: Clear Positioning + Primary Actions */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h1
              style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.35rem)' }}
              className="font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.08] text-balance"
            >
              Plan every day of your trip on one clean timeline.
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-xl mt-5">
              Organize transit, stays, meals, and booking confirmations hour by hour—with overlap detection, separate packing checklists tailored to your trip length, and calendar exports.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button
                type="button"
                onClick={() => setScreen('wizard')}
                className="btn-primary text-sm py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/20 cursor-pointer whitespace-nowrap"
              >
                <Compass className="w-4 h-4" />
                <span>Guided Trip Wizard</span>
              </button>

              <button
                type="button"
                onClick={() => setScreen('trips')}
                className="btn-ghost text-sm py-3 px-5 rounded-2xl cursor-pointer whitespace-nowrap"
              >
                <span>Browse Saved Trips ({orderedSavedTrips.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: New-User Onboarding & Quick-Start Launchpad */}
          <div className="lg:col-span-6 flex">
            <div className="glass-card w-full p-5 sm:p-6 border border-black/8 dark:border-white/12 flex flex-col justify-between gap-5">
              <div>
                <div className="pb-4 border-b border-black/8 dark:border-white/10">
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Getting Started
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
                    How Outabel sets up your trip
                  </h2>
                </div>

                {/* 3 Concrete Onboarding Steps */}
                <div className="divide-y divide-black/6 dark:divide-white/8 mt-1">
                  <div className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Route className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        1. Pick route &amp; dates (or import AI .ics)
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                        Start blank below, or use the Guided Wizard to copy a prompt for Gemini/Claude and import a ready-made .ics draft.
                      </p>
                    </div>
                  </div>

                  <div className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarCheck2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        2. Drag events onto the timeline
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                        Schedule flights, stays, and meals across days with overlap checks, ticket PDFs, and Google Maps links.
                      </p>
                    </div>
                  </div>

                  <div className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        3. Auto packing checklist &amp; export
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                        Every new trip prepares a separate item-by-item checklist for your trip length plus .ics and PDF exports.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick-Start Form */}
              <form
                onSubmit={handleQuickCreate}
                className="pt-4 border-t border-black/8 dark:border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Quick Start a Trip
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                    Auto-adds {previewPackingCount} packing items
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={quickFrom}
                    onChange={(e) => setQuickFrom(e.target.value)}
                    placeholder="From (e.g. Pune)"
                    aria-label="Departure city"
                    className="input h-9 text-xs py-1.5 px-3"
                    required
                  />
                  <input
                    type="text"
                    value={quickTo}
                    onChange={(e) => setQuickTo(e.target.value)}
                    placeholder="Destination (e.g. Goa)"
                    aria-label="Destination city"
                    className="input h-9 text-xs py-1.5 px-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-center">
                  <input
                    type="date"
                    value={quickStartDate}
                    onChange={(e) => setQuickStartDate(e.target.value)}
                    aria-label="Start date"
                    className="input h-9 text-xs py-1.5 px-3 font-mono"
                    required
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={quickDays}
                      onChange={(e) =>
                        setQuickDays(Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1)))
                      }
                      aria-label="Number of days"
                      className="input h-9 text-xs py-1.5 px-3 font-mono tabular-nums w-full"
                      required
                    />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
                      days
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="col-span-2 sm:col-span-1 btn-primary h-9 text-xs py-1.5 px-4 cursor-pointer whitespace-nowrap justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Trip</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Saved & Starter Trips Directory */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-black/8 dark:border-white/10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Your Trips ({orderedSavedTrips.length})
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Open any created trip or starter itinerary directly in the timeline or review workspace.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen('trips')}
              className="btn-ghost text-xs py-2 px-3.5 whitespace-nowrap cursor-pointer"
            >
              <span>Manage All</span>
            </button>
            <button
              type="button"
              onClick={() => setScreen('wizard')}
              className="btn-primary text-xs py-2 px-3.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Trip</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderedSavedTrips.slice(0, 6).map((trip) => {
            const isCurrent = currentTrip?.id === trip.id;
            const isCustom = !TEMPLATE_IDS.has(trip.id);
            const totalBudget = trip.items.reduce((acc, i) => acc + (i.cost || 0), 0);

            return (
              <div
                key={trip.id}
                className={`glass-card p-5 border transition-colors flex flex-col justify-between gap-4 ${
                  isCurrent
                    ? 'border-blue-500/45 ring-1 ring-blue-500/20'
                    : 'border-black/8 dark:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                    <span className="truncate font-medium">
                      {trip.from} → {trip.to}
                    </span>
                    <span className="shrink-0 font-semibold text-blue-600 dark:text-blue-400">
                      {isCurrent ? 'Active' : isCustom ? 'Created' : 'Template'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                    {trip.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      <span>{trip.startDate}</span>
                    </span>
                    <span>·</span>
                    <span>{trip.numDays}d</span>
                    <span>·</span>
                    <span>{trip.items.length} events</span>
                    {totalBudget > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
                          {formatCurrency(totalBudget, currency)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/6 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => openTripInPlanner(trip)}
                    className="btn-primary text-xs py-1.5 px-3.5 whitespace-nowrap cursor-pointer"
                  >
                    Open Timeline
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTrip(trip);
                      setScreen('review', trip.id);
                    }}
                    className="text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer whitespace-nowrap"
                  >
                    Review &amp; Packing
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4 border-t border-black/8 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <OutabelLogo className="w-5 h-5" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Outabel</span>
          <span>·</span>
          <span>Stored locally in your browser</span>
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setScreen('wizard')}
            className="hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
          >
            New Trip
          </button>
          <button
            type="button"
            onClick={() => setScreen('trips')}
            className="hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
          >
            My Trips
          </button>
          <button
            type="button"
            onClick={() => setScreen('settings')}
            className="inline-flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
