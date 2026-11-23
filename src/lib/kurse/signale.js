/**
 * «Kursblick» Entscheidung (Noah 23.11.2026 «1, 3 und 4 zusammen», «ok freigabe»; Bauplan in
 * /mnt/project-files/notes/kursblick-entscheidung-bauplan-2026-11-23): what a price series says about itself, and what the
 * person's own rules make of it. Pure helpers, tested in tests/kurse-signale.test.js. No page piece yet (PR 1 of 4).
 *
 * These are OBSERVATIONS and the result of rules the person set: nothing here predicts a price and nothing is advice.
 * A series is the server's: points [[day, close], …] ascending, days as YYYY-MM-DD, the last point the latest close.
 *
 * - Trend (Ampel): the price against the mean of its last 50 and 200 closes. green: above both, red: below both, yellow: between.
 * - Lage: where the price stands inside the lowest and highest close of the last five years (about 1260 trading days).
 *   The lowest fifth is «günstig», the highest fifth is «teuer» (very expensive).
 * - Kaufregel (own rule): a monthly amount, a factor when the trend is red, a factor when the price is very expensive.
 *   The suggestion is the amount times the factors; both factors multiply when both apply.
 * - Rückblick: the same rule over the last months (the first trading day of each month) against «always the same amount».
 * - Verteilung: groups with a goal in percent and a band in points; says which group is above or below and by how much.
 */

export const MITTEL_KURZ = 50;
export const MITTEL_LANG = 200;
/** About five years of trading days, and the fewest closes that make «Lage» worth saying. */
export const LAGE_TAGE = 1260;
export const LAGE_MIN = 250;
/** The lowest and the highest fifth. */
export const LAGE_GRENZE = 0.2;

const zahl = (v) => typeof v === 'number' && Number.isFinite(v);

/** The mean of the `n` closes up to and including index `i`; null when there are fewer than `n`. */
export function mittelAm(punkte, i, n) {
  if (!Array.isArray(punkte) || !(n > 0) || i < n - 1 || i >= punkte.length) return null;
  let s = 0;
  for (let k = i - n + 1; k <= i; k++) {
    const v = punkte[k]?.[1];
    if (!zahl(v)) return null;
    s += v;
  }
  return s / n;
}

/** The mean for every point from the first one that has `n` closes: [[day, mean], …] (shorter than the series). */
export function mittelReihe(punkte, n) {
  const out = [];
  if (!Array.isArray(punkte) || !(n > 0)) return out;
  let s = 0;
  for (let i = 0; i < punkte.length; i++) {
    s += punkte[i][1];
    if (i >= n) s -= punkte[i - n][1];
    if (i >= n - 1) out.push([punkte[i][0], s / n]);
  }
  return out;
}

/**
 * The trend colour on index `i` (default: the last point).
 * → { farbe: 'gruen' | 'gelb' | 'rot', preis, m50, m200, ueber50, ueber200 } (the last two in %, positive when above) or null
 * when there are not yet 200 closes.
 */
export function ampel(punkte, i = (punkte?.length ?? 0) - 1) {
  const preis = punkte?.[i]?.[1];
  if (!zahl(preis)) return null;
  const m50 = mittelAm(punkte, i, MITTEL_KURZ);
  const m200 = mittelAm(punkte, i, MITTEL_LANG);
  if (m50 == null || m200 == null || !(m50 > 0) || !(m200 > 0)) return null;
  const a = preis > m50;
  const b = preis > m200;
  return { farbe: a && b ? 'gruen' : !a && !b ? 'rot' : 'gelb', preis, m50, m200, ueber50: (preis / m50 - 1) * 100, ueber200: (preis / m200 - 1) * 100 };
}

/**
 * Where the price on index `i` stands in the last five years.
 * → { p: 0..1, tief, hoch, stufe: 'guenstig' | 'mitte' | 'teuer', tage } or null when the series is too short or flat.
 */
