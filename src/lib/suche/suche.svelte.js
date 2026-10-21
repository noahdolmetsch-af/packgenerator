/**
 * The search settings as one reactive object (see logic.js), only on this device.
 */
import { SUCHE_KEY, SUCHE_DEFAULTS, sucheOf } from './logic.js';

const get = (k) => {
  try {
    return localStorage.getItem(SUCHE_KEY + k);
  } catch {
    return null;
  }
};
const put = (k, v) => {
  try {
    localStorage.setItem(SUCHE_KEY + k, v);
  } catch {
    /* private mode: only this visit */
  }
};

export const suche = $state(Object.fromEntries(Object.keys(SUCHE_DEFAULTS).map((k) => [k, sucheOf(k, get(k))])));

export function setSuche(key, value) {
  suche[key] = value;
  put(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
}
