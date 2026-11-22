/**
 * «Weg zum Ziel» › start suggestion for an open period (Noah 05.11.2026 «4a», mockup G3 lower card): a way without a
 * start day (a multi-day tour without a fixed date) can name a period, for example the next two weeks. The app looks in
 * the free forecast for days that are dry (under 1 mm and under 40 % rain chance, like the dream windows) and suggests
 * «Set start Thu 11.06.». It only suggests: the user sets the start day, asks for another window or says no thanks.
 *
 * The forecast is the one the app already keeps per place (db.meta DREAM_WX, dreams/wetterfenster.js); the place is the
 * home place. The forecast reaches 16 days; a period further away has nothing to look at yet and the card says so.
 *
 * goal.period = { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' } or absent. Pure, tested in tests/weg-startvorschlag.test.js.
 */
import { isDry } from '../dreams/wetterfenster.js';
import { isDay, shift } from './weg.js';

/** Days in a row a start window needs. */
export const NEED = 3;

/** The period made safe: { from, to } with from ≤ to, or null. */
export function periodOf(p) {
  return p && isDay(p.from) && isDay(p.to) && p.from <= p.to ? { from: p.from, to: p.to } : null;
}

/** The period of a goal (only for a goal without a start day), or null. */
export const goalPeriod = (goal) => (goal && !goal.start ? periodOf(goal.period) : null);

/**
 * The windows of dry days in a row inside the period, from today on, earliest first:
 * [{ from, to, n, start }] (start = the first dry day). days: [{ date, rainMm, rainPct }]. A day the forecast does
 * not know is not dry.
 */
export function windowsIn(days = [], period, today, need = NEED) {
  const p = periodOf(period);
  if (!p || !today) return [];
  const first = p.from < today ? today : p.from;
  const inside = days.filter((d) => d?.date && d.date >= first && d.date <= p.to).sort((a, b) => a.date.localeCompare(b.date));
  const out = [];
  let run = [];
  const close = () => {
    if (run.length >= need) out.push({ from: run[0], to: run.at(-1), n: run.length, start: run[0] });
    run = [];
  };
  for (const d of inside) {
    if (isDry(d) && (!run.length || shift(run.at(-1), 1) === d.date)) run.push(d.date);
    else {
      close();
      if (isDry(d)) run = [d.date];
    }
  }
  close();
  return out;
}

/**
 * What the card says: { state, ... }.
 *   'noplace'  no home place, the forecast has no place
 *   'nodata'   no forecast kept yet (offline or still loading)
 *   'far'      the period starts after the last forecast day (lastDay)
 *   'none'     the forecast covers the period but has no window of dry days
 *   'window'   win = the window to suggest, more = how many other windows exist, i = its index
 */
export function suggestion(goal, kept, today, { hasPlace = true, skip = 0 } = {}) {
  const period = goalPeriod(goal);
  if (!period) return null;
  if (!hasPlace) return { state: 'noplace', period };
  const days = kept?.days ?? [];
  if (!days.length) return { state: 'nodata', period };
  const lastDay = days.map((d) => d.date).sort().at(-1);
  if (period.from > lastDay) return { state: 'far', period, lastDay };
  const all = windowsIn(days, period, today);
  if (!all.length) return { state: 'none', period, lastDay };
  const i = ((skip % all.length) + all.length) % all.length;
  return { state: 'window', period, win: all[i], i, count: all.length, lastDay };
}