export function lage(punkte, i = (punkte?.length ?? 0) - 1, tage = LAGE_TAGE) {
  const preis = punkte?.[i]?.[1];
  if (!zahl(preis)) return null;
  const von = Math.max(0, i - tage + 1);
  if (i - von + 1 < LAGE_MIN) return null;
  let tief = Infinity;
  let hoch = -Infinity;
  for (let k = von; k <= i; k++) {
    const v = punkte[k][1];
    if (v < tief) tief = v;
    if (v > hoch) hoch = v;
  }
  if (!(hoch > tief)) return null;
  const p = (preis - tief) / (hoch - tief);
  return { p, tief, hoch, stufe: p >= 1 - LAGE_GRENZE ? 'teuer' : p <= LAGE_GRENZE ? 'guenstig' : 'mitte', tage: i - von + 1 };
}

/** The factors a person can choose for a red trend or a very expensive price. */
export const FAKTOREN = [0, 0.5, 1, 1.5, 2];
export const REGEL_STANDARD = { grundbetrag: 0, rot: 1, teuer: 1 };

const faktorOk = (f) => FAKTOREN.includes(f);

/** What was typed or saved → a rule that can be used. Anything broken falls back to the standard. */
export function liesRegel(r) {
  const g = typeof r?.grundbetrag === 'number' && Number.isFinite(r.grundbetrag) && r.grundbetrag >= 0 ? r.grundbetrag : 0;
  return { grundbetrag: g, rot: faktorOk(r?.rot) ? r.rot : 1, teuer: faktorOk(r?.teuer) ? r.teuer : 1 };
}

/**
 * The factor of the rule on index `i`. → { faktor, gruende: ['rot', 'teuer'], farbe, stufe }.
 * Without enough closes for the trend or the position the factor is 1 (the base amount): nothing is guessed.
 */
export function regelFaktor(punkte, i, regel) {
  const r = liesRegel(regel);
  const a = ampel(punkte, i);
  const l = lage(punkte, i);
  const gruende = [];
  let faktor = 1;
  if (a?.farbe === 'rot') {
    gruende.push('rot');
    faktor *= r.rot;
  }
  if (l?.stufe === 'teuer') {
    gruende.push('teuer');
    faktor *= r.teuer;
  }
  return { faktor, gruende, farbe: a?.farbe ?? null, stufe: l?.stufe ?? null };
}

/** The suggestion of the rule on index `i`: how much to buy. → { betrag, faktor, gruende, menge } (menge: pieces or grams at that price). */
export function regelVorschlag(punkte, i, regel) {
  const r = liesRegel(regel);
  const f = regelFaktor(punkte, i, r);
  const betrag = r.grundbetrag * f.faktor;
  const preis = punkte?.[i]?.[1];
  return { ...f, betrag, menge: zahl(preis) && preis > 0 ? betrag / preis : null };
}

/**
 * The last `monate` months with the first trading day of each, as indexes of the series. A month that starts before the
 * series (its first day is missing) is left out; the current month counts once it has a point.
 */
export function monatsAnfaenge(punkte, monate = 60) {
  const out = [];
  let key = '';
  for (let i = 0; i < (punkte?.length ?? 0); i++) {
    const k = punkte[i][0].slice(0, 7);
    if (k !== key) {
      key = k;
      out.push(i);
    }
  }
  // the very first month of the series may be partial: its first point is not the first trading day of the month
  if (out.length && punkte[0][0].slice(8, 10) > '07') out.shift();
  return out.slice(-monate);
}

const summiere = (zeilen, schlusspreis) => {
  let einbezahlt = 0;
  let menge = 0;
  for (const z of zeilen) {
    einbezahlt += z.betrag;
    menge += z.menge;
  }
  const wert = menge * schlusspreis;
  return { einbezahlt, menge, schnitt: menge ? einbezahlt / menge : null, wert, gewinnPct: einbezahlt ? (wert / einbezahlt - 1) * 100 : null };
};

