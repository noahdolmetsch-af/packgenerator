/**
 * «Eine gemeinsame Rechnung» (Noah 22.11.2026 «1a 2a 3a 4a 5a», Thread «Alle Sportarten und Erholung», Schritt B): one week
 * of movement, calculated ONE way for the Heute card «Deine Woche», the page «Wochenrückblick» and its comparisons.
 * Only reading, nothing is saved. Pure: no database, no clock.
 *
 *   Sessions and time   the shared units (flow/einheiten.js): ticks of Aktiv and Strava activities once each. Time is
 *                       «gemessen» (Strava, timer, typed) plus «ca.» (the usual duration of the sport, usualmin.js), kept apart.
 *   Velo km and Hm      ONE list of rides (kmbook.js withStravaRides: file rides, counted Strava rides, Strava rides without a
 *                       ledger entry). A Strava ride that stands twice in the ledger counts once. Rides that still wait in
 *                       «Zum Prüfen» count too and are named (`waiting`), so the week never shows less quietly.
 *   Other km            Strava activities that are no ride (running, hiking): their own small number, never called «Velo».
 *   Watch               Fitbit workouts nobody ticked (fitbittraining.js): only a hint (`watch`), never counted by themselves.
 *
 * Left out as before: daily habits (every goal «each day»), the ride to work and trip days, the TrainingPeaks plan (a wish, no session).
 */
import { shiftDay } from './training.js';
import { einheiten } from './flow/einheiten.js';
import { training } from './flow/sportjahr.js';
import { suggestions } from './flow/fitbittraining.js';
import { counts, notIgnored, onePerStravaId, waitsInStrava, withStravaRides } from './kmbook.js';

const round1 = (x) => Math.round(x * 10) / 10;

/**
 * data: { acts (db.activities), log (flowLog), flowActs, rides (db.rides), book (db.kmBook), usual (sport.usualMin map),
 *         map (strava.ticks map), ignore (Strava bikes set to «Ignorieren»), health (healthDays), handled (fitbit.ticked) };
 *         everything but acts, log and flowActs is optional.
 * → { secs, measuredSecs, caSecs, nCa, noTime, n, km, hm, waiting, other: { km, n }, watch: { n, min } }
 */
export function weekCalc(data, monday, upto = shiftDay(monday, 6)) {
  const { acts = [], log = [], flowActs = [], rides = [], book = [], usual = {}, map = {}, ignore = [], health = [], handled = [] } = data ?? {};
  const end = shiftDay(monday, 6) < upto ? shiftDay(monday, 6) : upto;
  const within = (d) => !!d && d >= monday && d <= end;

  // sessions and time: shared units of the move ring, without daily habits, the ride to work and trip days
  const daily = new Set(flowActs.filter((a) => (a.goals ?? []).length && a.goals.every((g) => g.days === 1)).map((a) => a.id));
  const ownLog = log.filter((e) => e.via !== 'trip' && !daily.has(e.actId));
  const units = training(einheiten({ log: ownLog, activities: acts, acts: flowActs, usual, map })).filter((u) => within(u.day));
  let measured = 0;
  let ca = 0;
  let nCa = 0;
  let noTime = 0;
  for (const u of units) {
    if (u.minQuelle === 'gemessen') measured += u.min;
    else if (u.minQuelle === 'ca.') {
      ca += u.min;
      nCa += 1;
    } else noTime += 1;
  }

  // the rides: one list, each Strava ride once
  const near = (d) => !!d && d >= shiftDay(monday, -1) && d <= shiftDay(end, 1); // a day of margin: the ledger date can differ from the Strava day by the time zone
  const ledger = onePerStravaId(book.filter((e) => near(e.date)));
  const bike = notIgnored(acts.filter((a) => a?.kind === 'bike' && within(a.day)), ignore);
  const list = withStravaRides(rides, ledger, bike).filter((r) => within(r.date));
  const counted = new Set(ledger.filter((e) => e.stravaId && counts(e)).map((e) => String(e.stravaId)));
  const waiting = ledger.filter((e) => waitsInStrava(e) && e.kind === 'ride' && within(e.date) && !counted.has(String(e.stravaId)));
  const kmOf = (xs, f) => xs.reduce((s, x) => s + (Number(f(x)) || 0), 0);
  const hmOf = (r) => (Number.isFinite(r.gainM) ? r.gainM : 0);
  const km = round1(kmOf(list, (r) => r.km) + kmOf(waiting, (e) => e.km));
  const hm = Math.round(kmOf(list, hmOf) + kmOf(waiting, (e) => (Number.isFinite(e.hm) ? e.hm : 0)));

  // other Strava sports (running, hiking …): their own small number
  const kindOf = new Map(acts.map((a) => [String(a.id), a.kind]));
  const others = units.filter((u) => u.stravaId && kindOf.get(String(u.stravaId)) && kindOf.get(String(u.stravaId)) !== 'bike');
  const other = { km: round1(kmOf(others, (u) => u.km)), n: others.length };

  // the watch: workouts without a tick, only told
  const todo = suggestions({ health, acts: flowActs, log, activities: acts, handled, today: end }).filter((s) => within(s.day));
  const watch = { n: todo.length, min: todo.reduce((s, x) => s + (Number(x.min) || 0), 0) };

  return { secs: (measured + ca) * 60, measuredSecs: measured * 60, caSecs: ca * 60, nCa, noTime, n: units.length, km, hm, waiting: waiting.length, other, watch };
}
