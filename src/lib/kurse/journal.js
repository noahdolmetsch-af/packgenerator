/**
 * «Kursblick» Journal und Depots (Noah 23.11.2026 «kurskäufe und verkäufe loggen … fiktive käufe … digitaler twin meiner
 * richtigen portfolios»; Bauplan /mnt/project-files/notes/kursblick-entscheidung-bauplan-2026-11-23, PR 2 von 4).
 * Pure helpers, tested in tests/kurse-journal.test.js and tests/kurse-privat.test.js; no page piece yet.
 *
 * PRIVATE like the holdings: amounts, prices paid and positions stay on the devices. One setting (`kurse.journal`), no
 * database table and no schema change; it goes into the backup file like every setting and into the automatic sync only
 * sealed with the sync code. Nothing of it goes to the price server: it only ever hears the symbol of a title.
 *
 * { depots: [{ id, name, art, eintraege: [{ id, art, titel, tag, menge, preis, gebuehr, betrag, faktor, eroeffnung, ohneTag, quelle }] }] }
 *   depot.art:   'echt' (a real portfolio: it counts) or 'uebung' (made up: it never counts for the whole picture, the goals or the rules)
 *   eintrag.art: 'kauf' and 'verkauf' (menge, preis per piece or gram in francs, gebuehr in francs), 'dividende' (betrag in francs)
 *                and 'split' (the pieces times faktor from tag on)
 *   titel:       'gold' (grams) or a symbol of the price service («NESN.SW»)
 *   eroeffnung:  the entry was taken over from «Meine Zahlen» (quelle: the id of the position there); ohneTag: its day was not known
 *
 * A sale is worked out with the average price of what is held (Noah's answer ★, changeable): the cost of the pieces sold is their
 * share of the cost of all pieces held. The prices of the service are already corrected for splits, so a split multiplies the
 * pieces from its day on (the same rule as in «Meine Zahlen»).
 */
import { SYMBOL, symbolNorm } from './maerkte.js';
import { zahlEin } from './bestand.js';
import { addDays } from './rechnen.js';

export const JOURNAL_KEY = 'kurse.journal';
export const GOLD = 'gold';

/** The kinds of portfolio. `name` is the English text for t(). */
export const DEPOT_ARTEN = [
  { key: 'echt', name: 'Real' },
  { key: 'uebung', name: 'Practice (made up)' },
];
export const depotArtOk = (a) => DEPOT_ARTEN.some((x) => x.key === a);
export const EINTRAG_ARTEN = ['kauf', 'verkauf', 'dividende', 'split'];
export const eintragArtOk = (a) => EINTRAG_ARTEN.includes(a);

const copy = (v) => JSON.parse(JSON.stringify(v));
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const dayOk = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** A title as typed → its key: «gold», or the symbol in capitals. null when it is neither. */
export function titelKey(s) {
  const t = String(s ?? '').trim();
  if (t.toLowerCase() === GOLD) return GOLD;
  const k = symbolNorm(t);
  return SYMBOL.test(k) ? k : null;
}

/** What was saved (or nothing) → a state that can be shown. Broken depots and entries are left out. */
export function lies(saved) {
  const out = { depots: [] };
  if (!saved || !Array.isArray(saved.depots)) return out;
  const dseen = new Set();
  const eseen = new Set();
  for (const d of saved.depots) {
    const id = text(d?.id, 40);
    if (!id || dseen.has(id)) continue;
    dseen.add(id);
    const depot = { id, name: text(d.name, 60), art: depotArtOk(d.art) ? d.art : 'echt', eintraege: [] };
    for (const e of Array.isArray(d.eintraege) ? d.eintraege : []) {
      const eid = text(e?.id, 40);
      const titel = titelKey(e?.titel);
      if (!eid || eseen.has(eid) || !eintragArtOk(e.art) || !titel || !dayOk(e.tag)) continue;
      const x = { id: eid, art: e.art, titel, tag: e.tag };
      if (e.art === 'kauf' || e.art === 'verkauf') {
        if (!(num(e.menge) > 0) || !(num(e.preis) > 0)) continue;
        x.menge = e.menge;
        x.preis = e.preis;
        x.gebuehr = num(e.gebuehr) != null && e.gebuehr >= 0 ? e.gebuehr : 0;
      } else if (e.art === 'dividende') {
        if (!(num(e.betrag) > 0)) continue;
        x.betrag = e.betrag;
      } else {
        if (!(num(e.faktor) > 0) || e.faktor === 1) continue;
        x.faktor = e.faktor;
      }
      if (e.eroeffnung === true) {
        x.eroeffnung = true;
        if (e.ohneTag === true) x.ohneTag = true;
        const q = text(e.quelle, 40);
        if (q) x.quelle = q;
      }
      eseen.add(eid);
      depot.eintraege.push(x);
    }
    out.depots.push(depot);
  }
  return out;
}

