/**
 * «Weg zum Ziel», kind of step «GPS tracker» (Noah 05.11.2026 20:35 «a»: the template suggests all five steps):
 * for a race or a trip with a live tracker the family follows. Five steps, counted back from the start day, each
 * one renamable, movable and deletable like every step:
 *   plan    the subscription: price, end date, account (offset 42)
 *   charge  the tracker charged and switched on once (21)
 *   test    a short test ride with the tracker on (14)
 *   family  the family opens the tracking link and sees the dot (12)
 *   battery the battery lasts over 24 hours (10)
 * The steps carry a `key` (kept by the store) so that `auto` and `link` know which is which; a step without a key
 * (an older one, one from a template) simply has no link and ticks by hand.
 *
 * Login and password of the tracker are NEVER stored here: the note of the first step says they belong in the
 * password manager (Noah 05.11.2026).
 *
 * auto: only «plan» ticks by itself, when the race paperwork of the goal has «Rent or charge the tracker» done
 * (`ctx.tracker?.papers`, rows { id, done } as the page hands them in). Nothing in the app knows whether a test ride or
 * the family link worked, so those tick by hand. Pure; tested in tests/weg-tracker.test.js. Titles and notes are
 * English keys for t(); the steps are stored in the language of the day they are added.
 */
import { t } from '../../i18n.svelte.js';

/** The five steps as the template suggests them (English keys, yours to change). */
export const GPS_STEPS = [
  { key: 'plan', title: 'Sort the tracker subscription', offset: 42, note: 'Write down the price, the end date and which account it is. Keep the login in your password manager, not in the app.' },
  { key: 'charge', title: 'Charge the tracker', offset: 21, note: 'Charge it fully and switch it on once to see that it finds a signal.' },
  { key: 'test', title: 'Short test ride with the tracker', offset: 14, note: 'Ride 10 to 20 km with it on and look at your dot on the tracking page.' },
  { key: 'family', title: 'Family opens the tracking link', offset: 12, note: 'Send the link and ask them to open it. They should see you move.' },
  { key: 'battery', title: 'Battery lasts over 24 hours', offset: 10, note: 'Leave it on for a day (or one long ride) and note what is left. A power bank on the bike may be needed.' },
];

/** Where each step leads in the app ('' = nowhere, the work happens elsewhere). */
const LINKS = { plan: '#/race', charge: '#/gear/power', test: '#/live', family: '#/ride/abfahrt', battery: '#/gear/power' };

export default {
  type: 'tracker',
  label: 'GPS tracker',
  icon: 'map-pin',
  /** All five steps, for every kind of goal (a free goal gets the days once it has a start). */
  defaults: () => GPS_STEPS.map((s) => ({ key: s.key, title: t(s.title), offset: s.offset, note: t(s.note) })),
  /** Ticks «plan» from the race paperwork; null for everything it cannot know. */
  auto: (goal, step, ctx = {}) => {
    if (step.key !== 'plan' || !Array.isArray(ctx.tracker?.papers)) return null;
    return ctx.tracker.papers.some((p) => p?.id === 'pp-tracker' && p.done) ? true : null;
  },
  link: (goal, step) => LINKS[step?.key] ?? '',
};
