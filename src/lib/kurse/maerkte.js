/**
 * «Kursblick» Märkte (Noah 22.11.2026 «alles davon»; Bauplan K6): the titles the person follows (shares, funds, coins,
 * metals …) in groups of their own. Pure helpers, tested in tests/kurse-maerkte.test.js; the page piece is Maerkte.svelte.
 *
 * One value, one settings key (`kurse.maerkte`): { gruppen: [{ id, name?, std? }], titel: [{ id, name, symbol, art, gruppe }] }.
 * No database table and no schema change; the backup carries it like every setting. The order of the lists is the order
 * on the screen. Everything is a suggestion: a group or a title of the standard can be renamed and deleted like an own one,
 * and «Restore the suggestions» brings the missing ones back without touching anything else.
 *
 * A title is found by its Yahoo symbol («NESN.SW»); the prices come from the server (api/lake.js ?action=kurse&id=y:SYMBOL).
 * A group the person typed has a `name`; a group of the standard has `std` (the text to translate) until it is renamed.
 */

export const MAERKTE_KEY = 'kurse.maerkte';

/** The kinds of title. `name` is the English text for t(). */
export const ARTEN = [
  { key: 'share', name: 'Share|kurs' },
  { key: 'fund', name: 'Fund or ETF' },
  { key: 'crypto', name: 'Crypto' },
  { key: 'metal', name: 'Metal or raw material' },
  { key: 'money', name: 'Currency or interest' },
  { key: 'other', name: 'Other|kurs' },
];
export const artOk = (a) => ARTEN.some((x) => x.key === a);

/**
 * The groups and titles the app suggests (the plan's K6 to K10). Company and product names are proper names; the plain
 * words (Silver, Coffee …) have `std`, the text to translate until the person types a name of their own.
 * Symbols are Yahoo's: «.SW» is the Swiss exchange, «=F» a futures price, «=X» an exchange rate.
 */
export const STANDARD = {
  gruppen: [
    { id: 'aktien', std: 'Shares|kurs' },
    { id: 'fonds', std: 'Funds and ETFs|kurs' },
    { id: 'krypto', std: 'Crypto' },
    { id: 'metalle', std: 'Metals and raw materials|kurs' },
    { id: 'geld', std: 'Money and currencies|kurs' },
  ],
  titel: [
    { id: 'std-sren', name: 'Swiss Re', symbol: 'SREN.SW', art: 'share', gruppe: 'aktien' },
    { id: 'std-nesn', name: 'Nestlé', symbol: 'NESN.SW', art: 'share', gruppe: 'aktien' },
    { id: 'std-novn', name: 'Novartis', symbol: 'NOVN.SW', art: 'share', gruppe: 'aktien' },
    { id: 'std-rog', name: 'Roche', symbol: 'ROG.SW', art: 'share', gruppe: 'aktien' },
    { id: 'std-schn', name: 'Schindler', symbol: 'SCHN.SW', art: 'share', gruppe: 'aktien' },
    { id: 'std-abbn', name: 'ABB', symbol: 'ABBN.SW', art: 'share', gruppe: 'aktien' },
    { id: 'std-holn', name: 'Holcim', symbol: 'HOLN.SW', art: 'share', gruppe: 'aktien' },
    { id: 'std-cssmi', name: 'iShares SMI', symbol: 'CSSMI.SW', art: 'fund', gruppe: 'fonds' },
    { id: 'std-chspi', name: 'iShares Core SPI', symbol: 'CHSPI.SW', art: 'fund', gruppe: 'fonds' },
    { id: 'std-vwrl', name: 'Vanguard FTSE All-World', symbol: 'VWRL.SW', art: 'fund', gruppe: 'fonds' },
    { id: 'std-swda', name: 'iShares Core MSCI World', symbol: 'SWDA.SW', art: 'fund', gruppe: 'fonds' },
    { id: 'std-btc', name: 'Bitcoin', symbol: 'BTC-USD', art: 'crypto', gruppe: 'krypto' },
    { id: 'std-eth', name: 'Ethereum', symbol: 'ETH-USD', art: 'crypto', gruppe: 'krypto' },
    { id: 'std-silber', std: 'Silver|kurs', symbol: 'SI=F', art: 'metal', gruppe: 'metalle' },
    { id: 'std-platin', std: 'Platinum|kurs', symbol: 'PL=F', art: 'metal', gruppe: 'metalle' },
    { id: 'std-palladium', std: 'Palladium|kurs', symbol: 'PA=F', art: 'metal', gruppe: 'metalle' },
    { id: 'std-kupfer', std: 'Copper|kurs', symbol: 'HG=F', art: 'metal', gruppe: 'metalle' },
    { id: 'std-oel', std: 'Oil (WTI)|kurs', symbol: 'CL=F', art: 'metal', gruppe: 'metalle' },
    { id: 'std-kaffee', std: 'Coffee|kurs', symbol: 'KC=F', art: 'metal', gruppe: 'metalle' },
    { id: 'std-kakao', std: 'Cocoa|kurs', symbol: 'CC=F', art: 'metal', gruppe: 'metalle' },
    { id: 'std-uran', std: 'Uranium (ETF)|kurs', symbol: 'URA', art: 'fund', gruppe: 'metalle' },
    { id: 'std-goldminen', std: 'Gold miners (ETF)|kurs', symbol: 'GDX', art: 'fund', gruppe: 'metalle' },
    { id: 'std-eurchf', std: 'Euro|kurs', symbol: 'EURCHF=X', art: 'money', gruppe: 'geld' },
    { id: 'std-usdchf', std: 'US dollar|kurs', symbol: 'USDCHF=X', art: 'money', gruppe: 'geld' },
    { id: 'std-gbpchf', std: 'Pound|kurs', symbol: 'GBPCHF=X', art: 'money', gruppe: 'geld' },
  ],
};

