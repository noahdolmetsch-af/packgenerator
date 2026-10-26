/**
 * Touren-Idee 44 «Touren nebeneinander» (Noah 26.10.2026 «1a»: an own page, as in the mockup):
 * two trips side by side: which days overlap, which gear both lists hold but you own too few of,
 * and what is still open before each start. Pure functions, tested in tests/touren-a2.test.js.
 */
import { addDays } from '../agenda.js';
import { unclearOpen, borderOpen } from './prep.js';

/** A timeline is drawn day by day only up to this many days; longer spans show the dates only. */
export const MAX_DAYS = 31;

/** The trips worth comparing: not skipped, not finished, not over yet; by start (no date last). */
export function compareChoices(trips = [], today) {
  return trips
    .filter((x) => x && !x.skipped && !x.finished && (!x.startDate || (spanOf(x)?.end ?? x.startDate) >= today))
    .sort((a, b) => (a.startDate || '9999').localeCompare(b.startDate || '9999'));
}

/** First and last day of a trip ({ start, end } as YYYY-MM-DD), or null without a start date. */
export function spanOf(trip) {
  if (!trip?.startDate) return null;
  const days = Math.max(1, Number(trip.days) || 1);
  return { start: trip.startDate, end: addDays(trip.startDate, days - 1) };
}

/** Every day both trips are on (YYYY-MM-DD, in order). */
export function overlapDays(a, b) {
  const x = spanOf(a);
  const y = spanOf(b);
  if (!x || !y) return [];
  const from = x.start > y.start ? x.start : y.start;
  const to = x.end < y.end ? x.end : y.end;
  const out = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}

/**
 * The days from the first start to the last end, each with who is on the road:
 * [{ day, a, b }], or null when a date is missing or the span is longer than MAX_DAYS.
 */
export function timeline(a, b) {
  const x = spanOf(a);
  const y = spanOf(b);
  if (!x || !y) return null;
  const from = x.start < y.start ? x.start : y.start;
  const to = x.end > y.end ? x.end : y.end;
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (out.length >= MAX_DAYS) return null;
    out.push({ day: d, a: d >= x.start && d <= x.end, b: d >= y.start && d <= y.end });
  }
  return out;
}

/** As readyDone in trips.js: a row linked to an item is done when that item is on the trip. */
const readyDone = (row, trip) => (row.itemId ? (trip.entries ?? []).some((e) => e.itemId === row.itemId) : !!row.done);

const pieces = (trip, itemId) => (trip.entries ?? []).filter((e) => e.itemId === itemId).reduce((n, e) => n + (Number(e.qty) || 1), 0);

/**
 * Gear on both lists: [{ item, need, have, short }], too few first, then by name.
 * need = pieces on list A + list B; have = pieces you own (item.qty, at least 1).
 * Without overlapping days nothing is short: the same piece can go on both trips.
 */
export function sharedGear(a, b, itemsById = {}) {
  const both = [...new Set((a?.entries ?? []).map((e) => e.itemId))].filter((id) => itemsById[id] && (b?.entries ?? []).some((e) => e.itemId === id));
  const overlap = overlapDays(a, b).length > 0;
  return both
    .map((id) => {
      const item = itemsById[id];
      const need = pieces(a, id) + pieces(b, id);
      const have = Math.max(1, Number(item.qty) || 1);
      return { item, need, have, short: overlap && need > have };
    })
    .sort((p, q) => Number(q.short) - Number(p.short) || String(p.item.name).localeCompare(String(q.item.name)));
}

/**
 * What is still open on a trip, row by row (labels are English keys for t()):
 * [{ key, label, done, total | null, state: 'ok' | 'open' | 'none' }]. A row whose list is empty says 'none'.
 */
export function openTasks(trip) {
  const entries = trip?.entries ?? [];
  const ready = trip?.ready ?? [];
  const packed = entries.filter((e) => e.packed).length;
  const readyN = ready.filter((r) => readyDone(r, trip)).length;
  const unclear = Array.isArray(trip?.unclear) ? trip.unclear.length : 0;
  const borderPts = Array.isArray(trip?.border) ? trip.border.reduce((n, c) => n + (c?.points?.length ?? 0), 0) : 0;
  const count = (key, label, done, total) => ({ key, label, done, total, state: !total ? 'none' : done >= total ? 'ok' : 'open' });
  return [
    count('pack', 'Packing list', packed, entries.length),
    count('ready', 'Before the start', readyN, ready.length),
    { key: 'route', label: 'Route', done: trip?.route ? 1 : 0, total: null, state: trip?.route ? 'ok' : 'open' },
    { key: 'planb', label: 'Plan B', done: trip?.planB?.kind ? 1 : 0, total: null, state: trip?.planB?.kind ? 'ok' : 'open' },
    count('unclear', 'Unclear spots', unclear - unclearOpen(trip), unclear),
    count('border', 'Crossing a border', borderPts - borderOpen(trip), borderPts),
  ];
}

/** The two trips shown first: the next two of the choices. */
export const firstPair = (choices = []) => choices.slice(0, 2).map((x) => x.id);

/** Tap a trip: on → off; off → on, and with two already chosen the older pick goes. */
export function pickTrip(chosen = [], id) {
  if (chosen.includes(id)) return chosen.filter((x) => x !== id);
  return [...chosen, id].slice(-2);
}
