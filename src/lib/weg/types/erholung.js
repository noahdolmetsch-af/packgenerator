/**
 * «Weg zum Ziel» › Schrittart «Recovery» (Noah 05.11.2026 «4e»): the last week before the start, as steps that lead to
 * Aktiv › Erholung (the ring, the list to tick, the routines). Four suggestions, counted back from the start day:
 *
 *   sleep    Sleep: three early nights, 6 days before (leads to the routines).
 *   stretch  Stretch and roll out, 4 days before (leads to Aktiv › Erholung).
 *   food     Food: supplies for the ride, 3 days before.
 *   check    Bike check one last time, 2 days before (leads to the bikes).
 *
 * Only suggestions: every step can be renamed, moved, deleted and ticked by hand. Nothing ticks by itself, the app
 * cannot know how you slept or that the supplies are bought (`auto` is always null). Nothing is stored here. A free goal
 * gets the same four. Texts are English keys for t(); the German is in i18n/de/weg-erholung.js.
 */
export const TYPE = 'erholung';

/** Where each step leads ('' = nowhere). */
const LINKS = { sleep: '#/routine', stretch: '#/flow/rest', food: '', check: '#/velos' };

export const REST_STEPS = [
  { key: 'sleep', title: 'Sleep: three early nights', offset: 6, note: 'Go to bed early for three nights in the last week. Your routines in Active › Recovery can remind you.' },
  { key: 'stretch', title: 'Stretch and roll out', offset: 4, note: 'A short session a day keeps the legs loose. Active › Recovery counts it.' },
  { key: 'food', title: 'Food: supplies for the ride', offset: 3, note: 'Buy bars, gels and drink mix for the whole ride, with a little extra.' },
  { key: 'check', title: 'Bike check one last time', offset: 2, note: 'Tyres, brakes, chain and lights, a short test ride.' },
];

export default {
  type: TYPE,
  label: 'Recovery',
  icon: 'moon',
  defaults: () => REST_STEPS.map((s) => ({ ...s })),
  auto: () => null,
  link: (goal, step) => LINKS[step?.key] ?? '',
};
