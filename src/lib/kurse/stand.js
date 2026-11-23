/**
 * «Kursblick» (K-C): what the private pieces (Mein Bestand, Ziele) need from the price series, and the numbers they get from them.
 * Only the symbols of titles go to the price server; amounts and prices paid never leave the device.
 * Tested in tests/kurse-stand.test.js.
 */
import { reihenId } from './maerkte.js';
import { ladeReihe } from './laden.js';
import { goldChfKg } from './rechnen.js';
import { bewerte, summe, waehrungVon, kursId } from './bestand.js';
import { aktuell } from './ziele.js';

/** The ids of the series of titles that positions and goals ask for (not gold, SMI and the dollar: the page has them). */
export function titelIds(bestand, ziele) {
  const ids = new Set();
  for (const p of bestand.posten) if (p.art === 'titel') ids.add(reihenId(p.symbol));
  for (const z of ziele.ziele) if (z.was === 'titel') ids.add(reihenId(z.symbol));
  return [...ids];
}

/** The ids of the exchange-rate series the loaded titles need (a title in dollars needs the dollar rate, and so on). */
export function kursIds(bestand, reihen) {
  const ids = new Set();
  for (const p of bestand.posten) {
    if (p.art !== 'titel') continue;
    const w = waehrungVon(reihen[reihenId(p.symbol)]?.currency, p.symbol);
    const id = w && kursId(w.code);
    if (id) ids.add(id);
  }
  return [...ids];
}

/**
 * Fetch what is missing: the titles, then the rates they need. `reihen` is what the page has (gold, usdchf, smi).
 * → the new map id → answer (null when it did not come). The cache of the device answers when the server does not.
 */
export async function ladeFehlende(bestand, ziele, reihen, { force = false, lade = ladeReihe } = {}) {
  const next = { ...reihen };
  const hole = async (ids) =>
    Promise.all(
      ids
        .filter((id) => force || next[id] === undefined)
        .map(async (id) => {
          try {
            next[id] = await lade(id, { force });
          } catch {
            next[id] = null;
          }
        }),
    );
  await hole(titelIds(bestand, ziele));
  await hole(kursIds(bestand, next));
  return next;
}

/** Francs per kilogram of gold today, or null. */
export function goldKgJetzt(reihen) {
  if (!reihen.gold || !reihen.usdchf) return null;
  const g = goldChfKg(reihen.gold.points, reihen.usdchf.points);
  return g.length ? g[g.length - 1][1] : null;
}

/** The numbers to value one position with (see bestand.js bewerte). */
export function kontextVon(p, reihen) {
  if (p.art === 'gold') return { goldKg: goldKgJetzt(reihen) };
  if (p.art !== 'titel') return {};
  const a = reihen[reihenId(p.symbol)];
  const w = a ? waehrungVon(a.currency, p.symbol) : null;
  const id = w && kursId(w.code);
  const rate = !w ? null : id ? reihen[id]?.last?.close : 1;
  return { preis: a?.last?.close ?? null, kurs: rate > 0 ? rate * w.mult : null };
}

/** Every position valued, and the whole. → { zeilen: [{ posten, b }], summe }. */
export function bewerteAlle(bestand, reihen) {
  const zeilen = bestand.posten.map((posten) => ({ posten, b: bewerte(posten, kontextVon(posten, reihen)) }));
  return { zeilen, summe: summe(zeilen.map((z) => z.b)) };
}

/** What the goals are checked against: { goldKg, smi, bestand, titel: { SYMBOL: price } }. */
export function zielKontext(bestand, ziele, reihen) {
  const titel = {};
  for (const z of ziele.ziele) if (z.was === 'titel') titel[z.symbol] = reihen[reihenId(z.symbol)]?.last?.close ?? null;
  const alle = bestand.posten.length ? bewerteAlle(bestand, reihen).summe : null;
  return { goldKg: goldKgJetzt(reihen), smi: reihen.smi?.last?.close ?? null, bestand: alle && alle.offen < bestand.posten.length ? alle.wert : null, titel };
}

export const zielJetzt = (z, ctx) => aktuell(z, ctx);
