/**
 * «Kursblick» Mein Bestand (Noah 22.11.2026 «alles davon»; Bauplan K12 und K14): what the person owns, with profit or loss,
 * dividends and splits. Pure helpers, tested in tests/kurse-bestand.test.js; the page piece is Bestand.svelte.
 *
 * PRIVATE: amounts, prices paid and positions stay on the devices. One setting (`kurse.bestand`), no database table and no
 * schema change; it goes into the backup file like every setting and into the automatic sync only sealed with the sync
 * code (like all other data). Nothing of it goes to the price server: it only ever hears the symbol of a title.
 *
 * { posten: [{ id, art, name, symbol, menge, einstand, gekauft, wert, stand, notiz, ereignisse: [{ id, typ, tag, betrag, faktor }] }] }
 *   art:       'titel' (a share, a fund, a coin: by its Yahoo symbol), 'gold' (grams) or 'hand' (a value typed by hand:
 *              «Mein Sparkonto», a flat, a bond …)
 *   menge:     pieces, or grams for gold, at the time of the purchase
 *   einstand:  what it cost in total, in francs, with fees (or null when not known)
 *   gekauft:   the day of the purchase (or '')
 *   wert:      for 'hand' only: the value in francs, `stand` the day of that value
 *   ereignisse: 'dividende' (a payout in francs: betrag) and 'split' (the pieces times faktor from tag on)
 * The prices of Yahoo are corrected for splits, so a split the person owns must multiply the pieces; a dividend is money
 * received and is not in the price. Both are typed by the person: the free sources do not deliver them reliably.
 */
import { SYMBOL, symbolNorm } from './maerkte.js';

export const BESTAND_KEY = 'kurse.bestand';

/** The kinds of position. `name` is the English text for t(). */
export const POSTEN_ARTEN = [
  { key: 'titel', name: 'Share, fund or coin' },
  { key: 'gold', name: 'Gold' },
  { key: 'hand', name: 'Value by hand' },
];
export const postenArtOk = (a) => POSTEN_ARTEN.some((x) => x.key === a);

