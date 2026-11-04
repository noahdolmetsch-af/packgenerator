/**
 * «Pässe sammeln» (Paket E, Idee 24): the collection of passes and what the rides suggest.
 *
 * One setting (PAESSE_KEY): { list: [{ id, key, name, m, date, ref }], skipped: [key] }.
 * - list: the collected passes, one per pass: from a ride (key of the catalogue, ref = where it was found) or an
 *   own one (key '', named and dated by the person). Everything can be renamed, changed and removed again.
 * - skipped: suggestions the person said «not ridden» to; they stay away until they are let back in.
 * Nothing is collected without a tap. Pure, tested in tests/paesse.test.js.
 */
import { PASSES, passesOnLine } from './katalog.js';

export const PAESSE_KEY = 'paesse';

/** The stored value made whole. */
export function stateOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  const list = (Array.isArray(o.list) ? o.list : [])
    .filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim())
    .map((p) => ({ id: p.id, key: typeof p.key === 'string' ? p.key : '', name: p.name.trim(), m: Number.isFinite(Number(p.m)) && Number(p.m) > 0 ? Math.round(Number(p.m)) : null, date: typeof p.date === 'string' ? p.date : '', ref: typeof p.ref === 'string' ? p.ref : '' }));
  const skipped = (Array.isArray(o.skipped) ? o.skipped : []).filter((k) => typeof k === 'string');
  return { list, skipped };
}

const byKey = new Map(PASSES.map((p) => [p.key, p]));
export const passOf = (key) => byKey.get(key) ?? null;

/**
 * What the rides suggest: the passes crossed that are not collected and not skipped, each with its first ride.
 * sources: [{ id, date, title, line }] (rides with a line, no virtual rides) → [{ key, pass, date, title, ref }], by date.
 */
export function suggestions(sources = [], state = stateOf(null)) {
  const have = new Set([...state.list.map((p) => p.key).filter(Boolean), ...state.skipped]);
  const first = new Map();
  for (const s of sources) {
    for (const key of passesOnLine(s.line)) {
      if (have.has(key)) continue;
      const cur = first.get(key);
      if (!cur || (s.date && (!cur.date || s.date < cur.date))) first.set(key, { key, pass: byKey.get(key), date: s.date ?? '', title: s.title ?? '', ref: String(s.id ?? '') });
    }
  }
  return [...first.values()].sort((a, b) => (a.date || '9').localeCompare(b.date || '9') || a.pass.m - b.pass.m);
}

/** A suggestion collected. */
export function collect(state, sug, id = `p-${sug.key}`) {
  if (state.list.some((p) => p.key === sug.key)) return state;
  return { ...state, list: [...state.list, { id, key: sug.key, name: sug.pass.name, m: sug.pass.m, date: sug.date, ref: sug.ref }] };
}

/** Several suggestions at once. */
export const collectAll = (state, sugs) => sugs.reduce((s, x) => collect(s, x), state);

/** An own pass. */
export function addOwn(state, { name, m, date }, id) {
  const nm = String(name ?? '').trim();
  if (!nm) return state;
  return { ...state, list: [...state.list, { id: id ?? `own-${Date.now().toString(36)}`, key: '', name: nm, m: Number(m) > 0 ? Math.round(Number(m)) : null, date: date ?? '', ref: '' }] };
}

/** Change name, height or date of a collected pass; an empty name changes nothing. */
export function change(state, id, patch) {
  return {
    ...state,
    list: state.list.map((p) => {
      if (p.id !== id) return p;
      const nm = patch.name != null ? String(patch.name).trim() : p.name;
      return { ...p, name: nm || p.name, m: patch.m !== undefined ? (Number(patch.m) > 0 ? Math.round(Number(patch.m)) : null) : p.m, date: patch.date !== undefined ? patch.date : p.date };
    }),
  };
}

export const remove = (state, id) => ({ ...state, list: state.list.filter((p) => p.id !== id) });
export const skip = (state, key) => (state.skipped.includes(key) ? state : { ...state, skipped: [...state.skipped, key] });
export const unskip = (state, key) => ({ ...state, skipped: state.skipped.filter((k) => k !== key) });
export const resetSkipped = (state) => ({ ...state, skipped: [] });

/** The collection, newest first (without a date last). */
export const newestFirst = (list) => [...list].sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.name.localeCompare(b.name));

/** The highest collected pass, or null. */
export const highest = (list) => list.reduce((b, p) => (p.m && (!b || p.m > b.m) ? p : b), null);
