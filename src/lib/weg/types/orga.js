/**
 * «Weg zum Ziel» › Schrittart «Organisation» (Noah 05.11.2026 «1d»): what you settle before a big day, as steps.
 * The strip «Organisation: 3 of 5 settled» above the timeline counts the steps of this kind (typeProgress in weg.js).
 *
 *   register  Sign up for the race, 120 days before the start (a race only).
 *   leave     Take the days off, 150 days before.
 *   stay      Book the stay at start and finish, 90 days before.
 *   train     Book the train to the start, 14 days before.
 *   contact   Tell an emergency contact the plan, 7 days before.
 *
 * Only suggestions: every step can be renamed, moved, deleted and ticked by hand. Nothing ticks by itself (the app
 * cannot know that you booked a room); `auto` is always null. Labels are English keys for t(); the German is in
 * i18n/de/weg-orga.js. A free goal gets only «leave» and «contact».
 */
export const TYPE = 'orga';

/** Standard distances (days before the start), changeable in «New way» and on every step. */
export const ORGA_OFFSETS = { register: 120, leave: 150, stay: 90, train: 14, contact: 7 };

const STEP = {
  register: { title: 'Sign up for the race', note: 'Many races fill up months ahead.' },
  leave: { title: 'Put the days off in your calendar' },
  stay: { title: 'Book the stay at start and finish' },
  train: { title: 'Book the train to the start', note: 'Bikes often need their own ticket.' },
  contact: { title: 'Tell an emergency contact your plan', note: 'Where you ride, when you should arrive, when to worry.' },
};

export default {
  type: TYPE,
  label: 'Organisation',
  icon: 'clipboard-check',
  defaults: (goal) => {
    const keys = goal?.kind === 'race' ? ['register', 'leave', 'stay', 'train', 'contact'] : goal?.kind === 'trip' ? ['leave', 'stay', 'train', 'contact'] : ['leave', 'contact'];
    return keys.map((key) => ({ key, ...STEP[key], offset: ORGA_OFFSETS[key] }));
  },
  auto: () => null,
  link: () => '',
};
