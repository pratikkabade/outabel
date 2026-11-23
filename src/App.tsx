import React, { useLayoutEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Undo2, X } from 'lucide-react';
import { TripProvider, useTrip } from './context/TripContext';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Wizard } from './components/Wizard';
import { Timeline } from './components/Timeline';
import { CalendarView } from './components/CalendarView';
import { TripsList } from './components/TripsList';
import { AddItemModal } from './components/AddItemModal';
import { SettingsPage } from './components/SettingsPage';

const MainContent: React.FC = () => {
  const { screen, toast, dismissToast, undo, canUndo } = useTrip();
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className={`relative flex flex-col ${screen === 'planner' ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
      <div className="mesh-canvas" />
      <Navbar />

      <main className={`flex-1 flex flex-col ${screen === 'planner' ? 'min-h-0 overflow-hidden' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<Wizard />} />
          <Route path="/new/step/:stepNumber" element={<Wizard />} />
          <Route path="/new/import-warning" element={<Wizard />} />
          <Route path="/planner" element={<Timeline />} />
          <Route path="/planner/:tripId" element={<Timeline />} />
          <Route path="/review" element={<CalendarView />} />
          <Route path="/review/:tripId" element={<CalendarView />} />
          <Route path="/trips" element={<TripsList />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <AddItemModal />

      {toast && screen !== 'planner' && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100%-1.5rem)] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto bg-neutral-900/95 dark:bg-[#1e2430]/95 text-white px-3.5 py-2 rounded-xl shadow-xl border border-white/15 backdrop-blur-md text-xs font-medium flex items-center gap-2.5"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <span className="truncate">{toast.message}</span>
            {toast.undoable && canUndo && (
              <button
                type="button"
                onClick={undo}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/35 text-blue-300 font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss alert"
              title="Dismiss"
              className="p-1 rounded-lg hover:bg-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <TripProvider>
        <MainContent />
      </TripProvider>
    </BrowserRouter>
  );
}
