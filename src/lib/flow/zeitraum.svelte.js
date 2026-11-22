/**
 * The chosen period of Auswerten (Noah 05.11.2026 «3a»): the mode and an own range are remembered on this device
 * (localStorage `pg.period`); paging back (‹) starts at the present again with every visit. Browser storage can
 * be missing (private window): then the switch simply starts with the week.
 */
import { normalize, DEFAULT_PERIOD } from './zeitraum.js';

const KEY = 'pg.period';

function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return { ...normalize(r), back: 0 };
  } catch {
    return { ...DEFAULT_PERIOD };
  }
}

export const period = $state(load());

export function setPeriod(next) {
  const p = normalize(next);
  Object.assign(period, p);
  try {
    localStorage.setItem(KEY, JSON.stringify({ mode: p.mode, from: p.from, to: p.to }));
  } catch {
    /* not saved: the choice still counts until the page is left */
  }
}
