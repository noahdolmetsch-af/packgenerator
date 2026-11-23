/**
 * «Kursblick» Journal (Teil 4): the prices a journal asks for, in francs per piece or per gram, from the series the page has
 * (gold, dollar rate) and the ones it fetches for the symbols of the entries. Only the symbols go to the price server; what was
 * paid never does. Tested in tests/kurse-preise.test.js.
 */
import { GOLD, symbole } from './journal.js';
import { reihenId } from './maerkte.js';
import { ladeFehlende, kontextVon } from './stand.js';

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

/** The name a title shows: «Gold» (the word of the app) or the symbol, or the name the price service gave. */
export const titelText = (titel, reihen, tr = (v) => v) => (titel === GOLD ? tr('Gold') : (reihen[reihenId(titel)]?.name ?? titel));