let counter = 0;
/** A new id; `now` and `rand` only for the tests. */
export const newId = (prefix, now = Date.now(), rand = Math.random()) => `${prefix}${now.toString(36)}${(counter++).toString(36)}${Math.floor(rand * 1296).toString(36)}`;

export const standardJournal = () => copy({ depots: [] });

/* ---------- depots ---------- */

/** Add a portfolio. → { state, depot } or { error: 'name' }. */
export function neuesDepot(state, d, id = newId('d')) {
  const name = text(d?.name, 60);
  if (!name) return { error: 'name' };
  const depot = { id, name, art: depotArtOk(d?.art) ? d.art : 'echt', eintraege: [] };
  return { state: { ...state, depots: [...state.depots, depot] }, depot };
}

/** Rename a portfolio or change its kind. → { state } or { error: 'gone' | 'name' }. */
export function aendereDepot(state, id, d) {
  const old = state.depots.find((x) => x.id === id);
  if (!old) return { error: 'gone' };
  const name = d && 'name' in d ? text(d.name, 60) : old.name;
  if (!name) return { error: 'name' };
  const art = d && 'art' in d && depotArtOk(d.art) ? d.art : old.art;
  return { state: { ...state, depots: state.depots.map((x) => (x.id === id ? { ...x, name, art } : x)) } };
}

/**
 * Delete a portfolio (the page asks first and offers Undo with the old state). With `to` (another portfolio) its entries are
 * moved there first; without it they go with it. A sale that then has too little behind it is flagged by `rechne`, not refused.
 */
export function loescheDepot(state, id, to = '') {
  const from = state.depots.find((x) => x.id === id);
  const ziel = to && to !== id ? state.depots.find((x) => x.id === to) : null;
  const rest = state.depots.filter((x) => x.id !== id);
  if (!from || !ziel) return { ...state, depots: rest };
  return { ...state, depots: rest.map((x) => (x.id === ziel.id ? { ...x, eintraege: [...x.eintraege, ...from.eintraege] } : x)) };
}

/** One place up (-1) or down (+1). */
export function schiebeDepot(state, id, richtung) {
  const i = state.depots.findIndex((x) => x.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= state.depots.length) return state;
  const depots = [...state.depots];
  [depots[i], depots[j]] = [depots[j], depots[i]];
  return { ...state, depots };
}

/* ---------- entries ---------- */

/** Check the fields of an entry as typed. → { eintrag } (without id) or { error: 'art' | 'titel' | 'tag' | 'menge' | 'preis' | 'gebuehr' | 'betrag' | 'faktor' }. */
export function pruefeEintrag(d) {
  if (!eintragArtOk(d?.art)) return { error: 'art' };
  const titel = titelKey(d.titel);
  if (!titel) return { error: 'titel' };
  if (!dayOk(d.tag)) return { error: 'tag' };
  const e = { art: d.art, titel, tag: d.tag };
  if (d.art === 'kauf' || d.art === 'verkauf') {
    const m = zahlEin(d.menge);
    if (!(m > 0)) return { error: 'menge' };
    const p = zahlEin(d.preis);
    if (!(p > 0)) return { error: 'preis' };
    const g = d.gebuehr === '' || d.gebuehr == null ? 0 : zahlEin(d.gebuehr);
    if (g == null || g < 0) return { error: 'gebuehr' };
    Object.assign(e, { menge: m, preis: p, gebuehr: g });
  } else if (d.art === 'dividende') {
    const b = zahlEin(d.betrag);
    if (!(b > 0)) return { error: 'betrag' };
    e.betrag = b;
  } else {
    const f = zahlEin(d.faktor);
    if (!(f > 0) || f === 1) return { error: 'faktor' };
    e.faktor = f;
  }
  return { eintrag: e };
}

