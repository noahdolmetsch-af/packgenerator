/**
 * «Wege» (see wege.js): the path steps of a page, started by the canonical place and tab (named as in the sidebar, with the
 * names you chose in «Anpassen»), followed by the steps the page passes itself that still fit. Used by the heads that draw a
 * path: PathHead, Crumbs, Crumb of Aktiv, VeloHead. A page for someone without the app (no place) keeps its own steps.
 */
import { placeLabel, tabLabel } from '../anpassen.svelte.js';
import { t } from '../i18n.svelte.js';
import { trailOf, keepSteps, withoutPage, ME } from './wege.js';

/**
 * hash: the address (helpHere.route; empty at the very start: the address of the window). passed: [{ href, label }].
 * page: the name the head shows for the page itself; a last step with the same name is left out (the page is named once).
 */
export function fitSteps(hash, passed = [], page = '') {
  const h = hash || (typeof location !== 'undefined' ? location.hash : '');
  const trail = trailOf(h);
  if (!trail) return withoutPage(passed, page);
  const start = trail.map((s) => ({ href: s.href, label: s.kind === 'place' ? (s.entry === ME ? t(ME.label) : placeLabel(s.entry)) : tabLabel(s.place, s.entry) }));
  const out = [];
  for (const s of [...start, ...keepSteps(h, passed)]) {
    // never the same name twice in a row («Woche › Woche»)
    if (out.length && out[out.length - 1].label.trim() === String(s.label ?? '').trim()) continue;
    out.push(s);
  }
  return withoutPage(out, page);
}
