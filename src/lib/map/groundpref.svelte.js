/**
 * Kartenlayer (Noah 20.10.2026 «kartenlayer im front end wählbar»): one map ground for every map in
 * the app. Choosing a ground on one map keeps it for all maps on this device (localStorage, a
 * convenience only: without it every map starts on «Automatic»).
 */
import { groundOf } from './sources.js';

const KEY = 'map:ground';
function read() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
const saved = read();
/** key: the chosen ground; set: true once you chose one (older per-map choices count until then). */
export const mapGround = $state({ key: groundOf(saved).key, set: saved != null });

/** Keep a ground for all maps. */
export function chooseGround(key) {
  mapGround.key = groundOf(key).key;
  mapGround.set = true;
  try {
    localStorage.setItem(KEY, mapGround.key);
  } catch {
    /* private window or full: the choice holds until the page closes */
  }
}
