/**
 * «Die Suche lernt von dir» (Noah 24.11.2026 «1-4a», point 4): when you open a gear item from the search for the same word three times
 * (and more often than anything else), the next search for that word shows the gear first. Only on this device (localStorage, never
 * in the backup), a line says why, and «Forget» or the switch in Ich › Suche takes it away. Pure functions over a plain object, tested in
 * tests/lernen.test.js.
 */
import { fold } from '../search.js';

export const LEARN_KEY = 'search.learn';
export const LEARN_AFTER = 3;
const MAX_WORDS = 40;

/** The key of a search: lower case, umlauts folded, one space between words. */
export const keyOf = (q) => fold(q).replace(/\s+/g, ' ').trim();

/** A stored value made safe: { [key]: { gear, other } }. */
export function cleanLearn(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw).slice(0, MAX_WORDS)) {
    const g = Number(v?.gear);
    const o = Number(v?.other);
    if (k && Number.isFinite(g) && Number.isFinite(o)) out[k] = { gear: Math.max(0, Math.min(99, g)), other: Math.max(0, Math.min(99, o)) };
  }
  return out;
}

/** The memory after one open: kind 'gear' counts for the gear, anything else for «other». Oldest words fall out after 40. */
export function noteOpen(map, q, kind) {
  const k = keyOf(q);
  if (k.length < 2) return map;
  const cur = map[k] ?? { gear: 0, other: 0 };
  const next = { ...cur, [kind === 'gear' ? 'gear' : 'other']: Math.min(99, cur[kind === 'gear' ? 'gear' : 'other'] + 1) };
  const { [k]: _old, ...rest } = map;
  return Object.fromEntries(Object.entries({ ...rest, [k]: next }).slice(-MAX_WORDS));
}

/** True when this word led to gear at least three times and more often than to anything else. */
export function prefersGear(map, q) {
  const v = map[keyOf(q)];
  return !!v && v.gear >= LEARN_AFTER && v.gear > v.other;
}

/** The memory without this word. */
export function forgetWord(map, q) {
  const { [keyOf(q)]: _gone, ...rest } = map;
  return rest;
}

export function readLearn(storage = globalThis.localStorage) {
  try {
    return cleanLearn(JSON.parse(storage?.getItem(LEARN_KEY) ?? '{}'));
  } catch {
    return {};
  }
}

export function writeLearn(map, storage = globalThis.localStorage) {
  try {
    storage?.setItem(LEARN_KEY, JSON.stringify(map));
  } catch {
    /* no storage: only for this visit */
  }
}