const copy = (v) => JSON.parse(JSON.stringify(v));
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const dayOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** What was typed («1'250.50», «1250,5», «») → a number, or null when it is empty or no number. */
export function zahlEin(s) {
  if (typeof s === 'number') return Number.isFinite(s) ? s : null;
  const v = String(s ?? '').replace(/[\s'’]/g, '').replace(',', '.');
  if (!v || !/^-?\d*\.?\d+$/.test(v)) return null;
  return Number(v);
}

/** What was saved (or nothing) → a state that can be shown. Broken entries are left out. */
export function lies(saved) {
  const out = { posten: [] };
  if (!saved || !Array.isArray(saved.posten)) return out;
  const seen = new Set();
  for (const p of saved.posten) {
    const id = text(p?.id, 40);
    if (!id || seen.has(id) || !postenArtOk(p.art)) continue;
    seen.add(id);
    const x = { id, art: p.art, name: text(p.name, 80), symbol: '', menge: null, einstand: num(p.einstand) != null && num(p.einstand) >= 0 ? num(p.einstand) : null, gekauft: dayOk(p.gekauft) ? p.gekauft : '', wert: null, stand: '', notiz: text(p.notiz, 200), ereignisse: [] };
    if (p.art === 'titel') {
      x.symbol = symbolNorm(p.symbol);
      if (!SYMBOL.test(x.symbol)) continue;
    }
    if (p.art !== 'hand') x.menge = num(p.menge) > 0 ? num(p.menge) : null;
    if (p.art === 'hand') {
      x.wert = num(p.wert) != null && num(p.wert) >= 0 ? num(p.wert) : null;
      x.stand = dayOk(p.stand) ? p.stand : '';
    }
    const ev = new Set();
    for (const e of Array.isArray(p.ereignisse) ? p.ereignisse : []) {
      const eid = text(e?.id, 40);
      if (!eid || ev.has(eid) || !dayOk(e.tag)) continue;
      if (e.typ === 'dividende' && num(e.betrag) > 0) x.ereignisse.push({ id: eid, typ: 'dividende', tag: e.tag, betrag: e.betrag });
      else if (e.typ === 'split' && num(e.faktor) > 0) x.ereignisse.push({ id: eid, typ: 'split', tag: e.tag, faktor: e.faktor });
      else continue;
      ev.add(eid);
    }
    x.ereignisse.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
    out.posten.push(x);
  }
  return out;
}

let counter = 0;
/** A new id; `now` and `rand` only for the tests. */
export const newId = (prefix, now = Date.now(), rand = Math.random()) => `${prefix}${now.toString(36)}${(counter++).toString(36)}${Math.floor(rand * 1296).toString(36)}`;

/** The shown name of a position: its own name, or what the server called the title, or the symbol, or the kind. `tr` is t. */
export function postenName(p, answerName = '', tr = (v) => v) {
  if (p?.name) return p.name;
  if (p?.art === 'gold') return tr('Gold');
  if (p?.art === 'titel') return answerName || p.symbol || '';
  return tr('Value by hand');
}

/** Check the fields of a position. → { posten } (cleaned) or { error: 'symbol' | 'menge' | 'wert' | 'einstand' | 'name' | 'tag' }. */
export function pruefePosten(d) {
  const art = postenArtOk(d?.art) ? d.art : 'titel';
  const out = { art, name: text(d?.name, 80), symbol: '', menge: null, einstand: null, gekauft: '', wert: null, stand: '', notiz: text(d?.notiz, 200) };
  if (art === 'titel') {
    out.symbol = symbolNorm(d?.symbol);
    if (!SYMBOL.test(out.symbol)) return { error: 'symbol' };
  }
  if (art !== 'hand') {
    const m = zahlEin(d?.menge);
    if (!(m > 0)) return { error: 'menge' };
    out.menge = m;
  } else {
    if (!out.name) return { error: 'name' };
    const w = zahlEin(d?.wert);
    if (w == null || w < 0) return { error: 'wert' };
    out.wert = w;
    if (d?.stand && !dayOk(d.stand)) return { error: 'tag' };
    out.stand = d?.stand ?? '';
  }
  const e = zahlEin(d?.einstand);
  if (String(d?.einstand ?? '').trim() !== '' && (e == null || e < 0)) return { error: 'einstand' };
  out.einstand = e;
  if (d?.gekauft && !dayOk(d.gekauft)) return { error: 'tag' };
  out.gekauft = d?.gekauft ?? '';
  return { posten: out };
}

/** Add a position. → { state, posten } or { error }. It goes to the end of the list. */
export function neuerPosten(state, d, id = newId('p')) {
  const r = pruefePosten(d);
  if (r.error) return r;
  const p = { id, ...r.posten, ereignisse: [] };
  return { state: { ...state, posten: [...state.posten, p] }, posten: p };
}

/** Change a position (the kind stays). → { state } or { error }. */
export function aenderePosten(state, id, d) {
  const old = state.posten.find((p) => p.id === id);
  if (!old) return { error: 'gone' };
  const r = pruefePosten({ ...old, ...d, art: old.art });
  if (r.error) return r;
  return { state: { ...state, posten: state.posten.map((p) => (p.id === id ? { ...old, ...r.posten } : p)) } };
}

export const loeschePosten = (state, id) => ({ ...state, posten: state.posten.filter((p) => p.id !== id) });

/** One place up (-1) or down (+1). */
export function schiebePosten(state, id, richtung) {
  const i = state.posten.findIndex((p) => p.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= state.posten.length) return state;
  const posten = [...state.posten];
  [posten[i], posten[j]] = [posten[j], posten[i]];
  return { ...state, posten };
}

/** Add a dividend ({ typ: 'dividende', tag, betrag }) or a split ({ typ: 'split', tag, faktor }). → { state } or { error }. */
export function neuesEreignis(state, postenId, e, id = newId('e')) {
  const p = state.posten.find((x) => x.id === postenId);
  if (!p) return { error: 'gone' };
  if (!dayOk(e?.tag)) return { error: 'tag' };
  let x;
  if (e.typ === 'dividende') {
    const b = zahlEin(e.betrag);
    if (!(b > 0)) return { error: 'betrag' };
    x = { id, typ: 'dividende', tag: e.tag, betrag: b };
  } else if (e.typ === 'split') {
    const f = zahlEin(e.faktor);
    if (!(f > 0) || f === 1) return { error: 'faktor' };
    x = { id, typ: 'split', tag: e.tag, faktor: f };
  } else return { error: 'typ' };
  const ereignisse = [...p.ereignisse, x].sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  return { state: { ...state, posten: state.posten.map((y) => (y.id === postenId ? { ...y, ereignisse } : y)) } };
}

export const loescheEreignis = (state, postenId, id) => ({
  ...state,
  posten: state.posten.map((p) => (p.id === postenId ? { ...p, ereignisse: p.ereignisse.filter((e) => e.id !== id) } : p)),
});

/** The pieces (or grams) today: the pieces at the purchase times every split from the purchase on. */
export function mengeJetzt(p) {
  if (!(p?.menge > 0)) return 0;
  return p.ereignisse.filter((e) => e.typ === 'split' && (!p.gekauft || e.tag > p.gekauft)).reduce((m, e) => m * e.faktor, p.menge);
}

/** All dividends received, in francs. */
export const dividenden = (p) => (p?.ereignisse ?? []).filter((e) => e.typ === 'dividende').reduce((s, e) => s + e.betrag, 0);

/**
 * The currency a price comes in → { code, mult }: the code of the currency to ask the rate for and the factor from the
 * smallest unit («GBp» are pence: 0.01 pound). '' for a Swiss title (.SW) is francs; other titles without a currency are unknown (null).
 */
export function waehrungVon(currency, symbol = '') {
  const c = String(currency ?? '').trim();
  if (!c) return /\.SW$/i.test(symbol) ? { code: 'CHF', mult: 1 } : null;
  if (c === 'GBp' || c === 'GBX') return { code: 'GBP', mult: 0.01 };
  if (!/^[A-Za-z]{3}$/.test(c)) return null;
  return { code: c.toUpperCase(), mult: 1 };
}

/** The id of the series that holds francs per unit of a currency (null for francs). USD uses the dollar rate the app has anyway. */
export const kursId = (code) => (code === 'CHF' ? null : code === 'USD' ? 'usdchf' : `y:${code}CHF=X`);

/**
 * The value of one position today.
 * ctx: { preis: last close of the title in its own currency (or null), kurs: francs per unit of that currency (or null),
 *        goldKg: francs per kilogram of gold (or null) }.
 * → { wert, einstand, gewinn, pct, dividenden, mitDiv: { gewinn, pct }, grund }; wert is null with a `grund`
 * ('preis' | 'kurs' | 'menge') when it cannot be told; gewinn and pct are null without a known einstand.
 */
export function bewerte(p, ctx = {}) {
  const out = { wert: null, einstand: p.einstand ?? null, gewinn: null, pct: null, dividenden: dividenden(p), mitDiv: { gewinn: null, pct: null }, grund: '' };
  if (p.art === 'hand') out.wert = p.wert;
  else if (!(mengeJetzt(p) > 0)) out.grund = 'menge';
  else if (p.art === 'gold') {
    if (ctx.goldKg > 0) out.wert = (mengeJetzt(p) / 1000) * ctx.goldKg;
    else out.grund = 'preis';
  } else if (!(ctx.preis > 0)) out.grund = 'preis';
  else if (!(ctx.kurs > 0)) out.grund = 'kurs';
  else out.wert = mengeJetzt(p) * ctx.preis * ctx.kurs;
  if (out.wert != null && out.einstand != null && out.einstand > 0) {
    out.gewinn = out.wert - out.einstand;
    out.pct = (out.gewinn / out.einstand) * 100;
    out.mitDiv = { gewinn: out.gewinn + out.dividenden, pct: ((out.gewinn + out.dividenden) / out.einstand) * 100 };
  }
  return out;
}

/**
 * The whole holding from the values of its positions. Profit and loss count only positions with a value and a known price
 * paid; the others are in `wert` but not in `gewinn`. `offen`: positions whose value could not be told.
 */
export function summe(bewertungen) {
  const s = { wert: 0, einstand: 0, gewinn: 0, dividenden: 0, pct: null, mitDiv: { gewinn: 0, pct: null }, offen: 0, ohneEinstand: 0 };
  for (const b of bewertungen) {
    if (b.wert == null) {
      s.offen++;
      continue;
    }
    s.wert += b.wert;
    if (b.gewinn == null) {
      s.ohneEinstand++;
      continue;
    }
    s.einstand += b.einstand;
    s.gewinn += b.gewinn;
    s.dividenden += b.dividenden;
  }
  s.mitDiv.gewinn = s.gewinn + s.dividenden;
  if (s.einstand > 0) {
    s.pct = (s.gewinn / s.einstand) * 100;
    s.mitDiv.pct = (s.mitDiv.gewinn / s.einstand) * 100;
  }
  return s;
}

export const standardBestand = () => copy({ posten: [] });