const RANG = { split: 0, kauf: 1, verkauf: 2, dividende: 3 };
/** The entries in the order they happened: by day; on one day a split first, then buys, then sales, then dividends. */
export function geordnet(eintraege) {
  return eintraege
    .map((e, i) => [e, i])
    .sort((a, b) => (a[0].tag < b[0].tag ? -1 : a[0].tag > b[0].tag ? 1 : RANG[a[0].art] - RANG[b[0].art] || a[1] - b[1]))
    .map((x) => x[0]);
}

/**
 * Work out a list of entries (one portfolio, or all real ones, or those of one title).
 * → { positionen: { [titel]: { menge, kosten } }, eingesetzt, erloes, gebuehren, realisiert, dividenden, zuviel }
 *  - eingesetzt: all purchases with their fees; erloes: all sales after their fees;
 *  - realisiert: profit or loss of the sales (proceeds minus the average cost of the pieces sold);
 *  - zuviel: { entryId: pieces held that day } for a sale of more than was held (the entries are kept, flagged; nothing is blocked).
 */
export function rechne(eintraege) {
  const r = { positionen: {}, eingesetzt: 0, erloes: 0, gebuehren: 0, realisiert: 0, dividenden: 0, zuviel: {} };
  for (const e of geordnet(eintraege ?? [])) {
    const p = (r.positionen[e.titel] ??= { menge: 0, kosten: 0 });
    if (e.art === 'kauf') {
      const k = e.menge * e.preis + e.gebuehr;
      p.menge += e.menge;
      p.kosten += k;
      r.eingesetzt += k;
      r.gebuehren += e.gebuehr;
    } else if (e.art === 'verkauf') {
      if (e.menge > p.menge + 1e-9) r.zuviel[e.id] = p.menge;
      const q = Math.min(e.menge, p.menge);
      const schnitt = p.menge > 0 ? p.kosten / p.menge : 0;
      const erloes = e.menge * e.preis - e.gebuehr;
      r.erloes += erloes;
      r.gebuehren += e.gebuehr;
      r.realisiert += erloes - schnitt * q;
      p.kosten -= schnitt * q;
      p.menge -= q;
      if (p.menge < 1e-9) {
        p.menge = 0;
        p.kosten = 0;
      }
    } else if (e.art === 'dividende') r.dividenden += e.betrag;
    else p.menge *= e.faktor;
  }
  return r;
}

/** The pieces (or grams) held at the end of a day: { titel: menge } (titles held only). */
export function bestandAm(eintraege, tag) {
  const out = {};
  for (const [t, p] of Object.entries(rechne((eintraege ?? []).filter((e) => e.tag <= tag)).positionen)) if (p.menge > 0) out[t] = p.menge;
  return out;
}

/** Would this sale be more than what is held that day? → the pieces held, or null when it is fine. */
function zuvielBei(depot, eintrag) {
  const z = rechne(depot.eintraege.map((e) => (e.id === eintrag.id ? eintrag : e)).concat(depot.eintraege.some((e) => e.id === eintrag.id) ? [] : [eintrag])).zuviel;
  return eintrag.id in z ? z[eintrag.id] : null;
}

/** Add an entry to a portfolio. → { state, eintrag } or { error: 'gone' | <pruefeEintrag> | 'zuviel', gehalten }. */
export function neuerEintrag(state, depotId, d, id = newId('e')) {
  const depot = state.depots.find((x) => x.id === depotId);
  if (!depot) return { error: 'gone' };
  const r = pruefeEintrag(d);
  if (r.error) return r;
  const eintrag = { id, ...r.eintrag };
  const z = eintrag.art === 'verkauf' ? zuvielBei(depot, eintrag) : null;
  if (z != null) return { error: 'zuviel', gehalten: z };
  return { state: { ...state, depots: state.depots.map((x) => (x.id === depotId ? { ...x, eintraege: [...x.eintraege, eintrag] } : x)) }, eintrag };
}

