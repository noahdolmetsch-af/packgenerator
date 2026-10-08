/**
 * v0.34.0 (L1, Noah 1a): the trip schedule on Today. "What is due now?" one step after the other:
 *
 *   14 days before  Bike service      only when something is due or late on the trip's bike (tripPrep)
 *    5 days before  Weather           get the forecast and decide the open weather suggestions
 *    2 days before  Shop & charge     the shopping list (shop.js) and charging the devices (#/pack?charge)
 *    1 day before   Pack              everything in the bags
 *    start day      Ready check       the Startcheck of the trip
 *    after the trip Debrief
 *
 * Today's card always shows ONE next step: the first one that is still open, also when its day came
 * earlier (it stays the next step until it is done); a done or not needed step moves the card on.
 * When the first open step's day is still ahead, the card says from when (it can be done earlier).
 * During the trip (after its first day) the card is "On the way"; with everything done before the
 * start it says "All set". An empty list comes first of all ("Choose what comes along").
 *
 * Pure: the page gives the facts it read (ctx), so every day band is tested in tests/schedule.test.js.
 * ctx = {
 *   service: { n, late, href } | null   bike rows due before the trip (null: no bike, short ride)
 *   weather: { known, open }            forecast fetched for the trip (weatherKnown), open suggestions
 *   shop:    { total, done }            the shopping list (shop.js shopCount)
 *   charge:  { total, done } | null     the charge list (part B, charge.js); null: not known here
 *   debriefDone: boolean
 * }
 */
import { t, tn, locale } from './i18n.svelte.js';
import { tripEnd, isOver } from './debrief.js';
import { readyDone } from './trips.js';
import { hasBike } from './domains.js';
import { forecastForTrip } from './weather.js';
import { localDay } from './localday.js';

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The steps before the trip with how many days before the start they are due. */
export const OFFSET = { service: -14, weather: -5, shop: -2, pack: -1, check: 0 };
/** The order of the steps on the timeline. */
export const ORDER = ['plan', 'service', 'weather', 'shop', 'pack', 'check', 'debrief'];

/**
 * Is the weather of the trip known? With a place: a forecast that reaches the trip's days and was
 * fetched on or after the weather step's day (5 days before; an older one is fetched again).
 * Without a place there is nothing to fetch: the weather set by hand counts.
 */
export function weatherKnown(trip) {
  if (!trip?.startDate) return false;
  if (trip.place) {
    const at = trip.forecast?.fetchedAt;
    if (!at || !forecastForTrip(trip).length) return false;
    const day = localDay(new Date(at));
    return day >= addDays(trip.startDate, OFFSET.weather);
  }
  return trip.wx?.min != null && trip.wx?.max != null;
}

/**
 * Every step of the trip: [{ key, day, state: 'open' | 'done' | 'skip', late, due }].
 * day: YYYY-MM-DD from when it is due; late: open and its day is past (or the bike says late);
 * due: its day has come. 'skip': not needed (nothing due on the bike, nothing to buy or charge).
 */
export function tripSteps(trip, ctx = {}, today = localDay()) {
  if (!trip?.startDate) return [];
  const start = trip.startDate;
  const entries = trip.entries ?? [];
  const ready = trip.ready ?? [];
  const packed = entries.filter((e) => e.packed).length;
  const steps = [];
  const add = (key, day, state, extra = {}) => {
    const late = state === 'open' && (day < today || !!extra.late);
    steps.push({ key, day, state, late, due: day <= today || late });
  };
  // An empty list comes first (no day of its own: due now); with a list it does not show.
  if (!entries.length) add('plan', today, 'open');
  if (hasBike(trip) && ctx.service) add('service', addDays(start, OFFSET.service), ctx.service.n > 0 ? 'open' : 'skip', { late: ctx.service.late });
  const w = ctx.weather ?? { known: false, open: 0 };
  add('weather', addDays(start, OFFSET.weather), w.known && !w.open ? 'done' : 'open');
  const shop = ctx.shop ?? { total: 0, done: 0 };
  const charge = ctx.charge ?? null;
  const toDo = shop.total + (charge?.total ?? 0);
  const done = Math.min(shop.done, shop.total) + Math.min(charge?.done ?? 0, charge?.total ?? 0);
  add('shop', addDays(start, OFFSET.shop), !toDo ? 'skip' : done >= toDo ? 'done' : 'open');
  add('pack', addDays(start, OFFSET.pack), entries.length && packed === entries.length ? 'done' : 'open');
  add('check', addDays(start, OFFSET.check), !ready.length ? 'skip' : ready.every((r) => readyDone(r, trip)) ? 'done' : 'open');
  const end = tripEnd(trip);
  const ended = trip.finished && trip.finished < end ? trip.finished : end;
  add('debrief', addDays(ended, 1), ctx.debriefDone || trip.status === 'done' ? 'done' : 'open');
  // The debrief is never late before its day; it is due from the day after the trip.
  const last = steps.at(-1);
  if (!isOver(trip, today)) Object.assign(last, { late: false, due: false });
  return steps;
}

/**
 * The ONE next step for Today's card: a step from tripSteps, or a pseudo step
 * { key: 'way' } (on the way) or { key: 'ready' } (everything done before the start), or null
 * (a skipped trip, or the trip is over and its debrief done).
 */
