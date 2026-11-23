import React from 'react';
import { 
  MapPin, 
  Trash2, 
  Copy, 
  Edit3, 
  Calendar,
  AlertTriangle,
  GripVertical,
  Ticket,
  Paperclip
} from 'lucide-react';
import { ItineraryItem } from '../types/trip';
import { useTrip } from '../context/TripContext';
import { openGoogleCalendar } from '../utils/gcal';
import { formatDuration, getDurationMinutes } from '../utils/time';
import { formatCurrency } from '../utils/currency';
import { resolveCalendarCategory } from '../utils/calendarCategories';

interface ItemCardProps {
  item: ItineraryItem;
  conflictWarning?: string;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  conflictWarning,
}) => {
  const { openAddModal, deleteItem, duplicateItem, currentTrip, calendarCategories, currency } = useTrip();

  const durationMin = getDurationMinutes(item.start, item.end);
  const { style, icon: Icon } = resolveCalendarCategory(item.type, calendarCategories);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="relative group/card transition-all">
      {conflictWarning && (
        <div className="mb-2 p-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/35 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="truncate">{conflictWarning}</span>
        </div>
      )}

      <div 
        className={`p-3.5 sm:p-4 rounded-2xl backdrop-blur-xl transition-all shadow-xs ${style.bg} ${style.hoverBg} ${style.border} ${
          conflictWarning ? 'ring-1 ring-amber-500/60' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2.5 mb-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div 
              draggable={true}
              onDragStart={handleDragStart}
              title="Drag to move to another day"
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 cursor-grab active:cursor-grabbing transition-colors mt-0.5 shrink-0"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${style.badge}`}>
              <Icon className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                {item.title}
              </h4>

              <div className="mt-1 space-y-0.5">
                <div className="text-xs font-mono tabular-nums font-semibold text-neutral-800 dark:text-neutral-200">
                  {item.start} – {item.end}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Duration: {formatDuration(durationMin)}
                </div>
              </div>
            </div>
          </div>

          <div className="opacity-0 group-hover/card:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity duration-150">
            {currentTrip && (
              <button
                type="button"
                onClick={() => openGoogleCalendar(item, currentTrip)}
                title="Add to Google Calendar"
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-neutral-500 hover:text-blue-500 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => duplicateItem(item.id)}
              title="Duplicate item"
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => openAddModal(item.day, undefined, item)}
              title="Edit item"
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => deleteItem(item.id)}
              title="Delete item"
              className="p-1 rounded-lg hover:bg-red-500/15 text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {item.location && (
          <div className="mt-2 pt-1">
            <a
              href={`https://maps.google.co.in/?q=${encodeURIComponent(item.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`View "${item.location}" on Google Maps`}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline max-w-full truncate cursor-pointer font-medium"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-500" />
              <span className="truncate">{item.location}</span>
            </a>
          </div>
        )}

        {(item.providerName || item.terminalOrPlatform || item.confirmationNumber || (item.attachments && item.attachments.length > 0)) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-700 dark:text-neutral-300">
            {item.providerName && (
              <span className="font-medium truncate">{item.providerName}</span>
            )}
            {item.terminalOrPlatform && (
              <span className="text-neutral-500 dark:text-neutral-400 truncate">
                {item.terminalOrPlatform}
              </span>
            )}
            {item.confirmationNumber && (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-blue-600 dark:text-blue-400">
                <Ticket className="w-3 h-3 shrink-0" />
                <span>{item.confirmationNumber}</span>
              </span>
            )}
            {item.attachments && item.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-300 font-medium">
                <Paperclip className="w-3 h-3 shrink-0" />
                <span>{item.attachments.length} file{item.attachments.length > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
        )}

        {item.notes && (
          <div className="text-xs text-neutral-700 dark:text-neutral-300 mt-2 bg-black/[0.04] dark:bg-white/[0.05] p-2 rounded-xl leading-relaxed">
            {item.notes}
          </div>
        )}

        {(item.cost !== undefined && item.cost > 0) && (
          <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-medium">Est. Cost</span>
            <span className="font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
              {formatCurrency(item.cost, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
