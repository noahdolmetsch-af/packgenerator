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
  // 0.175.0: + the «Körperwerte» tile (Noah 21.10.2026 06:49 «Körperwerte und countdown ok») and «Customise this page»
  // at the end (Noah 20.10.2026 «1a», every page): measured 5.39 on the phone.
  // 0.180.0 P6 (Noah 21.10.2026 «2b», the six Heute pictures): + the meditation card on top and «Weight this week?»:
  // measured 5.51 on the phone (the card's name sits beside its flower to save a row).
  '#/': 5.6,
  // 0.171.0: «Überblick» and «Letzte 7 Tage» wait behind one row on a phone (6.81 screens in 0.170 → under 5.5)
  '#/flow': 5.5,
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
  // «Aktiv neu» (Noah 22.10.2026): «Ziele» is «Meine Sportarten»; «Aktivität» is a page of it, no tab any more
  '#/flow/sports': 4.5,
  '#/flow/impulse': 14,
  // 0.171: the sample questions that are off wait folded per area (6.33 measured; 7.22 in 0.170)
  '#/me/abfragen': 6.5,
  '#/me/wohl': 7.5,
  '#/me': 5,
};

/** The screens a page may have on a phone. */
export const budgetOf = (hash) => TOO_LONG[hash] ?? MAX_SCREENS;
