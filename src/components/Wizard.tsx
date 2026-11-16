import React, { useState } from 'react';
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
  Coffee
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { TripPace } from '../types/trip';

export const Wizard: React.FC = () => {
  const { createTrip, setScreen } = useTrip();

  const [step, setStep] = useState<number>(0);
  const [from, setFrom] = useState<string>('San Francisco');
  const [to, setTo] = useState<string>('Tokyo & Kyoto, Japan');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [numDays, setNumDays] = useState<number>(5);
  const [wakeTime, setWakeTime] = useState<string>('07:30');
  const [dailyStartTime, setDailyStartTime] = useState<string>('09:00');
  const [pace, setPace] = useState<TripPace>('balanced');

  const totalSteps = 7;

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
      setScreen('home');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

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
                  placeholder="e.g. San Francisco (SFO), London, New York"
                  className="input text-lg py-3 px-4"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {['San Francisco', 'New York', 'London', 'Tokyo', 'Sydney', 'Paris'].map((city) => (
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
                  placeholder="e.g. Kyoto & Tokyo, Japan or Amalfi Coast, Italy"
                  className="input text-lg py-3 px-4"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Tokyo, Japan', 'Paris, France', 'Rome & Florence', 'Reykjavik, Iceland', 'Kyoto & Osaka'].map((dest) => (
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
