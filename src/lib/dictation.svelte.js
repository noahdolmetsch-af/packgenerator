/**
 * «Diktat» settings (Noah 19.10.2026 «2a 3a 4 beides wählbar»), only on this device: which speech
 * model (browser or Whisper on this device), when the app answers a question it heard, whether it
 * reads the answer aloud and whether spoken commands («Punkt», «neue Zeile») count. Ich › Darstellung ›
 * Bedienung › Diktat.
 */
import { DICT_KEY, DICT_DEFAULTS, dictOf } from './speak.js';

const get = (k) => {
  try {
    return localStorage.getItem(DICT_KEY + k);
  } catch {
    return null;
  }
};
const put = (k, v) => {
  try {
    localStorage.setItem(DICT_KEY + k, v);
  } catch {
    /* private mode: only this visit */
  }
};

export const dict = $state(Object.fromEntries(Object.keys(DICT_DEFAULTS).map((k) => [k, dictOf(k, get(k))])));

export function setDict(key, value) {
  dict[key] = value;
  put(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
}
