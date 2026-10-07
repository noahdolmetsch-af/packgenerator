/**
 * v0.22.0 (AP06): one statement per scope, the same on Home, in Pack and in Bikes → Care.
 *
 * Why (analysis 7.10.2026): Home said "Scott Spark: all fine" while Bike care said "Top up sealant,
 * 13 days overdue". Each page counted its own way: Home's bike rows left out the services by time
 * (sealant, fork, shock: "answer 17b, only in Bike care"), counted the Excel preparation tasks of
 * the next trip as the bike's "to do", and said "all fine" when nothing was recorded at all; Care's
 * "Due now" left out worn parts and repairs; the bike comparison and Pack used the 14-day window.
 *
 * Now there are three named scopes, each with its own label and count:
 * - Bike care (bikeCare): service and wear due on that bike now, whatever trip comes. A trip adds
 *   what becomes due before or on it as `soon`, apart from the count.
 * - Event preparation (eventPrep): the preparation tasks from the Excel list for one trip
 *   (they stay on every trip for now, Noah has not decided, PF13).
 * - Packing status (packStatus): what is in the bags and the ready check of one trip.
 * Missing maintenance data is "no data", never "fine".
 *
 * Pure functions (the texts follow the language), so they are easy to test.
 */
import { checkState, isPrep, taskBike, prepFor, prepSummary, PART, isEvent } from './care.js';
import { bikeDue, beforeTrip, timeDue, tyreSetup } from './workshop.js';
import { bikesHash } from './bikes.js';
import { readyDone } from './trips.js';
import { t, tn } from './i18n.svelte.js';
import { localDay } from './localday.js';


/** The kind of a bike row: 'time' (sealant, fork, shock), 'km' (wax the chain), 'check' (1000 km), 'part' (worn or work needed). */
const kindOf = (r) => (r.worn ? 'part' : r.key === 'check' ? 'check' : PART[r.key]?.everyKm ? 'km' : 'time');

/**
 * Bike care for one bike. bike: from withVisits (parts with the workshop jobs).
 * trip (optional): adds `soon`, what becomes due before or on that trip (from 14 days before).
 * Returns { scope: 'bike', bikeId, bikeName, rows, soon, late, gaps, kmMissing, status, href } with
 * rows: [{ key, kind, part, name, detail, late, task? }] due now (services, check, worn parts, open repairs);
 * status: 'due' (rows), 'nodata' (nothing due but nothing to judge by) or 'ok' (nothing due).
 * gaps: check points and services by time without any record.
 */
export function bikeCare(bike, { tasks = [], visits = [], trip = null, today = localDay() } = {}) {
  if (!bike) return null;
  const setup = tyreSetup(bike, visits);
  const rows = bikeDue(bike, { startDate: today, days: 1 }, setup, today, today)
    .rows.filter((r) => r.late || r.worn)
    .map((r) => ({ key: `${kindOf(r)}:${r.key}`, kind: kindOf(r), part: r.key, name: r.name, detail: r.detail, late: true }));
  for (const x of tasks.filter((x) => !isPrep(x) && taskBike(x) === bike.id && (x.status === 'open' || x.status === 'needed'))) {
    rows.push({ key: `repair:${x.id}`, kind: 'repair', part: null, name: x.task, detail: x.status === 'needed' ? t('work needed') : t('open repair'), late: x.status === 'needed', task: x });
  }
  const now = new Set(rows.map((r) => r.part).filter(Boolean));
  const soon = trip && trip.bikeId === bike.id
    ? (beforeTrip(bike, trip, setup, today)?.rows ?? [])
        .filter((r) => !now.has(r.key))
        .map((r) => ({ key: `${kindOf(r)}:${r.key}:${r.when}`, kind: kindOf(r), part: r.key, name: r.name, detail: r.detail, late: false, when: r.when }))
    : [];
  const check = checkState(bike);
  const time = timeDue(bike, setup, today);
  const kmMissing = typeof bike.km !== 'number';
  const gaps = check.unknown + time.filter((s) => s.never).length;
  // Nothing recorded to judge by: no km, or not one check point and not one service by time on record.
  const blind = kmMissing || (check.rows.length > 0 && check.unknown === check.rows.length && time.every((s) => s.never));
  const status = rows.length ? 'due' : blind ? 'nodata' : 'ok';
  return { scope: 'bike', bikeId: bike.id, bikeName: bike.name, rows, soon, late: rows.filter((r) => r.late).length, gaps, kmMissing, status, href: bikesHash({ tab: 'care', bike: bike.id, open: true }) };
}

