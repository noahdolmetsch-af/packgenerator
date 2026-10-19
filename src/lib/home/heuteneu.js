/**
 * 0.155.0 «Heute neu geordnet» (HN4, Noah 14.10.2026 21:51 «1a 2a 3a 4b HN4 freigegeben»; HN4b 22:13
 * «HN4b freigegeben»): the small rules of the new Heute. Pure, tested in tests/heuteneu.test.js.
 *
 * - tourNear: the day before a trip and its days (4b: the trip card moves up under the day card).
 * - dayCardPart: the part of the day the day card shows (the one day clock of src/lib/dayclock.js).
 * - lastActivity, nextFixed: what the Aktiv tile and the day card show (observation only).
 * - challengeNow, bodyNow: two of the four pieces of the compact balance (HN4b-1).
 */
import { partOfDay, DAY_PARTS, DAY_CLOCK } from '../dayclock.js';
import { onTripDay } from '../ride.js';
import { homeTrips } from './heute.js';
import { challengesOf, countOf, suggestOf } from '../challenge.js';

/** Calendar days (no 24 h steps): the date at noon UTC plus n days. */
export function addDay(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}

/**
 * HN4 4b: a trip that starts tomorrow, or one that is under way today (not skipped, not finished, not a
 * test trip, not archived). → the trip or null
 */
export function tourNear(trips = [], today) {
  const tomorrow = addDay(today, 1);
  const live = homeTrips(trips).filter((x) => x.startDate && !x.skipped && !x.finished && x.status !== 'done');
  return live.find((x) => onTripDay(x, today)) ?? live.find((x) => x.startDate === tomorrow) ?? null;
}

/** The day card's part for an hour: 'morning' | 'day' | 'evening' | 'night' (Nacht 22–6, RE «Eine Tagesuhr»). */
export const dayCardPart = (hour) => partOfDay(hour);
/** The parts in the order of the day clock, with the hour they start and end (for «bis 11 Uhr» and so on). */
export const PART_HOURS = DAY_PARTS.map((p, i) => ({ part: p, from: DAY_CLOCK[p], to: DAY_CLOCK[DAY_PARTS[(i + 1) % DAY_PARTS.length]] }));

/** The newest ride (file rides and counted Strava rides, see kmbook.js withStravaRides). → { date, km, hr, source } | null */
export function lastActivity(rides = []) {
  const r = [...(rides ?? [])].filter((x) => x?.date).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!r) return null;
  const hr = Number(r.hrAvg ?? r.hr ?? 0);
  return { date: r.date, km: Math.round(Number(r.km) || 0), hr: hr > 0 ? Math.round(hr) : null, source: r.source === 'strava' ? 'strava' : 'file' };
}

/** The weekday 1 (Mon) … 7 (Sun) of a day. */
const wdOf = (day) => ((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
/**
 * The next fixed date of the week (Aktiv › Woche, flowweek.js fixedList): today later than now, else the
 * next days. → { actId, day, time, wd } | null
 */
export function nextFixed(fixed = [], today, hm = '00:00') {
  if (!fixed.length) return null;
  for (let n = 0; n < 8; n++) {
    const day = addDay(today, n);
    const wd = wdOf(day);
    const hit = fixed.filter((f) => f.wd === wd && (n > 0 || f.time > hm)).sort((a, b) => a.time.localeCompare(b.time))[0];
    if (hit) return { actId: hit.actId, day, time: hit.time, wd };
  }
  return null;
}

/**
 * HN4b-1 «Challenge»: the running challenge (not stopped, not reached, until today or later), with how many
 * times it counts so far. suggests: { [area]: stored suggestion record }. → { what, n, times, until } | null
 */
export function challengeNow(list, suggests = {}, today) {
  const c = challengesOf(list).find((x) => !x.stopped && !x.doneOn && x.until >= today && x.from <= today);
  if (!c) return null;
  return { id: c.id, what: c.what, n: Math.min(c.times, countOf(c, suggestOf(suggests[c.area]))), times: c.times, until: c.until };
}

/**
 * HN4b-1 «Körper»: the resting pulse of the last 7 days from «Wi gaht's?» (koerper.ruhepuls, typed by hand
 * until Fitbit comes) and the active zone minutes (only with Fitbit; none yet). Nothing is estimated.
 * → { pulse, lo, hi, days: [values oldest first], azm: null }
 */
export function bodyNow(answers = [], today) {
  const from = addDay(today, -6);
  const rows = answers.filter((a) => a.qid === 'koerper.ruhepuls' && a.day >= from && a.day <= today && Number(a.value) > 0).sort((a, b) => a.day.localeCompare(b.day) || String(a.at ?? '').localeCompare(String(b.at ?? '')));
  const vals = rows.map((a) => Math.round(Number(a.value)));
  return { pulse: vals.at(-1) ?? null, lo: vals.length ? Math.min(...vals) : null, hi: vals.length ? Math.max(...vals) : null, days: vals, azm: null };
}

/** The felt sleep of today from «Wi gaht's?» (erholung.schlaf, 1–10) or null. */
export function feltSleep(answers = [], today) {
  const r = answers.filter((a) => a.qid === 'erholung.schlaf' && a.day === today && a.value != null).sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))[0];
  return r ? Number(r.value) : null;
}
