/**
 * Kundenliste (Noah 03.11.2026 «1a 2a 3a und b»): the people who book Noah's offers, kept only on this
 * device (settings «booking.customers», also in the backup). A customer is added when Noah confirms a
 * request (2a) and can be added, renamed and deleted by hand. Fields: name, contact, a note and an own
 * price per lesson (3b) that replaces the price of the kind when an invoice is prepared.
 * { id, name, contact, note, rate: Rappen | null, createdAt }
 */
import { db as appDb } from '../db.js';
import { localDay } from '../localday.js';
import { addDays, atOf, bookedBySlot } from './model.js';

export const CUSTOMERS_KEY = 'booking.customers';

/** «  Mia   Muster » → «mia muster»: the same person under slightly different writing. */
export const keyOf = (name) => String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export async function listCustomers(db = appDb) {
  const v = (await db.settings.get(CUSTOMERS_KEY))?.value;
  return Array.isArray(v) ? v : [];
}
export const saveCustomers = (list, db = appDb) => db.settings.put({ key: CUSTOMERS_KEY, value: JSON.parse(JSON.stringify(list)) });

/** The list with this booking's person added (when new), and the contact filled in when it was empty. */
export function withCustomer(list, booking, id = crypto.randomUUID(), today = localDay()) {
  const name = String(booking?.name ?? '').trim();
  if (!name) return list;
  const k = keyOf(name);
  const have = list.find((c) => keyOf(c.name) === k);
  if (!have) return [...list, { id, name, contact: String(booking.contact ?? '').trim(), note: '', rate: null, createdAt: today }];
  if (!have.contact && booking.contact) return list.map((c) => (c === have ? { ...c, contact: String(booking.contact).trim() } : c));
  return list;
}

export async function rememberCustomer(booking, db = appDb) {
  const list = await listCustomers(db);
  const next = withCustomer(list, booking);
  if (next !== list) await saveCustomers(next, db);
}

/** The own price of the person in Rappen, or null (then the price of the kind counts). */
export const rateOf = (list, name) => list.find((c) => keyOf(c.name) === keyOf(name))?.rate ?? null;

/** «80» or «62,50» → Rappen; empty → null; wrong → undefined. */
export function parseRate(text) {
  const s = String(text ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? Math.round(n * 100) : undefined;
}

/** Lessons and invoices of one customer: matched by name; invoices also by the bookings they carry. */
export function invoicesOf(customer, invoices = []) {
  const k = keyOf(customer.name);
  return invoices.filter((x) => keyOf(x.name) === k || (x.name ?? '').split(',').some((p) => keyOf(p) === k));
}
export const lessonsOf = (customer, bookings = []) => bookings.filter((b) => keyOf(b.name) === keyOf(customer.name));

/**
 * Lesson card (Noah 04.11.2026 «5a»): a customer can have a card of N lessons that starts on a day, with an
 * own price for the whole card. { size, price: Rappen | null, from: 'YYYY-MM-DD' }. The first N lessons from
 * that day on are «on the card»: they need no invoice of their own.
 */
export const packOf = (customer) => (customer?.pack && customer.pack.size > 0 ? customer.pack : null);

/** { [bookingId]: { n, size } } for every lesson that lies on a customer's card (in time order, from the start day). */
export function packCover(customers = [], bookings = []) {
  const out = {};
  for (const c of customers) {
    const p = packOf(c);
    if (!p) continue;
    lessonsOf(c, bookings)
      .filter((b) => b.at && String(b.at).slice(0, 10) >= (p.from || ''))
      .sort((a, b) => String(a.at).localeCompare(String(b.at)))
      .slice(0, p.size)
      .forEach((b, i) => (out[b.id] = { n: i + 1, size: p.size }));
  }
  return out;
}

/** How many lessons of the card are over (`now` is «YYYY-MM-DDTHH:MM») and how many are left. */
export function packState(customer, bookings = [], now = '') {
  const p = packOf(customer);
  if (!p) return null;
  const cover = packCover([customer], bookings);
  const used = bookings.filter((b) => cover[b.id] && b.at < now).length;
  return { size: p.size, used, left: Math.max(0, p.size - used) };
}

/** The form fields «size» and «price» → a card, null (no card) or undefined (wrong). */
export function parsePack(size, price, from) {
  const n = String(size ?? '').trim();
  if (!n) return null;
  const count = Number(n);
  if (!Number.isInteger(count) || count < 1 || count > 100) return undefined;
  const rate = parseRate(price);
  if (rate === undefined) return undefined;
  return { size: count, price: rate, from: from || '' };
}

/**
 * Subscription (Noah 04.11.2026 «5b»): a customer can pay a fixed price every month. { price: Rappen }.
 * Every month Noah prepares the invoice by one tap; nothing runs by itself.
 */
export const aboOf = (customer) => (customer?.abo && customer.abo.price > 0 ? customer.abo : null);

/** The price field → { price } (Rappen), null (no subscription) or undefined (wrong). */
export function parseAbo(price) {
  const rate = parseRate(price);
  if (rate === undefined) return undefined;
  return rate ? { price: rate } : null;
}

/**
 * Fixed time (Noah 04.11.2026 «8a»): a regular customer can have a weekday and a time (Monday = 0). It is only a
 * suggestion: Heute shows the next free time that matches, with a ready message; nothing is booked by itself.
 */
export const fixedOf = (customer) => (customer?.fixed && customer.fixed.time ? customer.fixed : null);

/** The form fields → { weekday, time }, null (no fixed time) or undefined (wrong). */
export function parseFixed(weekday, time) {
  const w = String(weekday ?? '').trim();
  const tm = String(time ?? '').trim();
  if (!w && !tm) return null;
  const n = Number(w);
  if (!w || !Number.isInteger(n) || n < 0 || n > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(tm)) return undefined;
  return { weekday: n, time: tm };
}

const weekdayOf = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
};

/**
 * For every customer with a fixed time: the next time in the coming `days` days (8: today and the same weekday next week) that matches the weekday and the
 * time, exists as a slot of an offer, has a free place and is not yet booked by that person.
 * offers: [{ ...offer, bookings }]; `now` is «YYYY-MM-DDTHH:MM». → [{ customer, offer, slot }].
 */
export function fixedSuggestions(customers = [], offers = [], now = '', days = 8) {
  const today = now.slice(0, 10);
  const out = [];
  for (const c of customers) {
    const f = fixedOf(c);
    if (!f) continue;
    for (let i = 0; i < days; i++) {
      const day = addDays(today, i);
      if (weekdayOf(day) !== f.weekday) continue;
      const at = atOf(day, f.time);
      if (at <= now) continue;
      let taken = false;
      let hit = null;
      for (const o of offers) {
        const slot = (o.slots ?? []).find((s) => s.at === at);
        if (!slot) continue;
        const mine = (o.bookings ?? []).some((b) => b.slot === slot.id && b.status !== 'declined' && keyOf(b.name) === keyOf(c.name));
        if (mine) taken = true;
        const places = ((o.types ?? []).find((x) => x.key === slot.type) ?? o.types?.[0])?.places ?? 0;
        if (!hit && (bookedBySlot(o.bookings)[slot.id] ?? 0) < places) hit = { customer: c, offer: o, slot };
      }
      if (hit && !taken) out.push(hit);
      break;
    }
  }
  return out;
}
