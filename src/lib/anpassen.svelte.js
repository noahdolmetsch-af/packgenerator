/**
 * «Anpassen» (Noah 20.10.2026): the record of this device as Svelte state. Every change goes through
 * change(), which keeps it (anpassen.js writeCfg) and counts anp.v up, so the menu, the tabs and the
 * page redraw. Components read anp.cfg (or touch anp.v) in a $derived.
 */
import { readCfg, writeCfg } from './anpassen.js';
import { t } from './i18n.svelte.js';

class Anp {
  v = $state(0);
  /** raw: the record is replaced whole, never changed in place */
  cfg = $state.raw(readCfg());
}
export const anp = new Anp();

/** fn gets the record and returns the new one (the pure rules of anpassen.js). */
export function change(fn) {
  const before = anp.cfg;
  anp.cfg = writeCfg(fn(anp.cfg));
  anp.v++;
  return before;
}

/** Put back a record kept before (Undo of «Wie am Anfang»). */
export function restore(c) {
  anp.cfg = writeCfg(c);
  anp.v++;
}

/** 3a: the name of a place in the menu: your own one or the app's. */
export function placeLabel(p, bar = false) {
  void anp.v;
  return anp.cfg.menu.names[p.key] ?? t((bar && p.bar) || p.label);
}

/** 3a: the name of a tab of a place: your own one or the app's. */
export function tabLabel(place, x) {
  void anp.v;
  return anp.cfg.tabs[place]?.names?.[x.key] ?? t(x.label);
}
