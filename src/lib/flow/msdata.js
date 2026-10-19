/**
 * Package G «Daten kommen von selbst» (#231–#233): the other sources of the data milestones
 * (flowms.js dataMilestones), from the rows as stored. Pure functions; data.svelte.js reads the tables.
 *
 * - rideKm (#231): the km of every ride once. The bikes' ledger (kmBook: counted entries of kind
 *   'ride': files, Strava CSV, Strava sync, by hand, a trip's km from the debrief) plus the Strava
 *   rides of «Training» that have no ledger entry (a ride before a bike's start point, a ride without a
 *   bike). A Strava ride known to the ledger (same Strava id, or same day and km) counts by its entry,
 *   so nothing counts twice; a ride on an ignored Strava bike and an indoor ride without a bike never.
 * - steps, azm, sleepMin (#232): the Fitbit days (healthDays), observation only.
 * - checkDays (#233): days with any Tages-Check answer (flowChecks) or «Deine Abfragen» answer.
 * - packOk (#233): finished debriefs with nothing missing, on the trip's last day (test trips and
 *   skipped trips left out).
 * - careOnTime (#233): a service or replacement of a part with an interval (chain wax 150 km, sealant
 *   90 days, fork and shock 365 days, or the bike's own numbers) done before or when it was due: the
 *   km and days since the service before stay within the interval. The first service of a part has
 *   nothing to compare with and does not count.
 */
import { checkOf } from '../flowcheck.js';
import { partInfo } from '../care.js';
import { tripEnd } from '../tripstate.js';
import { isTestTrip } from '../testname.js';
import { notIgnored } from '../kmbook.js';

const INDOOR = /virtual|indoor|trainer/i;
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const add = (m, d, v) => {
  if (isDay(d) && Number(v) > 0) m.set(d, (m.get(d) ?? 0) + Number(v));
};
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/** km per day: the counted ledger rides, plus the Strava rides the ledger does not know. */
export function rideKmByDay(book = [], acts = [], ignore = []) {
  const out = new Map();
  const rides = (book ?? []).filter((e) => e?.kind === 'ride');
  for (const e of rides) if (e.state === 'counted') add(out, e.date, e.km);
  const ids = new Set(rides.filter((e) => e.stravaId).map((e) => String(e.stravaId)));
  const near = (a) => rides.some((e) => e.state !== 'removed' && e.date === a.day && Math.abs((Number(e.km) || 0) - (Number(a.km) || 0)) <= Math.max(1, 0.03 * (Number(a.km) || 0)));
  for (const a of notIgnored(acts ?? [], ignore)) {
    if (a?.kind !== 'bike' || !a.day || ids.has(String(a.id))) continue;
    if ((INDOOR.test(a.type ?? '') || a.trainer) && !a.gearId) continue;
    if (near(a)) continue;
    add(out, a.day, a.km);
  }
  return out;
}

/** The Fitbit days as three day maps (observation only). */
export function healthMaps(rows = []) {
  const steps = new Map();
  const azm = new Map();
  const sleepMin = new Map();
  for (const r of rows ?? []) {
    add(steps, r?.date, r?.steps);
    add(azm, r?.date, r?.azm);
    add(sleepMin, r?.date, r?.sleep?.asleepMin);
  }
  return { steps, azm, sleepMin };
}

/** Whether a Tages-Check row holds any answer (morning or evening). */
export function checkFilled(c) {
  const x = checkOf(c, c?.day);
  const nums = ['sleep', 'energy', 'mood', 'extra', 'sat', 'fun', 'vision'].some((k) => x[k] != null);
  const lists = ['joy', 'last', 'best'].some((k) => x[k].length);
  const one = [x.goal, x.goalDone, x.outside, x.people, x.mindful === 'auto' ? null : x.mindful].some((v) => v != null) || !!x.story.trim() || !!x.visionNote.trim();
  return nums || lists || one;
}
/** The days with a check answer: the daily check rows and the «Deine Abfragen» answers. */
export function checkDaysOf(checks = [], answers = []) {
  const out = new Set();
  for (const c of checks ?? []) if (isDay(c?.day) && checkFilled(c)) out.add(c.day);
  for (const a of answers ?? []) if (isDay(a?.day) && (a.value != null || a.note)) out.add(a.day);
  return out;
}

/** One day per trip whose finished debrief misses nothing (the trip's last day). Null without any finished debrief. */
export function packOkDays(trips = [], debriefs = []) {
  const byId = new Map((trips ?? []).map((t) => [t.id, t]));
  const done = (debriefs ?? []).filter((d) => d?.status === 'done' && byId.has(d.tripId) && !isTestTrip(byId.get(d.tripId)) && !byId.get(d.tripId).skipped);
  if (!done.length) return null;
  return done.filter((d) => !(d.missing ?? []).length).map((d) => tripEnd(byId.get(d.tripId)) ?? String(d.doneAt ?? '').slice(0, 10)).filter(isDay);
}

/** One day per service done on time (see above). Null without a bike. */
export function careOnTimeDays(bikes = []) {
  if (!(bikes ?? []).length) return null;
  const out = [];
  for (const b of bikes)
    for (const p of (b.parts ?? []).map(partInfo)) {
      if (!(p.everyKm > 0) && !(p.everyDays > 0)) continue;
      const done = (p.history ?? []).filter((h) => (h.action === 'service' || h.action === 'replace') && isDay(h.date)).sort((a, c) => a.date.localeCompare(c.date));
      for (let i = 1; i < done.length; i++) {
        const [a, c] = [done[i - 1], done[i]];
        const km = typeof a.km === 'number' && typeof c.km === 'number' ? c.km - a.km : null;
        const byKm = p.everyKm > 0 && km != null ? km <= p.everyKm : null;
        const byDays = p.everyDays > 0 ? daysBetween(a.date, c.date) <= p.everyDays : null;
        if (byKm == null && byDays == null) continue; // nothing to measure: no star, no guess
        if (byKm !== false && byDays !== false) out.push(c.date);
      }
    }
  return out;
}

/** Everything msContext({ extra }) needs, from the rows as stored. */
export function msExtra({ book = [], acts = [], ignore = [], health = [], checks = [], answers = [], trips = [], debriefs = [], bikes = [] } = {}) {
  return {
    rideKm: rideKmByDay(book, acts, ignore),
    ...healthMaps(health),
    checkDays: checkDaysOf(checks, answers),
    packOk: packOkDays(trips, debriefs),
    careOnTime: careOnTimeDays(bikes),
  };
}
