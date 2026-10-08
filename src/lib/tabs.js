/**
 * v0.29.0 (Noah 1a, 10.2026): the four steps of a trip in one dark band, the same on every step:
 * Plan / Pack / On the way / Debrief (German: Planen / Packen / Unterwegs / Rückblick). Each tab shows
 * its short state ("3 open", "12/23", "Day 1", "open"). Pure functions, tested in tests/tabs.test.js.
 *
 * The addresses stay as before: Plan #/pack, Pack #/pack?day (was the full-screen packing day),
 * On the way #/ride, Debrief #/debrief/<trip id>. A trip without a bike has no "On the way".
 */
import { t, tn, num, locale } from './i18n.svelte.js';
import { tripEnd, isOver } from './debrief.js';
import { hasBike } from './domains.js';
import { readyDone } from './trips.js';

/** The tab names: one name per step, everywhere in the app (Today's buttons too). */
export const TAB_NAMES = { plan: 'Plan|stage', pack: 'Pack|stage', ride: 'On the way', debrief: 'Debrief' };

/** The tabs of a trip, in order. */
export const tabsOf = (trip) => (trip && !hasBike(trip) ? ['plan', 'pack', 'debrief'] : ['plan', 'pack', 'ride', 'debrief']);

/** The address of a tab. */
export function tabHref(key, trip) {
  if (key === 'pack') return '#/pack?day';
  if (key === 'ride') return '#/ride';
  if (key === 'debrief') return `#/debrief/${encodeURIComponent(trip?.id ?? '')}`;
  return '#/pack';
}

/** Whole days from a to b (YYYY-MM-DD). */
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/**
 * The short state under each tab. → { plan, pack, ride, debrief }, each { text, done }.
 * open: suggestions still open in Plan (layers.js openRows); debrief: the trip's debrief record or null;
 * km: the km of the trip when known (debrief km, else the route).
 */
export function tabStatus(trip, { open = 0, debrief = null, today, km = null } = {}) {
  const entries = trip?.entries ?? [];
  const packed = entries.filter((e) => e.packed).length;
  const ready = trip?.ready ?? [];
  const readyAll = ready.every((r) => readyDone(r, trip));
  const over = isOver(trip, today);
  const out = {};
  out.plan = !entries.length ? { text: t('empty'), done: false } : open ? { text: tn(open, '{n} open', '{n} open'), done: false } : { text: t('ready'), done: true };
  out.pack = entries.length ? { text: `${packed}/${entries.length}`, done: packed === entries.length && readyAll } : { text: '', done: false };
  const start = trip?.startDate;
  if (over) out.ride = { text: km ? `${num(Math.round(km))} km` : t('done|step'), done: true };
  else if (start && start <= today && tripEnd(trip) >= today) out.ride = { text: t('Day {n}', { n: daysBetween(start, today) + 1 }), done: false };
  else if (start) {
    const d = daysBetween(today, start);
    const text = d <= 0 ? t('today') : d === 1 ? t('tomorrow') : d <= 6 ? new Date(`${start}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short' }) : tn(d, 'in {n} day', 'in {n} days');
    out.ride = { text, done: false };
  } else out.ride = { text: '', done: false };
  out.debrief = debrief?.status === 'done' ? { text: t('saved'), done: true } : over ? { text: t('open|debrief'), done: false } : { text: '', done: false };
  return out;
}

/** "Sat 17 – Sun 18 Oct" (one day: "Sat 17 Oct"). */
export function tripDates(trip) {
  if (!trip?.startDate) return t('No date set');
  const f = (iso, o) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), o);
  const end = tripEnd(trip);
  if (end === trip.startDate) return f(trip.startDate, { weekday: 'short', day: 'numeric', month: 'short' });
  return `${f(trip.startDate, { weekday: 'short', day: 'numeric' })} – ${f(end, { weekday: 'short', day: 'numeric', month: 'short' })}`;
}
