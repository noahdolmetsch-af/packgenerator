/**
 * Paket K #285 «Handschuh-Modus»: the live state. Read at the start (main.js initGlove), it sets
 * data-glove="on" on <html>; handschuh.css makes buttons and text bigger there.
 */
import { GLOVE_KEY, GLOVE_AUTO_KEY, modeOf, autoToday, gloveOn } from './handschuh.js';
import { localDay } from '../localday.js';

export const glove = $state({ mode: 'auto', auto: { on: false, why: null } });

const get = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const put = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode: only this visit */
  }
};

function apply() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (gloveOn(glove.mode, glove.auto)) root.dataset.glove = 'on';
  else delete root.dataset.glove;
}

export function initGlove() {
  glove.mode = modeOf(get(GLOVE_KEY));
  glove.auto = autoToday(get(GLOVE_AUTO_KEY), localDay());
  apply();
}

/** «Automatisch», «An» or «Aus», by hand. */
export function setGlove(mode) {
  glove.mode = modeOf(mode);
  put(GLOVE_KEY, glove.mode);
  apply();
}

/** Unterwegs tells what it knows about today (cold, ski tour); kept for the day. */
export function setGloveAuto(a) {
  const on = !!a?.on;
  if (on === glove.auto.on && (a?.why ?? null) === glove.auto.why) return;
  glove.auto = { on, why: a?.why ?? null };
  put(GLOVE_AUTO_KEY, JSON.stringify({ day: localDay(), on, why: glove.auto.why }));
  apply();
}

export const gloveNow = () => gloveOn(glove.mode, glove.auto);
