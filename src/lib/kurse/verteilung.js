/**
 * «Kursblick» Verteilung (Noah 23.11.2026 «einzelne neue Aktien … Obligationen. ETFs», «Krypto, Rohstoffe, Immobilien, Sparkonto»;
 * PR 5 von 5): the groups of a whole picture (gold, stocks and funds, bonds, crypto, real estate, savings), each with a goal in
 * percent, a band in points, the titles of the real portfolios sorted into them, and values written by hand (a savings account,
 * a flat, a pillar-3a account: things without a price). Pure data and rules; the screen is Verteilung.svelte.
 *
 * PRIVATE: the setting `kurse.verteilung` lives on the devices, in the backup file and sealed in the sync; the price server never
 * hears of it. Only real portfolios count (a practice portfolio is made up). A suggestion, never advice. Tested in tests/kurse-verteilung.test.js.
 */
import { zielProzent } from './signale.js';
import { GOLD, titelKey, newId } from './journal.js';

export const VERTEILUNG_KEY = 'kurse.verteilung';
/** The points a group may be off its goal before it is flagged (a band, so a small move is not a verdict). */
export const SPIELRAUM_STANDARD = 5;
export const SPIELRAUM_MAX = 50;

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The groups a person starts with: all of them can be renamed, given another goal and deleted. */
export const STANDARD_GRUPPEN = [
  { id: 'gold', std: 'Gold' },
  { id: 'aktien', std: 'Stocks and funds' },
  { id: 'obligationen', std: 'Bonds' },
  { id: 'krypto', std: 'Crypto' },
  { id: 'immobilien', std: 'Real estate' },
  { id: 'cash', std: 'Savings and cash' },
];

export const standardVerteilung = () => ({ gruppen: STANDARD_GRUPPEN.map((g) => ({ ...g, ziel: 0 })), spielraum: SPIELRAUM_STANDARD, zuordnung: {}, hand: [] });

/** The shown name of a group: its own name, or the translated standard name. `tr` is t. */
export const gruppenName = (g, tr) => g?.name || (g?.std ? tr(g.std) : '');

/** What was saved (or nothing) → a state that can be shown. Nothing saved: the standard groups. Broken parts are left out. */
export function lies(saved) {
  if (!saved || !Array.isArray(saved.gruppen)) return standardVerteilung();
  const gruppen = [];
  const seen = new Set();
  for (const g of saved.gruppen) {
    const id = text(g?.id, 40);
    if (!id || seen.has(id)) continue;
    const std = STANDARD_GRUPPEN.find((x) => x.id === id)?.std;
    const name = text(g.name, 60);
    if (!name && !std) continue;
    seen.add(id);
    const out = { id, ziel: zielProzent(g.ziel) };
    if (std) out.std = std;
    if (name) out.name = name;
    gruppen.push(out);
  }
  const zuordnung = {};
  if (saved.zuordnung && typeof saved.zuordnung === 'object') for (const [titel, gid] of Object.entries(saved.zuordnung)) if (titelKey(titel) && seen.has(gid)) zuordnung[titel] = gid;
  const hand = [];
  const hseen = new Set();
  for (const h of Array.isArray(saved.hand) ? saved.hand : []) {
    const id = text(h?.id, 40);
    const name = text(h?.name, 60);
    if (!id || hseen.has(id) || !name || !(num(h.wert) >= 0)) continue;
    hseen.add(id);
    hand.push({ id, name, gruppe: seen.has(h.gruppe) ? h.gruppe : '', wert: h.wert });
  }
  const sp = num(saved.spielraum);
  return { gruppen, spielraum: sp != null && sp >= 0 ? Math.min(SPIELRAUM_MAX, sp) : SPIELRAUM_STANDARD, zuordnung, hand };
}

/* ---------- groups ---------- */

/** Add an own group. → { state, gruppe } or { error: 'name' | 'dup' }. */
export function neueGruppe(state, name, tr = (v) => v, id = newId('g')) {
  const n = text(name, 60);
  if (!n) return { error: 'name' };
  if (state.gruppen.some((g) => gruppenName(g, tr).toLowerCase() === n.toLowerCase())) return { error: 'dup' };
  const gruppe = { id, name: n, ziel: 0 };
  return { state: { ...state, gruppen: [...state.gruppen, gruppe] }, gruppe };
}