/** Change an entry (fields as typed; what is not given stays). → { state } or { error }. A change keeps its id and its «Eröffnung» mark. */
export function aendereEintrag(state, depotId, id, d) {
  const depot = state.depots.find((x) => x.id === depotId);
  const old = depot?.eintraege.find((e) => e.id === id);
  if (!old) return { error: 'gone' };
  const r = pruefeEintrag({ ...old, ...d });
  if (r.error) return r;
  const eintrag = { id, ...r.eintrag };
  for (const k of ['eroeffnung', 'ohneTag', 'quelle']) if (old[k] !== undefined) eintrag[k] = old[k];
  if (eintrag.ohneTag && eintrag.tag !== old.tag) delete eintrag.ohneTag;
  const z = eintrag.art === 'verkauf' ? zuvielBei(depot, eintrag) : null;
  if (z != null) return { error: 'zuviel', gehalten: z };
  return { state: { ...state, depots: state.depots.map((x) => (x.id === depotId ? { ...x, eintraege: x.eintraege.map((e) => (e.id === id ? eintrag : e)) } : x)) } };
}

/** Delete an entry. Never blocked: a sale that then has too little behind it is flagged by `rechne`, not refused. */
export const loescheEintrag = (state, depotId, id) => ({
  ...state,
  depots: state.depots.map((x) => (x.id === depotId ? { ...x, eintraege: x.eintraege.filter((e) => e.id !== id) } : x)),
});

/** The entries of one title. */
export const nurTitel = (eintraege, titel) => (titel ? (eintraege ?? []).filter((e) => e.titel === titel) : eintraege ?? []);

/** All entries of the real portfolios (a practice portfolio never counts). */
export const echteEintraege = (state) => state.depots.filter((d) => d.art === 'echt').flatMap((d) => d.eintraege);

/** The titles that entries ask for, symbols only (gold has its own series): to load the prices. */
export function symbole(state) {
  const s = new Set();
  for (const d of state.depots) for (const e of d.eintraege) if (e.titel !== GOLD) s.add(e.titel);
  return [...s];
}

/* ---------- value ---------- */

/**
 * The value of a worked-out list today. preise: { titel: price per piece or gram in francs (or null/undefined when not known) }.
 * → { wert, offenGewinn, realisiert, dividenden, eingesetzt, erloes, gesamt, gesamtPct, positionen: [{ titel, menge, kosten, schnitt, wert, gewinn, pct }], fehlt }
 *  - gesamt: value now + proceeds + dividends − all purchases; null (with the titles in `fehlt`) when a held title has no price: nothing is guessed.
 */
export function bewerteRechnung(r, preise = {}) {
  const positionen = [];
  const fehlt = [];
  let wert = 0;
  let offenGewinn = 0;
  for (const [titel, p] of Object.entries(r.positionen)) {
    if (!(p.menge > 0)) continue;
    const preis = preise[titel];
    const w = preis > 0 ? p.menge * preis : null;
    if (w == null) fehlt.push(titel);
    else {
      wert += w;
      offenGewinn += w - p.kosten;
    }
    positionen.push({ titel, menge: p.menge, kosten: p.kosten, schnitt: p.kosten / p.menge, wert: w, gewinn: w == null ? null : w - p.kosten, pct: w == null || !(p.kosten > 0) ? null : (w / p.kosten - 1) * 100 });
  }
  const gesamt = fehlt.length ? null : wert + r.erloes + r.dividenden - r.eingesetzt;
  return { wert, offenGewinn, realisiert: r.realisiert, dividenden: r.dividenden, eingesetzt: r.eingesetzt, erloes: r.erloes, gesamt, gesamtPct: gesamt == null || !(r.eingesetzt > 0) ? null : (gesamt / r.eingesetzt) * 100, positionen, fehlt };
}

/**
 * The course of a list of entries over time. tage: the days to look at, ascending (for example the days of a price series);
 * preisAm(titel, tag) → price in francs or null (the last known price is kept when a day has none).
 * → { tage, wert, netto } from the first entry's day on, or null; netto is what is paid in net (purchases with fees minus proceeds).
 */
export function verlauf(eintraege, tage, preisAm) {
  const es = geordnet(eintraege ?? []);
  if (!es.length || !tage?.length) return null;
  const out = { tage: [], wert: [], netto: [] };
  const menge = {};
  const letzter = {};
  let netto = 0;
  let k = 0;
  for (const tag of tage) {
    if (tag < es[0].tag) continue;
    while (k < es.length && es[k].tag <= tag) {
      const e = es[k++];
      if (e.art === 'kauf') {
        menge[e.titel] = (menge[e.titel] ?? 0) + e.menge;
        netto += e.menge * e.preis + e.gebuehr;
      } else if (e.art === 'verkauf') {
        menge[e.titel] = Math.max(0, (menge[e.titel] ?? 0) - e.menge);
        netto -= e.menge * e.preis - e.gebuehr;
      } else if (e.art === 'split') menge[e.titel] = (menge[e.titel] ?? 0) * e.faktor;
    }
    let w = 0;
    for (const [t, m] of Object.entries(menge)) {
      if (!(m > 0)) continue;
      const p = preisAm(t, tag);
      if (p > 0) letzter[t] = p;
      w += m * (letzter[t] ?? 0);
    }
    out.tage.push(tag);
    out.wert.push(w);
    out.netto.push(netto);
  }
  return out.tage.length ? out : null;
}