const copy = (v) => JSON.parse(JSON.stringify(v));
export const standard = () => copy(STANDARD);

/** The same characters as the server lets through (api/_lib/kurse.js YSYMBOL). */
export const SYMBOL = /^[A-Za-z0-9^=.\-]{1,24}$/;
/** A symbol as typed → as Yahoo writes it: no spaces around it, capitals («nesn.sw» → «NESN.SW»). */
export const symbolNorm = (s) => String(s ?? '').trim().toUpperCase();
export const symbolOk = (s) => SYMBOL.test(symbolNorm(s));
/** The id the prices are asked and kept under. */
export const reihenId = (symbol) => `y:${symbolNorm(symbol)}`;

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * What was saved (or nothing) → a state that can be shown. Broken entries are left out; nothing saved means the
 * suggestions. A title whose group is gone is «without group» (gruppe '').
 */
export function lies(saved) {
  if (!saved || typeof saved !== 'object' || !Array.isArray(saved.gruppen) || !Array.isArray(saved.titel)) return standard();
  const seen = new Set();
  const gruppen = [];
  for (const g of saved.gruppen) {
    const id = text(g?.id, 40);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const out = { id };
    const name = text(g.name, 60);
    if (name) out.name = name;
    if (typeof g.std === 'string' && g.std) out.std = g.std;
    if (!out.name && !out.std) continue;
    gruppen.push(out);
  }
  const ids = new Set();
  const titel = [];
  for (const x of saved.titel) {
    const id = text(x?.id, 40);
    const symbol = symbolNorm(x?.symbol);
    if (!id || ids.has(id) || !SYMBOL.test(symbol)) continue;
    ids.add(id);
    const out = { id, name: text(x.name, 80), symbol, art: artOk(x.art) ? x.art : 'other', gruppe: seen.has(x.gruppe) ? x.gruppe : '' };
    if (typeof x.std === 'string' && x.std) out.std = x.std;
    titel.push(out);
  }
  return { gruppen, titel };
}

let counter = 0;
/** A new id; `now` and `rand` only for the tests. */
export const newId = (prefix, now = Date.now(), rand = Math.random()) => `${prefix}${now.toString(36)}${(counter++).toString(36)}${Math.floor(rand * 1296).toString(36)}`;

/** The shown name of a group: its own name, or the translated standard name. `tr` is t. */
export const gruppenName = (g, tr) => g?.name || (g?.std ? tr(g.std) : '');
/** The shown name of a title: its own name, or its translated standard name, or the one the server gave, or the symbol. */
export const titelName = (x, answerName = '', tr = (v) => v) => x?.name || (x?.std ? tr(x.std) : '') || answerName || x?.symbol || '';

/** The groups with their titles, in screen order; titles without a group come last as `{ id: '', titel }`. */
export function ansicht(state) {
  const out = state.gruppen.map((g) => ({ ...g, titel: state.titel.filter((x) => x.gruppe === g.id) }));
  const lose = state.titel.filter((x) => !state.gruppen.some((g) => g.id === x.gruppe));
  if (lose.length) out.push({ id: '', titel: lose });
  return out;
}

/**
 * Add a title. → { state } or { error: 'symbol' | 'dup' }. A symbol that is already followed is not added twice
 * (the second one would only show the same prices again).
 */
export function neuerTitel(state, { name = '', symbol, art = 'share', gruppe = '' }, id = newId('t')) {
  const s = symbolNorm(symbol);
  if (!SYMBOL.test(s)) return { error: 'symbol' };
  if (state.titel.some((x) => x.symbol === s)) return { error: 'dup' };
  const g = state.gruppen.some((x) => x.id === gruppe) ? gruppe : '';
  const x = { id, name: text(name, 80), symbol: s, art: artOk(art) ? art : 'other', gruppe: g };
  // right after the last title of its group, so it shows where the person put it
  const at = state.titel.reduce((n, y, i) => (y.gruppe === g ? i + 1 : n), state.titel.length);
  return { state: { ...state, titel: [...state.titel.slice(0, at), x, ...state.titel.slice(at)] }, titel: x };
}

