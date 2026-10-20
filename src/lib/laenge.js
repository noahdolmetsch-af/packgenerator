/**
 * UI-Ziele #7 «Handy-Längenbudget» (Noah 20.10.2026 «freigabe»): on a phone the first screen shows the main thing and
 * a page is at most MAX_SCREENS screens high; the rest waits in folded lines with their number. The guard test
 * tests/e2e/handy-laenge.spec.js measures every place and every tab (fictional data) like the size guard.
 *
 * TOO_LONG: the pages that were longer on 20.10.2026, with the screens they may have until they are shortened.
 * A page may only get shorter: when it is shortened, lower its number or take it out (then MAX_SCREENS applies).
 */
import { MAX_SCREENS } from './touren/kurz.js';

export { MAX_SCREENS };

export const TOO_LONG = {
  // Heute: N2 «Heute neu» (Noah 20.10.2026 15:49 «5a», approved layout; changes need his OK) ships with this budget in 0.169.0,
  // measured 5.03 on the phone; the old Heute had 4.5. Lower it when Heute gets shorter.
  '#/': 5.25,
  // 0.170.0: «Form und Erholung» and the Garmin-Übersicht (both approved by Noah 20.10.2026) made Auswerten 6.81 screens;
  // the Aktiv thread folds it in 0.171, then this goes back down
  '#/flow': 7,
  '#/bikes': 5.5,
  '#/gear': 4.5,
  '#/pack/templates': 3.5,
  '#/debrief': 4.5,
  '#/wardrobe': 4,
  '#/blocks': 7.5,
  '#/gear?view=wish': 8.5,
  '#/bikes?tab=care': 6.5,
  '#/bikes?tab=shop': 3.5,
  '#/bikes?tab=compare': 3.5,
  '#/bikes?tab=rig': 4,
  '#/flow/training': 7,
  '#/flow/goals': 4.5,
  '#/flow/activity': 3.5,
  '#/flow/impulse': 14,
  // 0.170.0: the Check-Fragen editor (approved 20.10.2026) made it 7.22 screens; the Check-Fragen thread folds it in 0.171
  '#/me/abfragen': 7.5,
  '#/me/wohl': 7.5,
  '#/me': 5,
};

/** The screens a page may have on a phone. */
export const budgetOf = (hash) => TOO_LONG[hash] ?? MAX_SCREENS;
