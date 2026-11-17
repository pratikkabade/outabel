import { jsPDF } from 'jspdf';
import { CalendarCategoryOption, PackingCategoryOption, Trip } from '../types/trip';
import { CurrencyCode, formatCurrency } from './currency';
import {
  formatDayDate,
  formatDayOfWeek,
  formatDuration,
  formatTimeDisplay,
  getDurationMinutes,
} from './time';
import {
  DEFAULT_PACKING_CATEGORIES,
  resolvePackingCategory,
} from './packingCategories';
import {
  DEFAULT_CALENDAR_CATEGORIES,
  resolveCalendarCategory,
} from './calendarCategories';

const formatCurrencySafe = (amount: number, currency: CurrencyCode): string => {
  if (currency === 'INR') {
    return `INR ${Math.round(amount).toLocaleString()}`;
  }
  return formatCurrency(amount, currency);
};

export const exportTripPDF = (
  trip: Trip,
  currency: CurrencyCode = 'USD',
  use12h: boolean = true,
  packingCategories: PackingCategoryOption[] = DEFAULT_PACKING_CATEGORIES,
  calendarCategories: CalendarCategoryOption[] = DEFAULT_CALENDAR_CATEGORIES
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 46;

  let y = 44;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = 44;
    }
  };

  // --- Title Header ---
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 68, 8, 8, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(trip.title, margin + 16, y + 25, { maxWidth: contentWidth - 32 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);

  const totalCost = trip.items.reduce((acc, item) => acc + (item.cost || 0), 0);
  const packingList = trip.packingList || [];

  const metaLine = `${trip.from} -> ${trip.to}   |   ${trip.numDays} Days   |   Starts ${trip.startDate}`;
  doc.text(metaLine, margin + 16, y + 43, { maxWidth: contentWidth - 32 });

  const statsLine = `${trip.items.length} Scheduled Events   |   Est. Total: ${formatCurrencySafe(
    totalCost,
    currency
  )}   |   ${packingList.length} Packing Items`;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(statsLine, margin + 16, y + 57, { maxWidth: contentWidth - 32 });

  y += 88;

  // --- Section 1: Daily Flow ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Daily Flow Itinerary', margin, y);
  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + contentWidth, y);
  y += 16;

  for (let d = 1; d <= trip.numDays; d++) {
    const dayItems = trip.items
      .filter((item) => item.day === d)
      .sort((a, b) => a.start.localeCompare(b.start));

    const dateStr = formatDayDate(trip.startDate, d);
    const dow = formatDayOfWeek(trip.startDate, d);
    const dayCost = dayItems.reduce((acc, item) => acc + (item.cost || 0), 0);

    ensureSpace(56);

    // Day Header Banner
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 26, 5, 5, 'FD');

    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin + 8, y + 5, 24, 16, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`D${d}`, margin + 20, y + 16, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${dow}, ${dateStr}`, margin + 40, y + 16.5);

    const dayRightLabel =
      dayCost > 0
        ? `${dayItems.length} items  |  ${formatCurrencySafe(dayCost, currency)}`
        : `${dayItems.length} item${dayItems.length === 1 ? '' : 's'}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(dayRightLabel, margin + contentWidth - 10, y + 16.5, { align: 'right' });

    y += 34;

    if (dayItems.length === 0) {
      ensureSpace(24);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('No events scheduled for this day.', margin + 10, y + 8);
      y += 24;
      continue;
    }

    for (const item of dayItems) {
      const resolved = resolveCalendarCategory(item.type, calendarCategories);
      const durationMin = getDurationMinutes(item.start, item.end);
      const timeRange = `${formatTimeDisplay(item.start, use12h)} - ${formatTimeDisplay(
        item.end,
        use12h
      )} (${formatDuration(durationMin)})`;

      const titleLines: string[] = doc.splitTextToSize(item.title, contentWidth - 26);
      const locationLines: string[] = item.location
        ? doc.splitTextToSize(`Location: ${item.location}`, contentWidth - 26)
        : [];
      const notesLines: string[] = item.notes
        ? doc.splitTextToSize(item.notes, contentWidth - 26)
        : [];

      const cardHeight =
        24 +
        titleLines.length * 13 +
        (locationLines.length > 0 ? locationLines.length * 11 + 3 : 0) +
        (notesLines.length > 0 ? notesLines.length * 11 + 4 : 0) +
        6;

      ensureSpace(cardHeight + 6);

      // Card Fill & Left Accent Bar
      doc.setFillColor(...resolved.style.rgbFill);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, 'F');
      doc.setFillColor(...resolved.style.rgbAccent);
      doc.rect(margin, y, 3.5, cardHeight, 'F');

      // Row 1: Time + Category + Cost
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...resolved.style.rgbAccent);
      doc.text(`${timeRange}   |   ${resolved.label.toUpperCase()}`, margin + 12, y + 14);

      if (item.cost && item.cost > 0) {
        doc.setTextColor(30, 41, 59);
        doc.text(formatCurrencySafe(item.cost, currency), margin + contentWidth - 10, y + 14, {
          align: 'right',
        });
      }

      // Row 2: Title
      let textY = y + 29;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(titleLines, margin + 12, textY);
      textY += titleLines.length * 13;

      // Row 3: Location
      if (locationLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(locationLines, margin + 12, textY);
        textY += locationLines.length * 11 + 3;
      }

      // Row 4: Notes
      if (notesLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(notesLines, margin + 12, textY);
      }

      y += cardHeight + 7;
    }

    y += 8;
  }

  // --- Section 2: Packing Checklist (always starts on a new page, all items unchecked) ---
  doc.addPage();
  y = 44;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`Packing Checklist (${packingList.length} Items)`, margin, y);
  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + contentWidth, y);
  y += 14;

  if (packingList.length === 0) {
    ensureSpace(24);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No packing items added yet.', margin + 4, y + 10);
  } else {
    for (const packItem of packingList) {
      const resolved = resolvePackingCategory(packItem.category, packingCategories);
      const textLines: string[] = doc.splitTextToSize(packItem.text, contentWidth - 120);
      const rowHeight = Math.max(24, textLines.length * 12 + 10);

      ensureSpace(rowHeight + 4);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, rowHeight, 4, 4, 'FD');

      // Left category accent bar
      doc.setFillColor(...resolved.style.rgbAccent);
      doc.rect(margin, y, 3, rowHeight, 'F');

      // Always render unchecked box
      const boxX = margin + 12;
      const boxY = y + rowHeight / 2 - 5;
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(1);
      doc.roundedRect(boxX, boxY, 10, 10, 2, 2, 'S');

      // Item text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(textLines, margin + 30, y + 15);

      // Category label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...resolved.style.rgbAccent);
      doc.text(resolved.label.toUpperCase(), margin + contentWidth - 10, y + 15, {
        align: 'right',
      });

      y += rowHeight + 5;
    }
  }

  // --- Footer Page Numbers ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Outabel Trip Itinerary  ·  Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  const safeTitle = trip.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  doc.save(`${safeTitle}_itinerary.pdf`);
};
