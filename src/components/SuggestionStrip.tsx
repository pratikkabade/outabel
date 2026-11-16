import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { generateSuggestionsForDay } from '../utils/suggestions';
import { addMinutesToTime } from '../utils/time';

interface SuggestionStripProps {
  day: number;
}

export const SuggestionStrip: React.FC<SuggestionStripProps> = ({ day }) => {
  const { currentTrip, openAddModal } = useTrip();

  if (!currentTrip) return null;

  const suggestions = generateSuggestionsForDay(day, currentTrip);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
        <Sparkles className="w-3 h-3 text-blue-500" />
        <span>Suggested next steps</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((sug) => (
          <button
            key={sug.id}
            type="button"
            onClick={() => {
              openAddModal(day, {
                type: sug.type,
                title: sug.defaultTitle,
                day,
                start: sug.defaultTime,
                end: addMinutesToTime(sug.defaultTime, sug.defaultDurationMinutes),
                ...sug.metadata,
              });
            }}
            title={sug.contextReason}
            className="chip text-[11px] py-1 px-2.5 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{sug.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