/** Change a title (name, symbol, kind, group). → { state } or { error }. */
export function aendereTitel(state, id, patch) {
  const old = state.titel.find((x) => x.id === id);
  if (!old) return { error: 'gone' };
  const next = { ...old };
  if ('name' in patch) next.name = text(patch.name, 80);
  if ('symbol' in patch) {
    const s = symbolNorm(patch.symbol);
    if (!SYMBOL.test(s)) return { error: 'symbol' };
    if (state.titel.some((x) => x.id !== id && x.symbol === s)) return { error: 'dup' };
    next.symbol = s;
  }
  if ('art' in patch && artOk(patch.art)) next.art = patch.art;
  if ('gruppe' in patch) next.gruppe = state.gruppen.some((x) => x.id === patch.gruppe) ? patch.gruppe : '';
  return { state: { ...state, titel: state.titel.map((x) => (x.id === id ? next : x)) } };
}

export const loescheTitel = (state, id) => ({ ...state, titel: state.titel.filter((x) => x.id !== id) });

/** One place up (-1) or down (+1) within its group. Nothing changes at the end of the group. */
export function schiebeTitel(state, id, richtung) {
  const x = state.titel.find((y) => y.id === id);
  if (!x) return state;
  const same = state.titel.map((y, i) => [y, i]).filter(([y]) => y.gruppe === x.gruppe);
  const pos = same.findIndex(([y]) => y.id === id);
  const other = same[pos + richtung];
  if (!other) return state;
  const titel = [...state.titel];
  const a = same[pos][1];
  const b = other[1];
  [titel[a], titel[b]] = [titel[b], titel[a]];
  return { ...state, titel };
}

/** A new group. → { state, gruppe } or { error: 'name' | 'dup' } (the same name twice would be confusing). `tr` is t. */
export function neueGruppe(state, name, tr, id = newId('g')) {
  const n = text(name, 60);
  if (!n) return { error: 'name' };
  if (state.gruppen.some((g) => gruppenName(g, tr).toLowerCase() === n.toLowerCase())) return { error: 'dup' };
  const gruppe = { id, name: n };
  return { state: { ...state, gruppen: [...state.gruppen, gruppe] }, gruppe };
}

/**
 * Rename a group. An empty name brings a group of the standard back to its own name; an own group needs a name.
 * → { state } or { error }.
 */
export function benenneGruppe(state, id, name, tr) {
  const g = state.gruppen.find((x) => x.id === id);
  if (!g) return { error: 'gone' };
  const n = text(name, 60);
  if (!n && !g.std) return { error: 'name' };
  if (n && state.gruppen.some((x) => x.id !== id && gruppenName(x, tr).toLowerCase() === n.toLowerCase())) return { error: 'dup' };
  const next = { ...g };
  if (n) next.name = n;
  else delete next.name;
  return { state: { ...state, gruppen: state.gruppen.map((x) => (x.id === id ? next : x)) } };
}

/** Delete a group; its titles go to group `to` or, without it, to «without group». No title is ever deleted. */
export function loescheGruppe(state, id, to = '') {
  const target = state.gruppen.some((g) => g.id === to && g.id !== id) ? to : '';
  return {
    gruppen: state.gruppen.filter((g) => g.id !== id),
    titel: state.titel.map((x) => (x.gruppe === id ? { ...x, gruppe: target } : x)),
  };
}

/** One place up or down in the list of groups. */
export function schiebeGruppe(state, id, richtung) {
  const i = state.gruppen.findIndex((g) => g.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= state.gruppen.length) return state;
  const gruppen = [...state.gruppen];
  [gruppen[i], gruppen[j]] = [gruppen[j], gruppen[i]];
  return { ...state, gruppen };
}

/** The suggestions the person no longer has (a group by its id, a title by its symbol), as a count. */
export function fehlendeVorschlaege(state) {
  return STANDARD.gruppen.filter((g) => !state.gruppen.some((x) => x.id === g.id)).length + STANDARD.titel.filter((x) => !state.titel.some((y) => y.symbol === x.symbol)).length;
}

/** Bring the missing suggestions back. What is there stays as it is (renamed, moved, own). */
export function ergaenzeVorschlaege(state) {
  const gruppen = [...state.gruppen];
  for (const g of STANDARD.gruppen) if (!gruppen.some((x) => x.id === g.id)) gruppen.push({ ...g });
  const titel = [...state.titel];
  for (const x of STANDARD.titel) {
    if (titel.some((y) => y.symbol === x.symbol)) continue;
    const id = titel.some((y) => y.id === x.id) ? newId('t') : x.id;
    titel.push({ ...x, id });
  }
  return { gruppen, titel };
}
