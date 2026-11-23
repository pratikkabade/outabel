import { CalendarCategoryOption, TripPace } from '../types/trip';
import { CURRENCIES, CurrencyCode, formatCurrency } from './currency';
import { getDayDate } from './time';

export interface GenAIPromptConfig {
  from: string;
  to: string;
  startDate: string;
  numDays: number;
  budget: number;
  currency: CurrencyCode;
  wakeTime: string;
  dailyStartTime: string;
  pace: TripPace;
  calendarCategories: CalendarCategoryOption[];
}

const PACE_DESCRIPTIONS: Record<TripPace, string> = {
  relaxed: 'Relaxed & unhurried (2-3 activities per day, generous dining and afternoon rest buffers)',
  balanced: 'Balanced & thoughtful (3-5 items per day, steady rhythm with breathing room)',
  packed: 'Packed & immersive (5-7 items per day, maximizing sights from morning through evening)',
};

const REALISTIC_PRICING_HINTS: Record<CurrencyCode, string> = {
  INR: 'Realistic Indian market rates: domestic flights ₹4,500–₹9,500 one-way, express trains ₹600–₹2,800, intercity AC buses ₹700–₹1,800, mid-range hotels ₹2,500–₹6,500/night, local meals ₹250–₹900, attraction tickets ₹100–₹800.',
  USD: 'Realistic US/international rates: domestic flights $140–$380 one-way, trains/buses $35–$120, mid-range hotels $110–$260/night, meals $18–$55, attraction tickets $15–$45.',
  EUR: 'Realistic European rates: intra-Europe flights €70–€220, high-speed trains €35–€130, mid-range hotels €95–€220/night, meals €15–$45, attraction tickets €12–€35.',
  GBP: 'Realistic UK rates: flights £65–£200, rail £30–£110, mid-range hotels £95–£210/night, meals £15–£45, attraction tickets £12–£35.',
  JPY: 'Realistic Japan rates: domestic flights ¥12,000–¥28,000, Shinkansen ¥8,000–¥16,000, business/mid hotels ¥9,000–¥22,000/night, meals ¥1,200–¥4,000, entry fees ¥500–¥2,500.',
};

