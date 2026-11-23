/**
 * «Rhythmus und Vergleiche» (Noah 22.11.2026 «1a 2a 3a 4a 5a», Thread «Alle Sportarten und Erholung», Schritt C und H):
 * what the card «Deine Woche» and the week review say besides the five numbers. Only reading, nothing is saved, observation
 * only (nothing is rated). Pure: no database, no clock. The numbers come from the one calculation of weekcalc.js.
 *
 *   dayDots        the seven days of the week, a dot for each day with a session or a ride; today and the days to come are grey
 *   usualWeek      the mean of the four weeks before (the same days when the week is still running), weeks without anything left out
 *   lastYearWeek   the same week one year before (52 weeks back, same weekday), only when it holds anything
 *   answerLines    «Wi gaht's?» of the week: one line per area from 3 answers, every scale question on its own, and on how many days
 */
import { shiftDay } from './training.js';
import { weekCalc } from './weekcalc.js';

/** The weeks before that make the «usual week» (Noah 22.11.2026 «4»: mean of the 4 weeks before, as weekreview.js USUAL_WEEKS). */
export const USUAL = 4;
/** An area or a question needs this many answers in the week before it is evaluated (Noah 22.11.2026: «nur ab 3 Antworten»). */
export const MIN_ANSWERS = 3;

const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const round1 = (x) => Math.round(x * 10) / 10;
const nothing = (w) => !w.n && !w.km && !w.hm;

/**
 * The days of the week. → { dots: [{ day, active, future, today }], active, of }
 * `of` is the number of days that count (Monday up to today, at most 7): a running week is not judged by days that did not come yet.
 */
export function dayDots(calc, monday, today) {
  const on = new Set(calc?.days ?? []);
  const dots = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(monday, i);
    return { day, active: on.has(day), future: day > today, today: day === today };
  });
  const counted = dots.filter((d) => !d.future);
  return { dots, active: counted.filter((d) => d.active).length, of: counted.length };
}

/**
 * The usual week: the mean of the four weeks before (the same days, Monday to `upto`, when the week is still running).
 * Weeks with nothing at all are left out (a break or no data); fewer than two weeks left → null (no «usual» yet).
 * → { secs, km, hm, n, days, weeks } or null
 */
export function usualWeek(data, monday, upto = shiftDay(monday, 6)) {
  const off = (m) => shiftDay(upto, -(Date.parse(`${monday}T12:00:00Z`) - Date.parse(`${m}T12:00:00Z`)) / 864e5);
  const weeks = Array.from({ length: USUAL }, (_, i) => shiftDay(monday, -7 * (i + 1)))
    .map((m) => weekCalc(data, m, off(m)))
    .filter((w) => !nothing(w));
  if (weeks.length < 2) return null;
  return {
    secs: Math.round(mean(weeks.map((w) => w.secs))),
    km: round1(mean(weeks.map((w) => w.km))),
    hm: Math.round(mean(weeks.map((w) => w.hm))),
    n: round1(mean(weeks.map((w) => w.n))),
    days: round1(mean(weeks.map((w) => w.days.length))),
    weeks: weeks.length,
  };
}

/** The same week one year before (52 weeks back, so Monday stays Monday), or null when it holds nothing (Noah 22.11.2026 «H»). */
export function lastYearWeek(data, monday, upto = shiftDay(monday, 6)) {
  const w = weekCalc(data, shiftDay(monday, -364), shiftDay(upto, -364));
  return nothing(w) ? null : { monday: shiftDay(monday, -364), secs: w.secs, km: w.km, hm: w.hm, n: w.n, days: w.days.length };
}

/** The answers of «Wi gaht's?» that are numbers on a scale, within the days. */
const scaleIn = (answers, from, to) => (answers ?? []).filter((a) => a?.kind === 'scale' && Number.isFinite(Number(a.value)) && a.day >= from && a.day <= to);
const areaOf = (a) => a.area || String(a.qid).split('.')[0] || 'eigene';

/**
 * The answers of the week. → { areas: [{ area, n, mean, prev }], questions: [{ qid, n, mean, prev }], days, of }
 *   areas      one line per area with at least MIN_ANSWERS scale answers in the week, most answers first; prev = the mean of the week before
 *   questions  every scale question answered in the week, also with 1–2 answers (`few: true`, then no mean shown), most answers first
 *   days       on how many days of the week there was any answer; of = the days that count (Monday to `upto`)
 */
export function answerLines(answers, monday, upto = shiftDay(monday, 6)) {
  const end = shiftDay(monday, 6) < upto ? shiftDay(monday, 6) : upto;
  const pm = shiftDay(monday, -7);
  const pe = shiftDay(end, -7);
  const now = scaleIn(answers, monday, end);
  const before = scaleIn(answers, pm, pe);
  const group = (list, key) => {
    const m = new Map();
    for (const a of list) m.set(key(a), [...(m.get(key(a)) ?? []), Number(a.value)]);
    return m;
  };
  const prevOf = (m, k) => (m.get(k)?.length >= MIN_ANSWERS ? round1(mean(m.get(k))) : null);
  const byArea = group(now, areaOf);
  const prevArea = group(before, areaOf);
  const byQ = group(now, (a) => a.qid);
  const prevQ = group(before, (a) => a.qid);
  const areas = [...byArea.entries()]
    .filter(([, v]) => v.length >= MIN_ANSWERS)
    .map(([area, v]) => ({ area, n: v.length, mean: round1(mean(v)), prev: prevOf(prevArea, area) }))
    .sort((a, b) => b.n - a.n || a.area.localeCompare(b.area));
  const questions = [...byQ.entries()]
    .map(([qid, v]) => ({ qid, n: v.length, few: v.length < MIN_ANSWERS, mean: v.length < MIN_ANSWERS ? null : round1(mean(v)), prev: prevOf(prevQ, qid) }))
    .sort((a, b) => b.n - a.n || a.qid.localeCompare(b.qid));
  const days = new Set((answers ?? []).filter((a) => a?.day >= monday && a.day <= end).map((a) => a.day)).size;
  const of = Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${monday}T12:00:00Z`)) / 864e5) + 1;
  return { areas, questions, days, of };
}
