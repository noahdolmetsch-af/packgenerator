/**
 * Kundenliste (Noah 03.11.2026 «1a 2a 3a und b»): the people who book Noah's offers, kept only on this
 * device (settings «booking.customers», also in the backup). A customer is added when Noah confirms a
 * request (2a) and can be added, renamed and deleted by hand. Fields: name, contact, a note and an own
 * price per lesson (3b) that replaces the price of the kind when an invoice is prepared.
 * { id, name, contact, note, rate: Rappen | null, createdAt }
 */
import { db as appDb } from '../db.js';
import { localDay } from '../localday.js';

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