export function nextStep(trip, ctx = {}, today = localDay(), steps = tripSteps(trip, ctx, today)) {
  if (!trip?.startDate || trip.skipped) return null;
  const debrief = steps.find((s) => s.key === 'debrief');
  if (isOver(trip, today)) return debrief?.state === 'open' ? debrief : null;
  const before = steps.filter((s) => s.key !== 'debrief');
  // Under way (from the second day): the ride, whatever was left open before.
  if (today > trip.startDate) return { key: 'way', day: today, state: 'open', late: false, due: true };
  const open = before.find((s) => s.state === 'open');
  if (open) return open;
  return today === trip.startDate ? { key: 'way', day: today, state: 'open', late: false, due: true } : { key: 'ready', day: trip.startDate, state: 'open', late: false, due: false };
}

/** Both at once: { steps, next }. */
export function tripSchedule(trip, ctx = {}, today = localDay()) {
  const steps = tripSteps(trip, ctx, today);
  return { steps, next: nextStep(trip, ctx, today, steps) };
}

/* ---------- the words (English keys for t()) ---------- */

/** Short names on the timeline. */
export const STEP_NAME = {
  plan: 'Packing list',
  service: 'Bike service',
  weather: 'Weather',
  shop: 'Shop & charge',
  pack: 'Pack|stage',
  check: 'Ready check',
  debrief: 'Debrief',
};

const dayText = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
/** "Fri 9 Oct" on the timeline (short, no month on a phone is not worth a second format). */
export const shortDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric' });

/**
 * What Today's card says for a step: { title, why, when, button, href, links: [{ label, href }] }.
 * trip: the trip; ctx: as for tripSteps (plus service.href); counts: { packed, count, ready, readyTotal }.
 */
export function stepWords(step, trip, ctx = {}, today = localDay()) {
  if (!step) return null;
  const bike = hasBike(trip);
  const when = step.key === 'way' ? '' : step.late ? t('open since {date}', { date: dayText(step.day) }) : step.day > today ? t('from {date}', { date: dayText(step.day) }) : t('today');
  const entries = trip.entries ?? [];
  const ready = trip.ready ?? [];
  switch (step.key) {
    case 'plan':
      return { title: t('Choose what comes along'), why: t('The list is still empty.'), when, button: t('Plan|stage'), href: '#/pack', links: [] };
    case 'service': {
      const n = ctx.service?.n ?? 0;
      return { title: t('Bike service'), why: tn(n, '{n} thing is due on the bike before the trip.', '{n} things are due on the bike before the trip.'), when, button: t('Bike care'), href: ctx.service?.href ?? '#/bikes', links: [] };
    }
    case 'weather': {
      const w = ctx.weather ?? {};
      if (w.known) return { title: t('Weather and suggestions'), why: tn(w.open, '{n} weather suggestion is still open.', '{n} weather suggestions are still open.'), when, button: t('Decide now'), href: '#/pack?decide', links: [] };
      return { title: t('Weather and suggestions'), why: trip.place ? t('Get the forecast for the trip, then decide what it brings.') : t('Set a place for the forecast, or the weather by hand.'), when, button: t('Get the forecast'), href: '#/pack?weather', links: [] };
    }
    case 'shop': {
      const s = ctx.shop ?? { total: 0, done: 0 };
      const why = s.total ? t('{open} of {total} still to buy.', { open: s.total - s.done, total: s.total }) : t('Nothing to buy for this trip.');
      return { title: t('Shopping and charging'), why, when, button: t('Shopping list'), href: '#/pack?shop', links: [{ label: t('Charge devices'), href: '#/pack?charge' }] };
    }
    case 'pack': {
      const left = entries.filter((e) => !e.packed).length;
      return { title: t('Pack the bags'), why: t('{left} of {n} still to pack.', { left, n: entries.length }), when, button: t('Pack|stage'), href: '#/pack?day', links: [] };
    }
    case 'check': {
      const open = ready.filter((r) => !readyDone(r, trip)).length;
      return { title: t('Ready check'), why: t('{open} of {n} checks still open.', { open, n: ready.length }), when, button: t('Ready check'), href: '#/pack?day', links: [] };
    }
    case 'debrief':
      return { title: t('Debrief'), why: t('"All good": every item counts as used and nothing else changes.'), when, button: t('Debrief'), href: `#/debrief/${encodeURIComponent(trip.id)}`, links: [] };
    case 'way':
      return bike
        ? { title: t('On the way'), why: t('Route, weather and the list for the day.'), when, button: t('On the way'), href: '#/ride', links: [] }
        : { title: t('On the way'), why: t('Your list for the way.'), when, button: t('Open the trip'), href: '#/pack', links: [] };
    case 'ready':
      return { title: t('All set'), why: t('Everything is done until the start on {date}.', { date: dayText(trip.startDate) }), when: '', button: t('Open the trip'), href: '#/pack', links: [] };
    default:
      return null;
  }
}

/** Where a timeline row leads (the same place as the card's button for that step). */
export const stepHref = (step, trip, ctx = {}, today = localDay()) => stepWords(step, trip, ctx, today)?.href ?? '#/pack';