/** Rename a group. An empty name brings a standard group back to its own name; an own group needs a name. */
export function benenneGruppe(state, id, name, tr = (v) => v) {
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

/**
 * Delete a group (the page asks first and offers Undo with the old state). The titles and the values by hand that were in it move to
 * `to` (another group) or, without `to`, to «No group»: nothing is ever deleted with a group.
 */
export function loescheGruppe(state, id, to = '') {
  const ziel = to && to !== id && state.gruppen.some((g) => g.id === to) ? to : '';
  const zuordnung = {};
  for (const [titel, gid] of Object.entries(state.zuordnung)) {
    if (gid !== id) zuordnung[titel] = gid;
    else if (ziel) zuordnung[titel] = ziel;
  }
  return {
    ...state,
    gruppen: state.gruppen.filter((g) => g.id !== id),
    zuordnung,
    hand: state.hand.map((h) => (h.gruppe === id ? { ...h, gruppe: ziel } : h)),
  };
}

/** One place up (-1) or down (+1). */
export function schiebeGruppe(state, id, richtung) {
  const i = state.gruppen.findIndex((g) => g.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= state.gruppen.length) return state;
  const gruppen = [...state.gruppen];
  [gruppen[i], gruppen[j]] = [gruppen[j], gruppen[i]];
  return { ...state, gruppen };
}

/** The goal of a group in percent (0 to 100; anything else counts as 0). */
export const setzeZiel = (state, id, ziel) => ({ ...state, gruppen: state.gruppen.map((g) => (g.id === id ? { ...g, ziel: zielProzent(ziel) } : g)) });

/** The band in points (0 to 50). */
export const setzeSpielraum = (state, punkte) => ({ ...state, spielraum: num(punkte) != null && punkte >= 0 ? Math.min(SPIELRAUM_MAX, punkte) : SPIELRAUM_STANDARD });

/* ---------- titles ---------- */

/** The group of a title: the one the person chose, or Gold for gold, or '' (not sorted yet). */
export function gruppeVon(state, titel) {
  const g = state.zuordnung[titel];
  if (g && state.gruppen.some((x) => x.id === g)) return g;
  return titel === GOLD && state.gruppen.some((x) => x.id === 'gold') ? 'gold' : '';
}

/** Put a title into a group ('' takes it out again, back to «not sorted yet»). */
export function ordneZu(state, titel, gruppe) {
  const zuordnung = { ...state.zuordnung };
  if (gruppe && state.gruppen.some((g) => g.id === gruppe)) zuordnung[titel] = gruppe;
  else delete zuordnung[titel];
  return { ...state, zuordnung };
}

/* ---------- values by hand ---------- */

/** A value as typed («12 500», «12'500.50», «12500,5») → a number or null. */
export function wertAus(s) {
  const n = String(s ?? '').trim().replace(/[\s'’]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(n)) return null;
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

function pruefeHand(d, state) {
  const name = text(d?.name, 60);
  if (!name) return { error: 'name' };
  const wert = typeof d?.wert === 'number' ? (Number.isFinite(d.wert) && d.wert >= 0 ? d.wert : null) : wertAus(d?.wert);
  if (wert == null) return { error: 'wert' };
  const gruppe = state.gruppen.some((g) => g.id === d?.gruppe) ? d.gruppe : '';
  return { hand: { name, gruppe, wert } };
}

/** Write down a value by hand. → { state, hand } or { error: 'name' | 'wert' }. */
export function neuerHandwert(state, d, id = newId('h')) {
  const r = pruefeHand(d, state);
  if (r.error) return r;
  const hand = { id, ...r.hand };
  return { state: { ...state, hand: [...state.hand, hand] }, hand };
}

/** Change a value by hand. → { state } or { error: 'gone' | 'name' | 'wert' }. */
export function aendereHandwert(state, id, d) {
  if (!state.hand.some((h) => h.id === id)) return { error: 'gone' };
  const r = pruefeHand(d, state);
  if (r.error) return r;
  return { state: { ...state, hand: state.hand.map((h) => (h.id === id ? { id, ...r.hand } : h)) } };
}

export const loescheHandwert = (state, id) => ({ ...state, hand: state.hand.filter((h) => h.id !== id) });

/* ---------- the whole picture ---------- */

/**
 * The value of each group in francs: the positions of the real portfolios (positionen: [{ titel, wert }], wert null when no price)
 * sorted by group, plus the values by hand. → { werte: { groupId: francs, '': francs not sorted }, fehlt: [titel without a price] }.
 */
export function gruppenWerte(state, positionen) {
  const werte = {};
  const fehlt = [];
  const add = (id, v) => (werte[id] = (werte[id] ?? 0) + v);
  for (const p of positionen ?? []) {
    if (p.wert == null) fehlt.push(p.titel);
    else add(gruppeVon(state, p.titel), p.wert);
  }
  for (const h of state.hand) add(state.gruppen.some((g) => g.id === h.gruppe) ? h.gruppe : '', h.wert);
  return { werte, fehlt };
}
