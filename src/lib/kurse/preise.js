/**
 * «Kursblick» Journal (Teil 4): the prices a journal asks for, in francs per piece or per gram, from the series the page has
 * (gold, dollar rate) and the ones it fetches for the symbols of the entries. Only the symbols go to the price server; what was
 * paid never does. Tested in tests/kurse-preise.test.js.
 */
import { GOLD, symbole } from './journal.js';
import { reihenId } from './maerkte.js';
import { ladeFehlende, kontextVon } from './stand.js';
import { waehrungVon, kursId } from './bestand.js';
import { closeOnOrBefore, goldChfKg } from './rechnen.js';

/** The symbols of a journal as a holdings-shaped list, so that the loader of «Meine Zahlen» can fetch them (with the rates they need). */
const alsBestand = (state) => ({ posten: symbole(state).map((symbol) => ({ art: 'titel', symbol })) });

/** Fetch what the journal needs. reihen: what the page has. → the new map id → answer (null when it did not come). */
export const ladeJournalPreise = (state, reihen, opts = {}) => ladeFehlende(alsBestand(state), { ziele: [] }, reihen, opts);

/**
 * Francs per piece (or per gram of gold) today for each title of the list: { titel: price | null }.
 * null when the series or the exchange rate is missing: nothing is guessed.
 */
export function preiseChf(titel, reihen) {
  const out = {};
  for (const t of titel) {
    if (t === GOLD) {
      const kg = kontextVon({ art: 'gold' }, reihen).goldKg;
      out[t] = kg > 0 ? kg / 1000 : null;
    } else {
      const c = kontextVon({ art: 'titel', symbol: t }, reihen);
      out[t] = c.preis > 0 && c.kurs > 0 ? c.preis * c.kurs : null;
    }
  }
  return out;
}

/** How far back a close may be from the day asked for (a long holiday, a title that rests): older is no answer. */
export const SCHLUSS_TAGE = 14;

const tageZwischen = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/** The close on `tag` or on the last day before it, if it is not older than SCHLUSS_TAGE: [day, close] or null. */
function schlussVor(points, tag) {
  const p = closeOnOrBefore(points, tag);
  return p && tageZwischen(p[0], tag) <= SCHLUSS_TAGE ? p : null;
}

/**
 * The closing price of a title on a day in francs per piece (per gram for gold): { preis, tag } where `tag` is the day the close is
 * from (a weekend or a holiday gives the last trading day before it), or null when the series, the day or the exchange rate
 * of that day is missing: nothing is guessed. The rate of the same day is used, not today's.
 */
export function schlussAm(titel, tag, reihen) {
  if (titel === GOLD) {
    const p = schlussVor(goldChfKg(reihen.gold?.points, reihen.usdchf?.points), tag);
    return p ? { preis: p[1] / 1000, tag: p[0] } : null;
  }
  const a = reihen[reihenId(titel)];
  const p = a && schlussVor(a.points, tag);
  if (!p || !(p[1] > 0)) return null;
  const w = waehrungVon(a.currency, titel);
  if (!w) return null;
  const id = kursId(w.code);
  const r = id ? schlussVor(reihen[id]?.points, tag) : [p[0], 1];
  return r && r[1] > 0 ? { preis: p[1] * r[1] * w.mult, tag: p[0] } : null;
}

/** Fetch the series that the closing price of one title needs (the title and its exchange rate). → the new map id → answer. */
export const ladeTitelReihe = (titel, reihen, opts = {}) => (titel === GOLD ? Promise.resolve(reihen) : ladeFehlende({ posten: [{ art: 'titel', symbol: titel }] }, { ziele: [] }, reihen, opts));

/** The name a title shows: «Gold» (the word of the app) or the symbol, or the name the price service gave. */
export const titelText = (titel, reihen, tr = (v) => v) => (titel === GOLD ? tr('Gold') : (reihen[reihenId(titel)]?.name ?? titel));