export const buildGenAIItineraryPrompt = (config: GenAIPromptConfig): string => {
  const {
    from,
    to,
    startDate,
    numDays,
    budget,
    currency,
    wakeTime,
    dailyStartTime,
    pace,
    calendarCategories,
  } = config;

  const currencyCfg = CURRENCIES[currency] || CURRENCIES.INR;
  const budgetText =
    budget > 0
      ? `${formatCurrency(budget, currency)} (${currencyCfg.code} total for all ${numDays} days)`
      : `Flexible realistic mid-range (${currencyCfg.code})`;

  const dayList = Array.from({ length: Math.max(1, numDays) }, (_, idx) => {
    const dayNum = idx + 1;
    const d = getDayDate(startDate, dayNum);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    return `  - Day ${dayNum}: ${yyyy}-${mm}-${dd} (${weekday})`;
  }).join('\n');

  const categoryIds = calendarCategories.map((c) => c.id.toUpperCase()).join(', ');
  const sampleDate1 = startDate.replace(/-/g, '');
  const sampleNextDate = (() => {
    const d = getDayDate(startDate, Math.min(2, Math.max(1, numDays)));
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  })();

  const sampleTransitCost = currency === 'INR' ? '1450' : currency === 'JPY' ? '8500' : '65';
  const sampleMealCost = currency === 'INR' ? '550' : currency === 'JPY' ? '1800' : '24';
  const sampleStayCost = currency === 'INR' ? '3800' : currency === 'JPY' ? '14000' : '145';

  return `Act as an expert local travel planner and logistics coordinator. Create a realistic, specific ${numDays}-day travel itinerary from "${from}" to "${to}" and output it as a valid iCalendar (.ics) file ready for import.

TRIP PARAMETERS:
- Departure Origin: ${from}
- Destination: ${to}
- Start Date: ${startDate}
- Duration: ${numDays} days
${dayList}
- Target Total Budget: ${budgetText}
- Currency: ${currencyCfg.code} (in DESCRIPTION, write plain numeric amounts like "Cost: ${sampleMealCost}" with NO currency symbols or commas)
- Wake-up Time: ${wakeTime} | Daily Start Time: ${dailyStartTime}
- Travel Pace: ${PACE_DESCRIPTIONS[pace]}

CRITICAL REALISM & ACCURACY RULES (DO NOT VIOLATE):
1. REALISTIC TRANSPORT & FARES: Choose transport modes (flight, train, car, bus, ferry) that genuinely operate between "${from}" and "${to}" and match real travel durations and real market fares.
   - ${REALISTIC_PRICING_HINTS[currency]}
   - NEVER invent unrealistically cheap tickets (e.g., never price a flight at ₹900 or $15). If flights do not make sense for the distance or exceed the budget, choose an actual train, AC bus, or road drive instead—and if the total budget is tight for the requested trip, prioritize realistic ground transit and budget stays rather than fake low ticket prices.
2. SPECIFIC REAL PLACES (NO VAGUE PLACEHOLDERS):
   - Every SUMMARY and LOCATION must name real, well-known places, neighborhoods, restaurants, stations/airports, and landmarks in or near "${to}" (never write vague labels like "Local Bistro", "Town Center", or "Planned Activity").
   - Include actual street/area names in LOCATION so Google Maps links resolve accurately.
3. REALISTIC TIMING & ZERO OVERLAPS:
   - Cover every day from Day 1 to Day ${numDays} using the exact YYYYMMDD dates above.
   - Include outbound travel on Day 1, realistic check-in / check-out (Type: STAY), local meals (breakfast/lunch/dinner), timed sightseeing (Type: ACTIVITY), rest buffers (Type: BUFFER), and return transit on Day ${numDays}.
   - Leave realistic commute time between distant locations and ensure no two events overlap.
4. BUDGET CHECK BEFORE OUTPUTTING:
   - Assign realistic Cost values on paid items (transit, stay per night, meals, paid tickets; 0 or omit for free walks/rests).
   - Verify the sum of all Cost values across the entire .ics file aligns sensibly with ${budgetText}.
5. ALLOWED TYPE VALUES:
   - Use ONLY these exact Type values in DESCRIPTION: ${categoryIds || 'TRAVEL, STAY, FOOD, ACTIVITY, BUFFER, NOTE'}.
   - Valid Mode values for TRAVEL items: flight, train, car, bus, ferry, walk, rideshare.

REQUIRED OUTABEL .ICS STRUCTURE (match this exact format):
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Outabel//The Trip Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${to} Itinerary
BEGIN:VEVENT
UID:item-1-day1@outabel.app
DTSTAMP:${sampleDate1}T090000Z
DTSTART:${sampleDate1}T${dailyStartTime.replace(':', '')}00
DTEND:${sampleDate1}T123000
SUMMARY:Morning Intercity Transit to ${to}
LOCATION:${from} Junction / Main Terminal
DESCRIPTION:Type: TRAVEL\\nCost: ${sampleTransitCost}\\nMode: train\\nRoute: ${from} -> ${to}\\nNotes: Direct morning departure; reserve window seats in advance.
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:item-2-day1@outabel.app
DTSTAMP:${sampleDate1}T090000Z
DTSTART:${sampleDate1}T130000
DTEND:${sampleDate1}T140000
SUMMARY:Check-in at Heritage Courtyard Hotel
LOCATION:Main Beach Road, ${to}
DESCRIPTION:Type: STAY\\nCost: ${sampleStayCost}\\nNotes: Check-in for ${Math.max(1, numDays - 1)} nights (nightly rate shown or split per night).
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:item-3-day2@outabel.app
DTSTAMP:${sampleDate1}T090000Z
DTSTART:${sampleNextDate}T130000
DTEND:${sampleNextDate}T141500
SUMMARY:Lunch at Famous Regional Kitchen
LOCATION:Old Quarter Market, ${to}
DESCRIPTION:Type: FOOD\\nCost: ${sampleMealCost}\\nNotes: Known for authentic regional specialties and fresh local dishes.
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR

OUTPUT INSTRUCTION:
Provide a downloadable .ics file OR output ONLY the complete, valid raw .ics content inside a single \`\`\`ics code block (starting with BEGIN:VCALENDAR and ending with END:VCALENDAR) with no extra commentary inside the block.`;
};