/**
 * The rule looked back over the last `monate` months, against «always the base amount».
 * → { monate: [{ tag, preis, betrag, faktor, gruende, menge, gleich }], regel: summe, gleich: summe, unterschied } or null without a base amount.
 * `unterschied` is the average price of «always the same» minus the average price of the rule (positive: the rule paid less per piece).
 * It is a look back and says nothing about what comes.
 */
export function rueckblick(punkte, regel, monate = 60) {
  const r = liesRegel(regel);
  if (!(r.grundbetrag > 0) || !punkte?.length) return null;
  const zeilen = monatsAnfaenge(punkte, monate).map((i) => {
    const v = regelVorschlag(punkte, i, r);
    const preis = punkte[i][1];
    return { tag: punkte[i][0], preis, betrag: v.betrag, faktor: v.faktor, gruende: v.gruende, menge: v.betrag / preis, gleich: { betrag: r.grundbetrag, menge: r.grundbetrag / preis } };
  });
  if (!zeilen.length) return null;
  const schluss = punkte[punkte.length - 1][1];
  const a = summiere(zeilen, schluss);
  const b = summiere(zeilen.map((z) => z.gleich), schluss);
  return { monate: zeilen, regel: a, gleich: b, unterschied: a.schnitt != null && b.schnitt != null ? b.schnitt - a.schnitt : null };
}

/** What a goal in percent is not allowed to be: below 0 or above 100. → the number as typed or a fallback of 0. */
export const zielProzent = (v) => (zahl(v) ? Math.min(100, Math.max(0, v)) : 0);

/**
 * The split of a portfolio against the goals of its groups.
 * gruppen: [{ id, ziel }] (ziel in %), werte: { id: value in francs }, spielraum: points a group may be off.
 * → { total, summeZiel, gruppen: [{ id, wert, jetzt, ziel, abweichung, diff, ok }] }.
 * abweichung: points above (+) or below (−) the goal; diff: francs above (+) or below (−) the goal (sell if positive, buy if negative);
 * ok: within the band. The goals need not add up to 100: the francs are worked out from each goal on its own.
 */
export function verteilung(gruppen, werte, spielraum = 0) {
  const total = (gruppen ?? []).reduce((s, g) => s + Math.max(0, werte?.[g.id] ?? 0), 0);
  const out = (gruppen ?? []).map((g) => {
    const wert = Math.max(0, werte?.[g.id] ?? 0);
    const ziel = zielProzent(g.ziel);
    const jetzt = total ? (wert / total) * 100 : 0;
    const abweichung = jetzt - ziel;
    return { id: g.id, wert, jetzt, ziel, abweichung, diff: wert - (total * ziel) / 100, ok: Math.abs(abweichung) <= Math.max(0, spielraum) };
  });
  return { total, summeZiel: out.reduce((s, g) => s + g.ziel, 0), gruppen: out };
}

/**
 * Where a rule and a goal disagree. titel: [{ id, gruppe, betrag, faktor }] (the suggestion of its rule today),
 * v: the answer of `verteilung`. → [{ id, gruppe, art: 'kauft-ueber' | 'kauft-wenig-unter', betrag }]:
 *  - 'kauft-ueber': the rule buys, but its group is above its goal (outside the band);
 *  - 'kauft-wenig-unter': the group is below its goal (outside the band) and the rule buys less than its base amount.
 */
export function widersprueche(titel, v) {
  const nach = new Map(v.gruppen.map((g) => [g.id, g]));
  const out = [];
  for (const t of titel ?? []) {
    const g = nach.get(t.gruppe);
    if (!g || g.ok) continue;
    if (g.abweichung > 0 && t.betrag > 0) out.push({ id: t.id, gruppe: t.gruppe, art: 'kauft-ueber', betrag: t.betrag });
    else if (g.abweichung < 0 && t.faktor < 1) out.push({ id: t.id, gruppe: t.gruppe, art: 'kauft-wenig-unter', betrag: t.betrag });
  }
  return out;
}
