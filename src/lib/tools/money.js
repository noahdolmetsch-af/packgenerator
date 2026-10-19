/**
 * Paket L «Werkzeugkasten» (#8 Währungen umrechnen; Noah 19.10.2026 «2a»): the rates come once a day
 * by themselves, free and without a key, from the European Central Bank (via frankfurter.dev); the
 * last ones stay on the device, so it works offline with the rates of that day.
 * Rates are «1 CHF = x of the currency». Amounts in the costs are kept in Rappen (whole numbers).
 * Pure parts tested in tests/werkzeugkasten.test.js.
 */
import { localDay } from '../localday.js';

export const RATES_KEY = 'tools.rates'; // db.meta: a cache of this device, not in the backup
export const RATE_URLS = ['https://api.frankfurter.dev/v1/latest?base=CHF', 'https://api.frankfurter.app/latest?from=CHF'];
/** The currencies offered first (more come from the rates). */
export const MAIN_CURRENCIES = ['CHF', 'EUR', 'USD', 'GBP', 'NOK', 'SEK', 'DKK', 'CZK', 'PLN', 'HUF', 'JPY'];

/** A typed amount as a number («12,50», «1’200.–»); null when it is none. */
export function parseAmount(s) {
  const c = String(s ?? '').replace(/[’'\s]/g, '').replace(/[.,]–$/, '').replace(/–$/, '');
  if (!c) return null;
  // «1.234,50» and «1,234.50»: the last sign is the decimal one
  const last = Math.max(c.lastIndexOf(','), c.lastIndexOf('.'));
  let n = c;
  if (last >= 0) {
    const whole = c.slice(0, last).replace(/[.,]/g, '');
    const dec = c.slice(last + 1);
    n = dec.length === 3 && !/[.,]/.test(c.slice(0, last)) && c[last] === ',' ? `${whole}${dec}` : `${whole}.${dec}`;
  }
  const v = Number(n);
  return Number.isFinite(v) && /^-?\d*\.?\d+$/.test(n) ? v : null;
}

/** amount in currency `from` → `to`, with rates «1 CHF = x». null when a rate is missing. */
export function convertMoney(amount, from, to, rates) {
  if (amount == null || !Number.isFinite(amount)) return null;
  const r = (c) => (c === 'CHF' ? 1 : rates?.[c]);
  if (!r(from) || !r(to)) return null;
  return (amount / r(from)) * r(to);
}

/** Rounded to 2 places (5 Rappen for CHF is not done: receipts show exact amounts). */
export const round2 = (v) => (v == null ? null : Math.round(v * 100) / 100);

/** Are the kept rates from today? */
export const fresh = (saved, today = localDay()) => !!saved?.rates && saved.day === today;

/** The rates of today: the kept ones, or fetched (once a day). → { day, date, rates, at } or the old ones / null. */
export async function loadRates(db, { doFetch = (...a) => fetch(...a), online = globalThis.navigator?.onLine !== false, today = localDay() } = {}) {
  const saved = (await db.meta.get(RATES_KEY).catch(() => null))?.value ?? null;
  if (fresh(saved, today) || !online) return saved;
  for (const url of RATE_URLS) {
    try {
      const res = await doFetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const j = await res.json();
      if (!j?.rates || typeof j.rates !== 'object') continue;
      const value = { day: today, date: j.date ?? today, rates: j.rates, at: new Date().toISOString() };
      await db.meta.put({ key: RATES_KEY, value });
      return value;
    } catch {
      /* next address, else the kept rates */
    }
  }
  return saved;
}

/** All currencies of the rates, the main ones first. */
export function currenciesOf(rates) {
  const all = new Set(['CHF', ...Object.keys(rates ?? {})]);
  return [...MAIN_CURRENCIES.filter((c) => all.has(c)), ...[...all].filter((c) => !MAIN_CURRENCIES.includes(c)).sort()];
}

/** «1’234.50» (de-CH) for the screen. */
export const fmtMoney = (v, loc = 'de-CH') => (v == null || !Number.isFinite(v) ? '–' : new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v));
