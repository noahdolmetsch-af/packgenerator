/**
 * Paket L «Werkzeugkasten» (#318 Tour-Kosten teilen, #366 Ausgaben pro Tour in Franken, #320 Text aus
 * Foto lesen; Noah 19.10.2026 «2a», «3a»): per trip, who paid what; every expense also in Franken
 * (with the rate of that day); at the end who owes whom, with «Request by TWINT» for what others owe you.
 *
 * Where it lives: settings 'costs.<tripId>' = { people: [{ id, name }], items: [{ id, what, amount,
 * cur, chf, paidBy, for: [ids], day, addedAt }], asked: { personId: invoiceNo } } (backup and sync
 * carry it; no new table). Person 'me' is you and is always there (its name is shown by the app).
 * Names are the user's own: never through t(). Money for settling is counted in Rappen.
 * Pure, tested in tests/werkzeugkasten.test.js.
 */
import { findDate } from '../docs.js';
import { parseAmount } from './money.js';

export const ME = 'me';
export const costsKey = (tripId) => `costs.${tripId}`;
export const emptyCosts = () => ({ people: [{ id: ME, name: '' }], items: [], asked: {} });

/** A stored record made safe (old or broken parts dropped). */
export function cleanCosts(v) {
  const c = v && typeof v === 'object' ? v : {};
  const people = Array.isArray(c.people) ? c.people.filter((p) => p && p.id) : [];
  if (!people.some((p) => p.id === ME)) people.unshift({ id: ME, name: '' });
  const ids = new Set(people.map((p) => p.id));
  const items = (Array.isArray(c.items) ? c.items : []).filter((x) => x && Number.isFinite(x.chf)).map((x) => ({ ...x, paidBy: ids.has(x.paidBy) ? x.paidBy : ME, for: (x.for ?? []).filter((id) => ids.has(id)) }));
  return { people, items, asked: c.asked && typeof c.asked === 'object' ? c.asked : {} };
}

const rp = (chf) => Math.round(chf * 100);

/** The total in Franken. */
export const totalChf = (items) => (items ?? []).reduce((s, x) => s + rp(x.chf), 0) / 100;

/**
 * What each person paid, what their share is and the difference (in Rappen): + gets money back, − owes.
 * An expense «for» nobody counts for everybody. The share is split evenly; the leftover Rappen go
 * to the first people so the sums stay exact.
 */
export function balances(people, items) {
  const b = Object.fromEntries((people ?? []).map((p) => [p.id, { paid: 0, share: 0 }]));
  for (const x of items ?? []) {
    const cents = rp(x.chf);
    const who = (x.for?.length ? x.for : people.map((p) => p.id)).filter((id) => b[id]);
    if (!who.length || !b[x.paidBy]) continue;
    b[x.paidBy].paid += cents;
    const each = Math.floor(cents / who.length);
    let rest = cents - each * who.length;
    for (const id of who) {
      b[id].share += each + (rest > 0 ? 1 : 0);
      rest--;
    }
  }
  return Object.fromEntries(Object.entries(b).map(([id, v]) => [id, { ...v, diff: v.paid - v.share }]));
}

/** Who pays whom how much (Rappen), with as few payments as possible: [{ from, to, cents }]. */
export function settle(bal) {
  const plus = Object.entries(bal).filter(([, v]) => v.diff > 0).map(([id, v]) => ({ id, left: v.diff })).sort((a, b) => b.left - a.left);
  const minus = Object.entries(bal).filter(([, v]) => v.diff < 0).map(([id, v]) => ({ id, left: -v.diff })).sort((a, b) => b.left - a.left);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < minus.length && j < plus.length) {
    const c = Math.min(minus[i].left, plus[j].left);
    if (c > 0) out.push({ from: minus[i].id, to: plus[j].id, cents: c });
    minus[i].left -= c;
    plus[j].left -= c;
    if (!minus[i].left) i++;
    if (!plus[j].left) j++;
  }
  return out;
}

/** The trip to show first: today's, else the next one, else the last one. */
export function defaultTrip(trips, today) {
  const real = (trips ?? []).filter((t) => t.startDate && !t.idea);
  const end = (t) => {
    const d = new Date(`${t.startDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + Math.max(1, Number(t.days) || 1) - 1);
    return d.toISOString().slice(0, 10);
  };
  return real.find((t) => t.startDate <= today && end(t) >= today) ?? real.filter((t) => t.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? real.filter((t) => t.startDate < today).sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;
}

const CUR = [
  [/\bCHF\b|\bFr\.?(?=\s|\d)|\bSFr/i, 'CHF'],
  [/€|\bEUR\b/i, 'EUR'],
  [/£|\bGBP\b/i, 'GBP'],
  [/\$|\bUSD\b/i, 'USD'],
  [/\bNOK\b/i, 'NOK'],
  [/\bSEK\b/i, 'SEK'],
  [/\bDKK\b/i, 'DKK'],
];
const TOTAL = /\b(total|totale|summe|gesamt|betrag|zu zahlen|zahlbetrag|amount|montant|importo|totaal|te betalen)\b/i;
const MONEY = /(\d{1,3}(?:[’' .]\d{3})*[.,]\d{2}|\d+[.,]\d{2})(?!\d)/g;

/**
 * Amount, date and currency read from the text of a receipt photo (#320). The amount: the biggest one
 * on a «Total»/«Summe»/… line, else the biggest one with two decimals. Each part null when not found.
 */
export function readReceipt(text) {
  const s = String(text ?? '');
  const lines = s.split(/\r?\n/);
  const nums = (l) => [...l.matchAll(MONEY)].map((m) => parseAmount(m[1])).filter((v) => v != null && v > 0 && v < 100000);
  let amount = null;
  for (const l of lines) if (TOTAL.test(l)) for (const v of nums(l)) amount = Math.max(amount ?? 0, v);
  if (amount == null) for (const l of lines) for (const v of nums(l)) amount = Math.max(amount ?? 0, v);
  const cur = CUR.find(([re]) => re.test(s))?.[1] ?? null;
  return { amount, date: findDate(s), cur };
}
