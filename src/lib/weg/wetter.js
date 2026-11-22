/**
 * «Weg zum Ziel» › weather window (Noah 05.11.2026 «4a», mockup G3): from 7 days before the start, a strip of the days
 * around the start day with the rain chance of each, and one calm sentence: «Dry Thu to Sat». It only reads the
 * forecast that the tour of the way has already saved (trip.forecast, weather.js); it fetches nothing, so it works
 * offline and shows what the tour knows. A hint only, the user decides.
 *
 * The tour of the way: goal.tripId, else the trip that starts on the goal's start day (tripOfGoal in types/packen.js).
 * A day is wet from the rain limit of the app on (rainlimit.svelte.js, standard 30 %).
 *
 * windowOf(goal, trips, today, limit) → null (nothing to show) or
 *   { state: 'nodata' | 'window', start, days: [{ date, pct, wet, isStart }], run?: { from, to }, startWet, wetBefore: [date] }
 * Pure, tested in tests/weg-wetter.test.js. Days are calendar days ('YYYY-MM-DD'); nothing reads the clock.
 */
import { shift, daysBetween } from './weg.js';
import { tripOfGoal } from './types/packen.js';

/** From this many days before the start the window shows. */
export const SHOW_FROM = 7;
/** Days shown before and after the start day. */
export const AROUND = 3;

export function windowOf(goal, trips = [], today = '', limit = 30) {
  if (!goal?.start || !today) return null;
  const until = daysBetween(today, goal.start);
  if (until == null || until > SHOW_FROM || until < 0) return null;
  const trip = tripOfGoal(goal, trips);
  const from = shift(goal.start, -AROUND) < today ? today : shift(goal.start, -AROUND);
  const to = shift(goal.start, AROUND);
  const byDate = new Map((trip?.forecast?.days ?? []).map((d) => [d.date, d]));
  const days = [];
  for (let d = from; d <= to; d = shift(d, 1)) {
    const f = byDate.get(d);
    if (!f || f.rainPct == null) continue;
    days.push({ date: d, pct: Math.round(f.rainPct), wet: f.rainPct >= limit, isStart: d === goal.start });
  }
  if (!days.length) return { state: 'nodata', start: goal.start, days: [], wetBefore: [] };
  const at = days.findIndex((d) => d.isStart);
  let run = null;
  if (at >= 0 && !days[at].wet) {
    let a = at;
    let b = at;
    while (a > 0 && !days[a - 1].wet && days[a - 1].date === shift(days[a].date, -1)) a--;
    while (b < days.length - 1 && !days[b + 1].wet && days[b + 1].date === shift(days[b].date, 1)) b++;
    run = { from: days[a].date, to: days[b].date };
  }
  return {
    state: 'window',
    start: goal.start,
    days,
    run,
    startWet: at >= 0 ? days[at].wet : null,
    startPct: at >= 0 ? days[at].pct : null,
    wetBefore: days.filter((d) => d.date < goal.start && d.wet).map((d) => d.date),
  };
}

/** What the card says: { title, text } as English keys for t() with vars, {label} = a day word chosen by the page. */
export function sayWindow(w) {
  if (!w || w.state === 'nodata') return { title: 'No forecast saved yet', text: 'The tour of this way has no saved forecast. Plan the tour in Pack and load the weather there; it shows here.', vars: {} };
  const wetBefore = w.wetBefore.length ? 'Wet days before the start: better a rehearsal indoors.' : '';
  if (w.startWet === null) return { title: 'Forecast around the start', text: 'The start day is not in the forecast yet.', vars: {}, extra: wetBefore };
  if (w.startWet) return { title: 'Rain around the start', text: 'Your start looks wet ({pct} % rain). A hint only: you decide.', vars: { pct: w.startPct }, extra: wetBefore };
  const single = w.run.from === w.run.to;
  return { title: single ? 'Dry on the start day' : 'Dry from {from} to {to}', text: 'Your start is in a dry window.', vars: { from: w.run.from, to: w.run.to }, extra: wetBefore };
}
