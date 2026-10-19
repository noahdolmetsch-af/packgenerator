/**
 * Termine buchen (mockups BU1–BU5, Noah 14.10.2026 21:31 «BU1–BU5 freigegeben»): the offers Noah
 * lets people book (Tennis-Lektion, geführte Bikepacking-Tour, Velo-Service, eigenes), shared by the
 * app pages (Ich › Angebote) and the booking page for the students (buchen/). Pure functions.
 *
 * An offer: { kind, title, place, minutes, pay: 'site'|'online', cancelHours, types: [{ key, label,
 * places, price }], slots: [{ id, at: 'YYYY-MM-DDTHH:MM' (Zurich time), type }] }. Prices in Rappen.
 * Answers: 1a booked at once, 2b payment chosen per offer, 4 a und b people cancel up to 24 h before
 * and the owner any time, 8a tour and service come with tennis.
 */

/** The four kinds of offer with their suggested values (everything can be changed). label/text: English, through t(). */
export const KINDS = [
  { kind: 'tennis', icon: 'tennis', label: 'Tennis lesson', text: '60 min · single or group up to 4', minutes: 60, pay: 'site', cancelHours: 24, types: [{ key: 'one', label: 'Single', places: 1, price: 6000 }, { key: 'group', label: 'Group', places: 4, price: 2500 }] },
  { kind: 'tour', icon: 'tent', label: 'Guided bikepacking tour', text: '2 days · up to 6 people', minutes: 2 * 24 * 60, pay: 'online', cancelHours: 72, types: [{ key: 'seat', label: 'Place', places: 6, price: 18000 }] },
  { kind: 'service', icon: 'wrench', label: 'Bike service', text: 'Drop off in the morning', minutes: 90, pay: 'site', cancelHours: 24, types: [{ key: 'short', label: 'Short check', places: 1, price: 4000 }, { key: 'full', label: 'Full service', places: 1, price: 12000 }] },
  { kind: 'own', icon: 'cal', label: 'Own offer', text: 'Your own times and places', minutes: 60, pay: 'site', cancelHours: 24, types: [{ key: 'one', label: 'Place', places: 1, price: 0 }] },
];
export const kindOf = (k) => KINDS.find((x) => x.kind === k) ?? KINDS[3];

/** A new offer of this kind; tr translates the suggested names (t in the app). */
export function newOffer(kind, tr = (s) => s) {
  const k = kindOf(kind);
  return { kind: k.kind, title: tr(k.label), place: '', minutes: k.minutes, pay: k.pay, cancelHours: k.cancelHours, types: k.types.map((x) => ({ ...x, label: tr(x.label) })), slots: [] };
}

/** The address the students open: the booking page on GitHub Pages, the offer after the #. */
export const BOOK_PAGE = 'https://noahdolmetsch-af.github.io/packgenerator/buchen/';
export const shareUrl = (id) => `${BOOK_PAGE}#${id}`;

const pad = (n) => String(n).padStart(2, '0');
/** 'YYYY-MM-DD' + 'HH:MM' → 'YYYY-MM-DDTHH:MM'. */
export const atOf = (day, time) => `${day}T${time}`;
export const dayOf = (at) => String(at).slice(0, 10);
export const timeOf = (at) => String(at).slice(11, 16);

/** Calendar arithmetic on 'YYYY-MM-DD' (no clock, no time zone). */
export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
}
/** Monday of the week of this day. */
export function mondayOf(day) {
  const [y, m, d] = day.split('-').map(Number);
  const wd = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return addDays(day, -wd);
}
export const weekDays = (monday) => Array.from({ length: 7 }, (_, i) => addDays(monday, i));
/** ISO week number of a day. */
export function weekNo(day) {
  const [y, m, d] = day.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d));
  x.setUTCDate(x.getUTCDate() + 3 - ((x.getUTCDay() + 6) % 7));
  const jan4 = new Date(Date.UTC(x.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((x - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}

/** A short random id for a new slot. */
export const slotId = (rnd = Math.random) => Array.from({ length: 8 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(rnd() * 32)]).join('');

/**
 * New slots from day + time, weekly for `weeks` weeks (1 = only this day). Times already there
 * (same start) are skipped. → the slots to add.
 */
export function newSlots(offer, { day, time, type, weeks = 1 }, rnd = Math.random) {
  const have = new Set((offer.slots ?? []).map((s) => s.at));
  const out = [];
  for (let i = 0; i < Math.max(1, Math.min(52, weeks)); i++) {
    const at = atOf(addDays(day, 7 * i), time);
    if (!have.has(at)) out.push({ id: slotId(rnd), at, type });
  }
  return out;
}

/** The slots of one day, by time. */
export const slotsOn = (offer, day) => (offer.slots ?? []).filter((s) => dayOf(s.at) === day).sort((a, b) => a.at.localeCompare(b.at));

/** Booked places per slot from the owner's list of bookings. */
export function bookedBySlot(bookings = []) {
  const n = {};
  for (const b of bookings) n[b.slot] = (n[b.slot] ?? 0) + 1;
  return n;
}

/** 'free' | 'part' | 'full' for the week grid. */
export function slotState(places, booked) {
  if (!booked) return 'free';
  return booked >= places ? 'full' : 'part';
}

/** Rappen → «60» or «25.50» (CHF without the word). */
export const chf = (rappen) => (rappen % 100 ? (rappen / 100).toFixed(2) : String(rappen / 100));

/** Bookings not seen yet (the note on Heute): ids not in seen, slot still ahead or today. */
export function unseen(bookings = [], seen = [], today = '') {
  const s = new Set(seen);
  return bookings.filter((b) => !s.has(b.id) && (!b.at || dayOf(b.at) >= today));
}

/** A calendar file (.ics) for one booking; times as floating local times in Europe/Zurich. */
export function icsOf({ title, place = '', at, minutes = 60, uid }) {
  const [d, t] = [dayOf(at).replaceAll('-', ''), timeOf(at).replace(':', '')];
  const endMs = Date.UTC(+at.slice(0, 4), +at.slice(5, 7) - 1, +at.slice(8, 10), +at.slice(11, 13), +at.slice(14, 16) + minutes);
  const e = new Date(endMs);
  const end = `${e.getUTCFullYear()}${pad(e.getUTCMonth() + 1)}${pad(e.getUTCDate())}T${pad(e.getUTCHours())}${pad(e.getUTCMinutes())}00`;
  const esc = (s) => String(s).replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pack Generator//Termine//DE', 'BEGIN:VEVENT', `UID:${uid}@packgenerator`, `DTSTART;TZID=Europe/Zurich:${d}T${t}00`, `DTEND;TZID=Europe/Zurich:${end}`, `SUMMARY:${esc(title)}`, ...(place ? [`LOCATION:${esc(place)}`] : []), 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}

/** A phone number or an e-mail → the link to write to it (sms: / mailto:), or null. */
export function contactHref(contact, text = '') {
  const c = String(contact ?? '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return `mailto:${c}${text ? `?body=${encodeURIComponent(text)}` : ''}`;
  const digits = c.replace(/[^\d+]/g, '');
  if (digits.replace(/\D/g, '').length >= 6) return `sms:${digits}${text ? `?body=${encodeURIComponent(text)}` : ''}`;
  return null;
}
