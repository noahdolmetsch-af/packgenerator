/**
 * «Das Logo zieht sich der Jahreszeit an» (Idee 30): the live state of the logo (see logo.js), kept on this device
 * (localStorage, never mandatory). Read once when this file is loaded.
 */
import { LOGO_KEY, UNLOCK_KEY, logoOf, afterSecret } from './logo.js';

const get = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null; // private mode: the plain logo
  }
};
const put = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode: only this visit */
  }
};

export const logo = $state({ unlocked: get(UNLOCK_KEY) === '1', pick: logoOf(get(LOGO_KEY)) });

/** The secret was found (five taps). Returns true the first time: then the bike sign is the new logo. */
export function unlockLogo() {
  const r = afterSecret(get(UNLOCK_KEY), get(LOGO_KEY));
  logo.unlocked = true;
  logo.pick = r.pick;
  put(UNLOCK_KEY, '1');
  put(LOGO_KEY, r.pick);
  return r.first;
}

export function setLogo(key) {
  logo.pick = logoOf(key);
  put(LOGO_KEY, logo.pick);
}
