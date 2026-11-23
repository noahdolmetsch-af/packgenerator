/**
 * «Kursblick» Ziele (Noah 22.11.2026 «alles davon»; Bauplan K13): a number the person waits for («Gold über 120 000 CHF pro kg»,
 * «Nestlé unter 80», «Mein Bestand über 50 000»). The app checks it when Kursblick opens and shows it on Heute of the small
 * app; no message while the app is closed (that is K16, not built). Pure helpers, tested in tests/kurse-ziele.test.js.
 *
 * PRIVATE like the holdings: one setting (`kurse.ziele`), only on the devices (backup file, sealed sync).
 * { ziele: [{ id, name, was, symbol, richtung, wert }] }
 *   was:       'gold' (francs per kilogram), 'smi' (points), 'titel' (the price of a title by its symbol, in its own
 *              currency) or 'bestand' (the value of «Mein Bestand» in francs)
 *   richtung:  'ueber' (reached when the number is at or above) or 'unter' (at or below)
 */
import { SYMBOL, symbolNorm } from './maerkte.js';
import { zahlEin } from './bestand.js';

export const ZIELE_KEY = 'kurse.ziele';

/** What a goal can be about. `name` is the English text for t(). */
export const ZIEL_ARTEN = [
  { key: 'gold', name: 'Gold' },
  { key: 'smi', name: 'SMI' },
  { key: 'titel', name: 'A title' },
  { key: 'bestand', name: 'My holdings' },
];
export const zielArtOk = (a) => ZIEL_ARTEN.some((x) => x.key === a);

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** What was saved (or nothing) → a state that can be shown. Broken entries are left out. */
export function lies(saved) {
  const out = { ziele: [] };
  if (!saved || !Array.isArray(saved.ziele)) return out;
  const seen = new Set();
  for (const z of saved.ziele) {
    const id = text(z?.id, 40);
    const wert = typeof z?.wert === 'number' && Number.isFinite(z.wert) ? z.wert : null;
    if (!id || seen.has(id) || !zielArtOk(z.was) || wert == null) continue;
    const x = { id, name: text(z.name, 80), was: z.was, symbol: '', richtung: z.richtung === 'unter' ? 'unter' : 'ueber', wert };
    if (z.was === 'titel') {
      x.symbol = symbolNorm(z.symbol);
      if (!SYMBOL.test(x.symbol)) continue;
    }
    seen.add(id);
    out.ziele.push(x);
  }
  return out;
}

let counter = 0;
export const newId = (prefix, now = Date.now(), rand = Math.random()) => `${prefix}${now.toString(36)}${(counter++).toString(36)}${Math.floor(rand * 1296).toString(36)}`;

/** Check the fields of a goal. → { ziel } (cleaned) or { error: 'symbol' | 'wert' }. */
export function pruefeZiel(d) {
  const was = zielArtOk(d?.was) ? d.was : 'gold';
  const out = { name: text(d?.name, 80), was, symbol: '', richtung: d?.richtung === 'unter' ? 'unter' : 'ueber', wert: null };
  if (was === 'titel') {
    out.symbol = symbolNorm(d?.symbol);
    if (!SYMBOL.test(out.symbol)) return { error: 'symbol' };
  }
  const w = zahlEin(d?.wert);
  if (w == null || w < 0) return { error: 'wert' };
  out.wert = w;
  return { ziel: out };
}

/** Add a goal. → { state, ziel } or { error }. */
export function neuesZiel(state, d, id = newId('z')) {
  const r = pruefeZiel(d);
  if (r.error) return r;
  const z = { id, ...r.ziel };
  return { state: { ...state, ziele: [...state.ziele, z] }, ziel: z };
}

/** Change a goal. → { state } or { error }. */
export function aendereZiel(state, id, d) {
  const old = state.ziele.find((z) => z.id === id);
  if (!old) return { error: 'gone' };
  const r = pruefeZiel({ ...old, ...d });
  if (r.error) return r;
  return { state: { ...state, ziele: state.ziele.map((z) => (z.id === id ? { id, ...r.ziel } : z)) } };
}

export const loescheZiel = (state, id) => ({ ...state, ziele: state.ziele.filter((z) => z.id !== id) });

/** One place up (-1) or down (+1). */
export function schiebeZiel(state, id, richtung) {
  const i = state.ziele.findIndex((z) => z.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= state.ziele.length) return state;
  const ziele = [...state.ziele];
  [ziele[i], ziele[j]] = [ziele[j], ziele[i]];
  return { ...state, ziele };
}

/** The number a goal is about, from what is known now: ctx { goldKg, smi, titel: { SYMBOL: price }, bestand }. null when not known. */
export function aktuell(z, ctx = {}) {
  const v = z.was === 'gold' ? ctx.goldKg : z.was === 'smi' ? ctx.smi : z.was === 'bestand' ? ctx.bestand : ctx.titel?.[z.symbol];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Is the goal reached? → { jetzt, erreicht, abstand, pct }: abstand is how far the number is from the goal (0 when reached). */
export function pruefe(z, jetzt) {
  if (jetzt == null) return { jetzt: null, erreicht: false, abstand: null, pct: null };
  const erreicht = z.richtung === 'unter' ? jetzt <= z.wert : jetzt >= z.wert;
  const abstand = erreicht ? 0 : Math.abs(z.wert - jetzt);
  return { jetzt, erreicht, abstand, pct: !erreicht && jetzt ? (abstand / Math.abs(jetzt)) * 100 : 0 };
}
