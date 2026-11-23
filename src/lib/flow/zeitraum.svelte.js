/**
 * «Zeitraum je Seite merken» (Noah 22.11.2026 «4b»): every page of Auswerten remembers its own mode and range
 * (`pg.period.<page>`); a page that has none yet starts from the old shared choice (`pg.period`).
 * The chosen period of Auswerten (Noah 05.11.2026 «3a»): the mode and an own range are remembered on this device
 * (localStorage `pg.period`); paging back (‹) starts at the present again with every visit. Browser storage can
 * be missing (private window): then the switch simply starts with the week.
 */
import { normalize, DEFAULT_PERIOD } from './zeitraum.js';

const KEY = 'pg.period';
let page = '';

function load() {
  try {
    const r = JSON.parse((page && localStorage.getItem(`${KEY}.${page}`)) || localStorage.getItem(KEY) || 'null');
    return { ...normalize(r), back: 0 };
  } catch {
    return { ...DEFAULT_PERIOD };
  }
}

export const period = $state(load());

/** A page of Auswerten says who it is: its own remembered choice is read, and every later choice is saved for it. */
export function enterPage(name) {
  page = name;
  Object.assign(period, load());
}

export function setPeriod(next) {
  const p = normalize(next);
  Object.assign(period, p);
  try {
    localStorage.setItem(page ? `${KEY}.${page}` : KEY, JSON.stringify({ mode: p.mode, from: p.from, to: p.to }));
  } catch {
    /* not saved: the choice still counts until the page is left */
  }
}
