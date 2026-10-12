/**
 * v0.110.0 Design-Refresh P10 (I11–I11e): the small device store of «Was ist neu» (rules in wasneu.js).
 * Everything lives in localStorage (sessionStorage for «Later»): only on this device, never in a
 * backup. Every read and write is wrapped, so a private window simply counts and remembers nothing.
 */
import { db } from '../db.js';
import { demoState } from '../demo.js';
import { USES_KEY, MUTE_KEY, UPDATE_KEY, LATER_KEY, PIN_KEY, TESTED_KEY, bumpUse, usesOf, HOME_FEATURE } from './wasneu.js';

function read(key, store = 'local') {
  try {
    return (store === 'session' ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
}
function write(key, value, store = 'local') {
  try {
    const s = store === 'session' ? sessionStorage : localStorage;
    if (value == null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    /* private window: nothing kept */
  }
}
function readJson(key) {
  try {
    return JSON.parse(read(key) ?? 'null');
  } catch {
    return null;
  }
}
const writeJson = (key, value) => write(key, value == null ? null : JSON.stringify(value));

/** The counts of this device. */
export const readUses = () => usesOf(readJson(USES_KEY));

/** Count one opening of a function; the playground counts nothing (I11c «Spielwiese zählt nicht»). */
export async function countFeature(id) {
  try {
    if (await demoState(db)) return;
  } catch {
    return;
  }
  writeJson(USES_KEY, bumpUse(readJson(USES_KEY), id));
  try {
    window.dispatchEvent(new CustomEvent('pg:uses'));
  } catch {
    /* no window (tests) */
  }
}
/** A tap on one of the 16 buttons of Today or a search command (home/usage.js). */
export const countHomeUse = (fnId) => (HOME_FEATURE[fnId] ? countFeature(HOME_FEATURE[fnId]) : undefined);

export const readUpdate = () => {
  const u = readJson(UPDATE_KEY);
  return u && typeof u.v === 'string' ? u : null;
};
export const writeUpdate = (u) => writeJson(UPDATE_KEY, u);
export const readMute = () => read(MUTE_KEY);
export const writeMute = (v) => write(MUTE_KEY, v);
export const readLater = () => read(LATER_KEY, 'session');
export const writeLater = (v) => write(LATER_KEY, v, 'session');
export const readPin = () => readJson(PIN_KEY);
export const writePin = (p) => writeJson(PIN_KEY, p);
export function readTested(version) {
  const all = readJson(TESTED_KEY);
  return Array.isArray(all?.[version]) ? all[version].filter(Number.isInteger) : [];
}
export function writeTested(version, steps) {
  writeJson(TESTED_KEY, { [version]: steps });
}
