/**
 * v0.45.2 (Noah on the bike: "zu wenig Luft, Sattel zu tief, Schaltung vorne laden"): several
 * problems with one bike at once, from the + menu. One line = one problem = one open repair in
 * Bike care, written as the Inbox does when a note is sorted as "Repair" (notes.js sortNote).
 * Noah 1a 2b 3b: the app sorts each problem itself into a way to fix it (one tap to change),
 * gives the first step, sends shop jobs to the workshop order and parts to the wishlist
 * (the shopping list), and after the same problem twice in 30 days proposes a lasting fix.
 * Pure, tested in tests/problems.test.js.
 */
import { newNote, sortNote, nextNumber } from './notes.js';

/** The quick buttons: the English text is the key for t(), it is also the stored text. */
export const QUICK_PROBLEMS = ['Too little air in the tyres', 'Saddle too low', 'Charge the shifting battery', 'Brake rubs or squeaks', 'Chain dry or noisy', 'Creaks or rattles'];

/** Noah (9.10.2026): every problem has a priority (required) and may have a deadline. */
export const PRIORITIES = ['high', 'medium', 'low'];
export const PRIORITY_NAME = { high: 'High', medium: 'Medium', low: 'Low' };

/** The deadline of a repair as a date: its own date, else the start of the next ride when "before the next ride". */
export function deadlineOf(repair, nextRideDate = null) {
  if (repair.dueDate) return repair.dueDate;
  return repair.beforeRide ? nextRideDate : null;
}

/** Late: the deadline is before today. */
export const isLate = (repair, today, nextRideDate = null) => {
  const d = deadlineOf(repair, nextRideDate);
  return !!d && d < today;
};

/** The ways to fix a problem. 'guide' links to a workshop guide once D2 has them. */
export const FIXES = {
  self: 'Myself, quick',
  guide: 'Myself, with a guide',
  shop: 'Bike shop',
  part: 'Part needed',
};

/**
 * What the app knows about common problems: words (German and English) → topic, way to fix,
 * the bike part it belongs to, the first step, and the lasting fix when it comes back.
 * The first matching rule wins, so the specific ones come first.
 */
export const TOPICS = [
  { key: 'battery', words: /akku|batter|laden|aufladen|charge|di2|axs|etap/i, fix: 'self', part: 'drivetrain',
    step: 'Charge the battery the evening before the ride.', repeat: 'The battery was empty again: charge it before every ride, or let the bike shop test the battery.' },
  { key: 'air', words: /luft|druck|pressure|reifen|tyre|\btires?\b|schlauch|\bair\b|platt|flat|pumpen|pump/i, fix: 'self', part: 'tyres',
    step: 'Pump to your pressure and check the valve.', repeat: 'Loses air again: check sealant, valve core and the tyre for a leak.' },
  { key: 'saddle', words: /sattel|saddle|sattelstütze|seatpost|sitz/i, fix: 'self', part: 'cockpit',
    step: 'Set the saddle height, then mark the seatpost.', repeat: 'The saddle moved again: check the clamp torque and use carbon paste.' },
  { key: 'brake', words: /brems|brake|belag|beläge|pads?\b|scheibe|rotor|quietsch|squeak/i, fix: 'guide', part: 'brakes',
    step: 'Check pad wear, then centre the caliper.', repeat: 'The brake again: check pads and rotor; if the lever feels soft, have it bled.' },
  { key: 'chain', words: /kette|chain/i, fix: 'self', part: 'chain',
    step: 'Clean the chain, wax or lube it, and measure the wear.', repeat: 'The chain again: measure the wear; at 0.5 % replace it.' },
  { key: 'shifting', words: /schalt|shift|\bg(ang|änge)\b|umwerfer|schaltwerk|derailleur|springt/i, fix: 'guide', part: 'drivetrain',
    step: 'Check the hanger and adjust the shifting.', repeat: 'Shifting again: let the bike shop check hanger and cable or the Di2 setting.' },
  { key: 'noise', words: /knack|knarz|klapper|klack|creak|rattle|geräusch|noise/i, fix: 'guide', part: 'bolts',
    step: 'Check the bolts with the torque wrench, then bottom bracket and headset.', repeat: 'The noise came back: let the bike shop check bottom bracket, headset and the rear linkage.' },
  { key: 'wheel', words: /speiche|spoke|felge|\brim\b|nabe|\bhub\b|lager|bearing|federgabel|gabel|fork|dämpfer|shock/i, fix: 'shop', part: null,
    step: 'Ask the bike shop.', repeat: 'This came back: ask the bike shop for a lasting fix.' },
];

/** Words that say a part has to be bought. */
const PART_WORDS = /kaputt|gebrochen|gerissen|riss|defekt|ersetzen|austauschen|neu(e|er|es)? (kaufen|bestellen)|broken|cracked|torn|replace|worn out/i;
/** Words that say the bike shop does it. */
const SHOP_WORDS = /werkstatt|velomech|mechaniker|bike ?shop|service|entlüften|bleed/i;