/**
 * v0.25.0 (Noah answer 10): a short ride (1 day, not an event) shows no bike care as a step
 * before the trip, in Pack and on Today; bike care stays on the Bikes page.
 */
export const isShortRide = (trip) => !!trip && !(Number(trip.days) > 1) && !isEvent(trip);

/**
 * Event preparation for one trip: the tasks from the Excel list with their dates.
 * Returns { scope: 'prep', tripId, open, overdue, needed, done, total, status, href };
 * status: 'open', 'done' or 'none' (no tasks for this trip).
 */
export function eventPrep(trip, tasks = [], today = localDay()) {
  if (!trip) return null;
  const sum = prepSummary(prepFor(trip, tasks, today));
  return { scope: 'prep', tripId: trip.id, ...sum, status: sum.open ? 'open' : sum.total ? 'done' : 'none', href: bikesHash({ tab: 'care', trip: trip.id }) };
}

/**
 * Packing status of one trip: items in the bags and the ready check.
 * Returns { scope: 'pack', tripId, packed, count, ready, readyTotal, status }; status: 'empty', 'open' or 'done'.
 */
export function packStatus(trip) {
  if (!trip) return null;
  const entries = trip.entries ?? [];
  const list = trip.ready ?? [];
  const packed = entries.filter((e) => e.packed).length;
  const ready = list.filter((r) => readyDone(r, trip)).length;
  const status = !entries.length ? 'empty' : packed === entries.length && ready === list.length ? 'done' : 'open';
  return { scope: 'pack', tripId: trip.id, packed, count: entries.length, ready, readyTotal: list.length, status };
}

/* ---------- the words, the same everywhere ---------- */

/** The names of the three scopes. */
export const scopeName = (scope) => (scope === 'bike' ? t('Bike care') : scope === 'prep' ? t('Event preparation') : t('Packing status'));

/**
 * Bike care in words: { tag, text, tone }. tag: the short state ("1 due", "nothing due", "no data");
 * text: what it is about; tone: 'late' | 'due' | 'nodata' | 'ok'. Never "all fine": "nothing due"
 * says only what the app knows.
 */
export function bikeCareWords(c) {
  if (!c) return { tag: '', text: '', tone: 'nodata' };
  if (c.status === 'due') {
    const first = c.rows[0];
    const more = c.rows.length > 1 ? ` ${t('+ {n} more', { n: c.rows.length - 1 })}` : '';
    return { tag: tn(c.rows.length, '{n} due', '{n} due'), text: `${first.name}${first.detail ? `, ${first.detail}` : ''}${more}`, tone: c.late ? 'late' : 'due' };
  }
  if (c.status === 'nodata') return { tag: t('no data'), text: c.kmMissing ? t('km not entered: nothing to judge by') : t('no service or check recorded yet'), tone: 'nodata' };
  return { tag: t('nothing due'), text: c.gaps ? tn(c.gaps, '{n} point without data', '{n} points without data') : '', tone: 'ok' };
}

/** "Bike care · Scott Spark: 1 due" — the one line for Home, Pack and Care. */
export function bikeCareLine(c) {
  if (!c) return '';
  const w = bikeCareWords(c);
  const soon = c.soon?.length ? ` · ${tn(c.soon.length, '{n} more before or on the trip', '{n} more before or on the trip')}` : '';
  return `${t('Bike care · {bike}: {state}', { bike: c.bikeName, state: w.tag })}${soon}`;
}

/** "Event preparation: 11 open (6 overdue)". */
export function eventPrepLine(p) {
  if (!p) return '';
  if (p.status === 'none') return t('Event preparation: no tasks');
  if (p.status === 'done') return t('Event preparation: all {n} done', { n: p.total });
  return p.overdue ? t('Event preparation: {n} open ({m} overdue)', { n: p.open, m: p.overdue }) : t('Event preparation: {n} open', { n: p.open });
}

/** "Packing status: 12 of 87 packed · ready check 3 of 8". */
export function packLine(s) {
  if (!s) return '';
  if (s.status === 'empty') return t('Packing status: nothing on the list yet');
  // v0.22.0 (AP04 words): packed / still to pack, checks checked / open
  return t('Packing status: {packed} packed · {left} still to pack · ready check {ready} checked · {open} open', { packed: s.packed, left: s.count - s.packed, ready: s.ready, open: s.readyTotal - s.ready });
}
