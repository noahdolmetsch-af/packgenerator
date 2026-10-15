/**
 * «Einstieg» on top of a place (Noah 15.10.2026 08:20 «content seite für jeden bereich»; answers 12:32
 * «1a 2a 3a 4a»): what you do here (three things), what to expect, one tip of the day that fits the month
 * and your data (the tips of pageinfo.js, «Passt zu heute» first), one «Good to know» with its source, and
 * the small tour of the place. 1a: on the phone it is open on the first 3 visits, then one line that opens
 * on a tap; on the computer it stays open until you fold it. × takes it away (Me › Handbook brings it
 * back). On the very first visit it offers the small tour of the place (Noah «3»: a small tour per place
 * on the first visit), as a suggestion, never by itself.
 *
 * INTROS: the words of each place, English keys for t() (German in i18n/de/rundgang.js). The state is one
 * setting (INTRO_KEY, on the device and in the backup): { visits, hidden, fold, offered } per place.
 * Pure; tested in tests/intro.test.js. The component: lib/intro/AreaIntro.svelte.
 */
export const INTRO_KEY = 'intro';
/** 1a: the phone shows it open on this many visits, then as one line. */
export const OPEN_VISITS = 3;

/** things: three rows { icon, title, text, href? }; tour: the key in TOURS (tour.js); page: the key in pageinfo PAGES. */
export const INTROS = {
  aktiv: {
    name: 'Active|place',
    title: 'Movement, rest and recovery in everyday life',
    things: [
      { icon: 'check', title: 'Tick off', text: 'One tile per sport. A long press enters the duration, place or stopwatch.' },
      { icon: 'goal', title: 'Set goals', text: 'For example «cycling 2× a week». You see what is on track.', href: '#/flow/goals' },
      { icon: 'moon', title: 'Rest and recovery', text: 'Meditation, timer and «Wi gaht’s?» for sleep and energy.', href: '#/flow/rest' },
    ],
    expect: 'After a few days you see your week as dots, series and milestones. After two weeks the app shows patterns, for example your most active day.',
    tour: 'aktiv',
  },
  touren: {
    name: 'Trips|place',
    title: 'Plan, pack, ride and look back',
    things: [
      { icon: 'map', title: 'Plan', text: 'Date, bike and weather. The list comes from your own gear.' },
      { icon: 'pack', title: 'Pack', text: 'Tick off what goes into the bag. Leave out what you do not need.' },
      { icon: 'back', title: 'Look back|intro', text: 'What was too much, what was missing: the next list gets better.', href: '#/debrief' },
    ],
    expect: 'After two or three trips the lists get better by themselves, because what you never use gets quieter.',
    tour: 'touren',
  },
  material: {
    name: 'Gear|place',
    title: 'Everything you own, entered once',
    things: [
      { icon: 'scale', title: 'Enter and weigh', text: 'Name, weight and bag. Weigh later: the app counts what is still missing.' },
      { icon: 'blocks', title: 'Building blocks', text: 'Packages like «Rain» or «Repair». One tap adds them to a trip.', href: '#/blocks' },
      { icon: 'cart', title: 'Shopping', text: 'A wish list with prices, for the next purchase.', href: '#/gear?view=wish' },
    ],
    expect: 'You see the weight per bag, what never came along and what is with you most often.',
    tour: 'material',
    // Material keeps «list first» (Noah 11.10.2026, mockup E): here the Einstieg starts as one line
    folded: true,
  },
};

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
/** The stored state made whole. */
export function introOf(v) {
  const o = obj(v);
  const nums = Object.fromEntries(Object.entries(obj(o.visits)).filter(([, n]) => Number.isFinite(n) && n >= 0));
  const bools = (x) => Object.fromEntries(Object.entries(obj(x)).filter(([, b]) => typeof b === 'boolean'));
  return { visits: nums, hidden: bools(o.hidden), fold: bools(o.fold), offered: bools(o.offered) };
}

/** One more visit of the place. */
export function visit(v, place) {
  const s = introOf(v);
  return { ...s, visits: { ...s.visits, [place]: (s.visits[place] ?? 0) + 1 } };
}

/**
 * Is the Einstieg open now? A fold or unfold you chose wins; else open on the computer, on the phone the
 * first 3 visits. folded: the place starts as one line everywhere (Material: «list first»).
 */
export function isOpen(v, place, phone = false, folded = false) {
  const s = introOf(v);
  if (typeof s.fold[place] === 'boolean') return !s.fold[place];
  if (folded) return false;
  return phone ? (s.visits[place] ?? 0) <= OPEN_VISITS : true;
}

export const setFold = (v, place, folded) => {
  const s = introOf(v);
  return { ...s, fold: { ...s.fold, [place]: !!folded } };
};
export const hide = (v, place) => {
  const s = introOf(v);
  return { ...s, hidden: { ...s.hidden, [place]: true } };
};
/** Bring every Einstieg back (Me › Handbook). */
export const showAll = (v) => ({ ...introOf(v), hidden: {} });
export const hiddenCount = (v) => Object.values(introOf(v).hidden).filter(Boolean).length;
export const isHidden = (v, place) => !!introOf(v).hidden[place];

/** Offer the small tour of the place: on the first visit, once (Noah «3»). */
export function offerTour(v, place) {
  const s = introOf(v);
  return !!INTROS[place]?.tour && (s.visits[place] ?? 0) <= 1 && !s.offered[place];
}
export const setOffered = (v, place) => {
  const s = introOf(v);
  return { ...s, offered: { ...s.offered, [place]: true } };
};
