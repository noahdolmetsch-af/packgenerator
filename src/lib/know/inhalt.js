/**
 * «Wegweiser statt Katalog» PR 24 (Plan «freigabe», Noah 01.11.2026): a content check for every function. The card «What you
 * can do here» shows four parts of a function: «what for» (the catalogue text), «how it works» (2+ handbook steps), an example
 * and «Good to know». This finds the functions that miss a part. The lists below may only get shorter (tests/inhalt.test.js).
 * «Good to know» is only counted here: it comes area by area (PR 12–20), and tests/wissen.test.js asks for it on the pages
 * that show the card. Pure.
 */
import { pageKey } from '../seiteninhalt.js';

/** Functions with fewer than 2 steps in the handbook. Give them a second step, then take them out. */
export const NO_STEPS = [
  // Paket W «Von der Haustür bis zurück»: one tap and «Share»; a second step still to write
  'f.arrived',
  'f.goodnight',
];

/** Functions without an example in the handbook. Empty on 02.11.2026: keep it so. */
export const NO_EXAMPLE = [];

const filled = (s) => typeof s === 'string' && s.trim().length > 0;

/**
 * The missing parts per kind: { wozu, steps, example, wissen, wissenOnPages } (each a list of function ids).
 * wissen: functions without «Good to know» anywhere (counted only); wissenOnPages: those on a page that shows the card.
 */
export function contentGaps(features, handbook, wissen, onPages = [], home = {}) {
  const on = new Set(onPages.map(pageKey));
  const out = { wozu: [], steps: [], example: [], wissen: [], wissenOnPages: [] };
  for (const f of features) {
    const h = handbook[f.id] ?? {};
    if (!filled(f.text)) out.wozu.push(f.id);
    if (!Array.isArray(h.steps) || h.steps.filter(filled).length < 2) out.steps.push(f.id);
    if (!filled(h.example)) out.example.push(f.id);
    if (!filled(wissen[f.id])) {
      out.wissen.push(f.id);
      if (home[f.id] && on.has(pageKey(home[f.id]))) out.wissenOnPages.push(f.id);
    }
  }
  return out;
}