/* ---------- from «Meine Zahlen» ---------- */

/**
 * The holdings of «Meine Zahlen» as «Eröffnung» entries for a real portfolio. The positions there stay as they are (this
 * only reads them). bestand: the state of `kurse.bestand`; heute: the day of the takeover (for positions without a purchase day).
 * → { eintraege, uebersprungen: [{ id, grund: 'hand' | 'menge' | 'einstand' }] }
 *  - a position with pieces and a price paid becomes one purchase (price per piece = what it cost ÷ pieces, with fees inside the price);
 *  - its dividends and splits become entries of their own;
 *  - without a purchase day the day is set just before its first dividend or split, else `heute`, and marked `ohneTag`;
 *  - a value by hand (a savings account, a flat) stays where it is; a position without pieces or without a price paid is not
 *    taken over (nothing is made up) and is named in `uebersprungen`.
 */
export function eroeffnungAus(bestand, heute, idFn = newId) {
  const eintraege = [];
  const uebersprungen = [];
  for (const p of bestand?.posten ?? []) {
    if (p.art === 'hand') {
      uebersprungen.push({ id: p.id, grund: 'hand' });
      continue;
    }
    if (!(p.menge > 0)) {
      uebersprungen.push({ id: p.id, grund: 'menge' });
      continue;
    }
    if (!(p.einstand > 0)) {
      uebersprungen.push({ id: p.id, grund: 'einstand' });
      continue;
    }
    const titel = p.art === 'gold' ? GOLD : symbolNorm(p.symbol);
    const erster = (p.ereignisse ?? []).map((e) => e.tag).sort()[0];
    const tag = p.gekauft || (erster && erster <= heute ? addDays(erster, -1) : heute);
    const eroeff = { eroeffnung: true, quelle: p.id };
    if (!p.gekauft) eroeff.ohneTag = true;
    eintraege.push({ id: idFn('e'), art: 'kauf', titel, tag, menge: p.menge, preis: p.einstand / p.menge, gebuehr: 0, ...eroeff });
    for (const ev of p.ereignisse ?? []) {
      if (ev.typ === 'dividende') eintraege.push({ id: idFn('e'), art: 'dividende', titel, tag: ev.tag, betrag: ev.betrag, ...eroeff });
      else if (ev.typ === 'split') eintraege.push({ id: idFn('e'), art: 'split', titel, tag: ev.tag, faktor: ev.faktor, ...eroeff });
    }
  }
  return { eintraege, uebersprungen };
}

/**
 * Take the holdings over into a real portfolio (a new one named `name` when `depotId` is not given, gone or not a real one).
 * Taking over twice does not double anything: positions that already have an «Eröffnung» entry in that portfolio are skipped.
 * → { state, depotId, neu: number of entries added, uebersprungen }.
 */
export function uebernehmen(state, bestand, heute, { depotId = '', name = 'My portfolio', idFn = newId } = {}) {
  let st = state;
  let depot = st.depots.find((d) => d.id === depotId && d.art === 'echt');
  if (!depot) {
    const r = neuesDepot(st, { name, art: 'echt' }, idFn('d'));
    st = r.state;
    depot = r.depot;
  }
  const schon = new Set(depot.eintraege.filter((e) => e.eroeffnung).map((e) => e.quelle));
  const { eintraege, uebersprungen } = eroeffnungAus({ posten: (bestand?.posten ?? []).filter((p) => !schon.has(p.id)) }, heute, idFn);
  return {
    state: { ...st, depots: st.depots.map((d) => (d.id === depot.id ? { ...d, eintraege: [...d.eintraege, ...eintraege] } : d)) },
    depotId: depot.id,
    neu: eintraege.length,
    uebersprungen,
  };
}