/** A problem's text → { topic, fix, part }: the app's own guess; topic null when nothing fits. */
export function classify(text) {
  const s = String(text ?? '');
  const topic = TOPICS.find((x) => x.words.test(s)) ?? null;
  const fix = PART_WORDS.test(s) ? 'part' : SHOP_WORDS.test(s) ? 'shop' : topic?.fix ?? 'self';
  return { topic: topic?.key ?? null, fix, part: topic?.part ?? null };
}

export const topicOf = (key) => TOPICS.find((x) => x.key === key) ?? null;

/** The first step for a repair: the topic's step for 'self'/'guide', a fixed line for shop and part. */
export function stepFor(repair) {
  if (repair.fix === 'shop') return 'Goes into the order for the bike shop.';
  if (repair.fix === 'part') return 'On the wishlist: buy the part, then fit it.';
  return topicOf(repair.topic)?.step ?? null;
}

/**
 * Noah 3b: the same problem twice within 30 days on one bike → the lasting fix.
 * repairs: all of this bike's repairs (any status, the new ones included). → [{ topic, count, text }]
 */
export function repeats(repairs, bikeId, today, { days = 30, min = 2 } = {}) {
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - days);
  const since = from.toISOString().slice(0, 10);
  const count = {};
  for (const r of repairs) {
    if (r.bikeId !== bikeId || !r.topic || (r.logDate ?? '') < since) continue;
    count[r.topic] = (count[r.topic] ?? 0) + 1;
  }
  return Object.entries(count).filter(([, n]) => n >= min).map(([topic, n]) => ({ topic, count: n, text: topicOf(topic)?.repeat ?? '' }));
}

/** A wishlist item for a problem that needs a part, never twice for the same text. */
export function problemWish(repair, bike, items, id, now = new Date().toISOString()) {
  const name = `${repair.task} (${bike.name})`;
  if (items.some((i) => i.name === name && i.ownership === 'wishlist')) return null;
  return {
    id, name, brand: '', model: '', category: 'bike', weightG: null, qty: 1, weightStatus: 'missing', carry: 'bike',
    defaultBag: 'tool', ownership: 'wishlist', role: null, sets: [], kits: [], domains: ['bikepacking'], priceChf: null,
    note: `From a problem on the ${bike.name} (${repair.logDate}): ${repair.task}`, updatedAt: now,
  };
}

/** "- a\n2. b\n\n• c" → ['a', 'b', 'c']: one problem per line, list marks and blank lines dropped, doubles once. */
export function splitProblems(text) {
  const seen = new Set();
  const out = [];
  for (const raw of String(text ?? '').split(/\r?\n|;/)) {
    const line = raw.replace(/^\s*(?:[-–•*·]|\d{1,2}[.)])\s*/, '').trim();
    const key = line.toLowerCase();
    if (!line || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

/** Add a quick problem as its own line, unless it is already there. */
export function addLine(text, line) {
  const lines = splitProblems(text);
  if (lines.some((l) => l.toLowerCase() === line.toLowerCase())) return text;
  const base = String(text ?? '').replace(/\s+$/, '');
  return base ? `${base}\n${line}` : line;
}

/** The bike to start with: the one of the trip running today, else the last one used here, else the first. */
export function startBike(bikes, { last = null, trip = null } = {}) {
  const has = (id) => id && bikes.some((b) => b.id === id);
  if (has(trip?.bikeId)) return trip.bikeId;
  if (has(last)) return last;
  return bikes[0]?.id ?? '';
}

/**
 * The rows to write: per line a note (sorted) and an open repair. The photo goes with the first
 * problem only. ctx = { tripId, day } while a trip runs (notes.rideContext), else null.
 * → { notes, repairs }
 */
export function buildProblems(lines, { bike, photo = null, ctx = null, priority = 'medium', dueDate = null, beforeRide = false, rows = [], now = new Date().toISOString(), stamp = Date.now().toString(36) }) {
  let next = nextNumber(rows);
  const notes = [];
  const repairs = [];
  lines.forEach((text, i) => {
    const note = newNote({ text, photo: i === 0 ? photo : null, page: 'new', tripId: ctx?.tripId ?? null, bikeId: bike.id, day: ctx?.day ?? null }, { id: `note-${stamp}-${i}`, now });
    const out = sortNote(note, 'repair', { bikeId: bike.id, ids: { task: next++ }, now, bikeName: bike.name ?? '' });
    const c = classify(text);
    notes.push(out.note);
    repairs.push({ ...out.repair, source: 'Problem', topic: c.topic, fix: c.fix, part: c.part, priority, dueDate, beforeRide });
  });
  return { notes, repairs };
}
