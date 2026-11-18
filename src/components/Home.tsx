import React from 'react';
import { 
  ArrowRight, 
  Compass, 
  Sparkles, 
  Clock, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Share2, 
  Car, 
  Hotel, 
  UtensilsCrossed 
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { formatCurrency } from '../utils/currency';
import { SAMPLE_TRIPS } from '../utils/sampleData';
import { OutabelLogo } from './OutabelLogo';

export const Home: React.FC = () => {
  const { setScreen, loadSampleTrip, currency } = useTrip();

  return (
    <div className="relative z-10 w-full min-h-screen pb-24 overflow-hidden">
      <section id="overview" className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-3.5 mb-5">
              <OutabelLogo className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md" />
              <div className="text-left">
                <div className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none">
                  Outabel
                </div>
                <div className="text-[11px] font-semibold tracking-wide uppercase text-blue-600 dark:text-blue-400 mt-1">
                  Next-Generation Travel Design · 100% Offline
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.08] mb-6">
              Travel itineraries crafted with clarity, fluidity, and rhythm.
            </h1>

            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
              Outabel transforms scattered bookings and chaotic notes into a calm, horizontal liquid glass timeline. Compose your days with sensible pacing, smart rule-based guidance, and instant calendar export.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                type="button"
                onClick={() => setScreen('wizard')}
                className="btn-primary text-base py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => loadSampleTrip()}
                className="btn-ghost text-base py-3 px-6 rounded-2xl cursor-pointer"
              >
                <span>Browse 3 India Templates</span>
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2">
              {SAMPLE_TRIPS.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => loadSampleTrip(tpl.id)}
                  className="chip text-xs py-1 px-2.5 cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <span>{tpl.from.split(',')[0].split(' (')[0]} → {tpl.to.split(',')[0].split(' & ')[0]} ({tpl.numDays}d)</span>
                </button>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero cloud tracking</span>
              </div>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Intelligent gap warnings</span>
              </div>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>Apple & Google Calendar sync</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="glass-card p-6 sm:p-8 relative overflow-hidden border border-black/10 dark:border-white/10 shadow-lg">
              <div className="flex items-center justify-between pb-5 border-b border-black/5 dark:border-white/10 mb-6">
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Day 1 of 4 · Friday, Dec 4</div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white">Sangli to Malvan Coastal Drive</div>
                </div>
                <div className="chip text-xs">
                  <span>Balanced Pace</span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start gap-3.5 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Car className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">Phonda Ghat Drive to Tarkarli</div>
                      <span className="text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400 shrink-0">08:45 – 12:00</span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">Kolhapur → Malvan via Radhanagari &amp; Kasal</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start gap-3.5 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Hotel className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">Check-in: Tarkarli Beachfront Resort</div>
                      <span className="text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400 shrink-0">12:15 – 13:00</span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">Tarkarli, Malvan · Bill settled at check-out</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start gap-3.5 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">Malvani Surmai Thali at Chaitanya</div>
                      <span className="text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400 shrink-0">13:30 – 14:45</span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">Malvan Town · Amboli, Solkadhi &amp; fresh catch</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Timeline harmonized · No schedule conflicts</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                  Day 1 Est. {formatCurrency(2300, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/5 dark:border-white/10">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-semibold tracking-wide uppercase text-blue-600 dark:text-blue-400 mb-2">What This App Is</div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">
            A sanctuary for calm, deliberate travel planning.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-base leading-relaxed">
            Most travel tools burden you with noisy ads, rigid templates, and bloated feature sets. Outabel strips away the noise to provide a serene digital drafting canvas. It respects your time, aligns with your natural travel pace, and keeps your entire itinerary stored safely in your own browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border border-black/5 dark:border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Human Rhythm First</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Configure your personal wake-up hour, daily start time, and preferred travel pace. The itinerary adapts seamlessly to prevent exhaustion and overscheduling.
            </p>
          </div>

          <div className="glass-card p-6 border border-black/5 dark:border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Zero-API Smart Rules</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Enjoy one-tap context chips that anticipate your logical next step: suggesting luggage drop-off after flights, dinner windows around dusk, or buffers after long excursions.
            </p>
          </div>

          <div className="glass-card p-6 border border-black/5 dark:border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Direct Sync Everywhere</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Export whole-trip standard .ics files compatible with Apple Calendar and Microsoft Outlook, or fire individual events directly into Google Calendar with zero friction.
            </p>
          </div>
        </div>
      </section>

      <section id="workflow" className="max-w-6xl mx-auto px-6 py-16 border-t border-black/5 dark:border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-semibold tracking-wide uppercase text-blue-600 dark:text-blue-400 mb-2">Effortless Workflow</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">
            Three simple steps from dream to departure.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-base">
            No endless configuration forms. Answer three focused questions and begin organizing your days immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="glass-card p-8 border border-black/5 dark:border-white/10 relative">
            <div className="text-4xl font-bold font-mono text-blue-600/20 dark:text-blue-400/20 mb-4">01</div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Set Route & Pace</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
              Enter your departure, destination, and trip span. Choose whether your style is relaxed, balanced, or packed, along with your preferred morning start time.
            </p>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
              <span>Interactive one-question wizard</span>
              <span aria-hidden="true">·</span>
              <span>Smooth animations</span>
            </div>
          </div>

          <div className="glass-card p-8 border border-black/5 dark:border-white/10 relative">
            <div className="text-4xl font-bold font-mono text-blue-600/20 dark:text-blue-400/20 mb-4">02</div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Craft on the Timeline</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
              Glide across days or check the left-hand overview accordion. Add flights, hotels, food, activities, or buffer windows with instant conflict detection.
            </p>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
              <span>Horizontal day axis</span>
              <span aria-hidden="true">·</span>
              <span>Drag-and-drop between days</span>
            </div>
          </div>

          <div className="glass-card p-8 border border-black/5 dark:border-white/10 relative">
            <div className="text-4xl font-bold font-mono text-blue-600/20 dark:text-blue-400/20 mb-4">03</div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Export & Take Off</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
              Review your entire trip on a synchronized monthly or weekly calendar. Download universal .ics schedules, batch push to Google Calendar, and check packing lists.
            </p>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
              <span>Google Calendar batch importer</span>
              <span aria-hidden="true">·</span>
              <span>Print-friendly sheets</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="glass-card p-10 sm:p-14 border border-black/5 dark:border-white/10 relative overflow-hidden">
          <div className="max-w-xl mx-auto">
            <OutabelLogo className="w-14 h-14 mx-auto mb-5 drop-shadow-md" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">
              Begin planning your next journey now.
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-base mb-8">
              Experience the clarity of fluid horizontal planning. Set your pace, drop your destinations, and enjoy the journey.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setScreen('wizard')}
                className="btn-primary text-base py-3 px-8 rounded-2xl shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                <span>Launch Trip Wizard</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <button
                type="button"
                onClick={() => loadSampleTrip()}
                className="btn-ghost text-base py-3 px-8 rounded-2xl cursor-pointer"
              >
                <span>Open Sample Itineraries</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 pt-12 pb-6 border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <OutabelLogo className="w-6 h-6" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Outabel</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Private & Offline LocalStorage</span>
          <span>·</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
};
