/**
 * Pure mapping functions for the Excel converter: one Excel row in, one app record out.
 * No personal data lives here; English texts come from the prototype (public) and a
 * private translations file (outside the repo).
 */

import { splitBrand } from '../../src/lib/brand.js';

export const CATEGORY = {
  Elektronik: 'elec', Licht: 'light', 'Kleidung on-bike': 'onbike', 'Regen & Kälte': 'rain',
  'Kleidung off-bike': 'offbike', Schuhe: 'shoes', 'Werkzeug & Reparatur': 'tools',
  'Ernährung & Trinken': 'food', Schlafen: 'sleep', Kochen: 'cook', 'Hygiene & Gesundheit': 'hyg',
  'Dokumente & Zahlung': 'docs', Taschen: 'bags', 'Bike-Teile & Montage': 'bike', 'Komfort & Luxus': 'lux',
};
export const CARRY = { Gepäck: 'luggage', 'Bike & Taschen': 'bike', Körper: 'body' };
export const OWNERSHIP = { Vorhanden: 'owned', Kaufen: 'to-buy', 'Backlog/Wunsch': 'wishlist', Unklar: 'unclear' };
export const WEIGHT_STATUS = {
  Logbuch: 'logbook', 'Online geprüft': 'online', 'Offen – nicht notiert': 'missing', 'Offen – Konflikt': 'conflict',
};
export const RATING = { Kern: 'core', Prüfen: 'check', Situativ: 'situational', Doppelt: 'duplicate', Streichen: 'drop', Luxus: 'luxury' };
export const ROLE = { Worn: 'worn', Optional: 'optional', 'Standard pack': 'standard' };
export const PRIORITY = { Hoch: 'high', Mittel: 'medium', Niedrig: 'low' };
export const POSITION = {
  'Elektronik-Bag': 'Electronics bag', 'Top Tube Bag': 'Top tube bag', 'Top Tube Bag / Elektronik-Bag': 'Top tube bag / electronics bag',
  'Bike montiert (Halter)': 'Mounted on the bike (holder)', 'Am Körper': 'On the body', Werkzeugtasche: 'Tool bag',
  'Trikottasche / Quad Lock': 'Jersey pocket / Quad Lock', Trikottasche: 'Jersey pocket', 'Bike montiert': 'Mounted on the bike',
  'Top Tube Bag / Werkzeugtasche': 'Top tube bag / tool bag', 'Am Körper / Rucksack': 'On the body / backpack',
  'Arschrakete / Rückentasche': 'Seat pack / back pocket', 'Rückentasche / Arschrakete': 'Back pocket / seat pack',
  Flaschenhalter: 'Bottle cage', Rahmen: 'Frame',
};
/** Kit columns O–V in the Master sheet, in order. */
export const KIT_CODES = ['D', 'T', 'R', 'U', 'S', 'L', 'W', 'O'];

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v) => (v == null ? '' : String(v).trim());

/** "18.6.2026" → "2026-06-18"; anything else → null */
export function isoDate(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(str(v));
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

/** Excel time (a Date on 1899-12-30, or a fraction of a day) → "HH:MM" */
export function hhmm(v) {
  if (v instanceof Date) return v.toISOString().slice(11, 16);
  if (typeof v === 'number') {
    const min = Math.round(v * 24 * 60);
    return `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  }
  return str(v) || null;
}

/** "U/S/O" → ["U","S","O"]; "Alle" → ["all"]; other text → translated text */
export function appliesTo(v, t) {
  const s = str(v);
  if (!s) return [];
  if (s === 'Alle' || s === 'Alle Kits') return ['all'];
  if (/^[A-Z](\/[A-Z])*$/.test(s)) return s.split('/');
  return [t(s)];
}

/**
 * One Master row (array, column A = index 0) → Item.
 * `lib` is the prototype's English library row for the same ID:
 * [id, cat, name, brand, g, l, own, role, set, defaultBag, rating, learning, note]
 */
export function mapItem(row, lib, t, wishPriority) {
  const id = str(row[0]);
  const weightG = num(row[4]);
  const role = ROLE[str(row[25])] ?? null;
  const set = str(row[26]).toLowerCase();
  return {
    id,
    name: lib?.[2] || t(str(row[2])),
    nameDe: str(row[2]),
    ...splitBrand(lib?.[3] || str(row[3])),
    category: lib?.[1] || CATEGORY[str(row[1])] || 'other',
    weightG,
    qty: num(row[5]) ?? 1,
    weightStatus: weightG == null ? 'missing' : WEIGHT_STATUS[str(row[7])] ?? 'logbook',
    weightNote: row[8] ? t(str(row[8])) : '',
    carry: CARRY[str(row[9])] ?? 'luggage',
    defaultBag: lib?.[9] || null,
    position: row[10] ? POSITION[str(row[10])] ?? t(str(row[10])) : '',
    ownership: OWNERSHIP[str(row[11])] ?? 'unclear',
    rating: RATING[str(row[12])] ?? null,
    learning: lib?.[11] || (row[13] ? t(str(row[13])) : ''),
    note: lib?.[12] || (row[23] ? t(str(row[23])) : ''),
    role,
    sets: set ? [set] : [],
    kits: KIT_CODES.filter((_, i) => str(row[14 + i]).toLowerCase() === 'x'),
    volumeL: num(row[27]) ?? num(lib?.[5]),
    wishPriority: wishPriority ?? null,
    sources: str(row[22]),
    domains: ['bikepacking'],
  };
}
