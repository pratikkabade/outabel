import React from 'react';
import { TripProvider, useTrip } from './context/TripContext';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Wizard } from './components/Wizard';
import { Timeline } from './components/Timeline';
import { CalendarView } from './components/CalendarView';
import { TripsList } from './components/TripsList';
import { AddItemModal } from './components/AddItemModal';
import { ProfileModal } from './components/ProfileModal';

const MainContent: React.FC = () => {
  const { screen, toast } = useTrip();

  return (
    <div className={`relative flex flex-col ${screen === 'planner' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <div className="mesh-canvas" />
      <Navbar />

      <main className={`flex-1 flex flex-col ${screen === 'planner' ? 'min-h-0 overflow-hidden' : ''}`}>
        {screen === 'home' && <Home />}
        {screen === 'wizard' && <Wizard />}
        {screen === 'planner' && <Timeline />}
        {screen === 'review' && <CalendarView />}
        {screen === 'trips' && <TripsList />}
      </main>

      <AddItemModal />
      <ProfileModal />

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="glass px-4 py-2 rounded-2xl shadow-xl border border-black/10 dark:border-white/15 text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <TripProvider>
      <MainContent />
    </TripProvider>
  );
}
