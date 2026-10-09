/**
 * v0.41.0 "GPX → Learning" (Noah, 9.10.2026): upload a recorded ride, see moving time and pauses,
 * compare it with the plan and keep 1-3 learnings, each with one tap.
 *
 * - A ride is a GPX (or TCX) file with a time on every point (Garmin, Wahoo, Strava, Komoot export).
 *   It is read on the device; only the numbers, a thinned line and the profile are stored, in the
 *   table "rides": { id, name, file, date, startAt, km, gainM, lossM, movingH, pauseH, totalH,
 *   pauses: [{ km, at, min }], parts, line, profile, start, end, tripId, plan, basis, answers,
 *   pace, createdAt }.
 * - Pauses (Noah 2): a stop of PAUSE_MIN (5) minutes or more is a pause; a shorter stop (a red
 *   light, a photo) counts as moving time. A stop is the rider staying within STOP_RADIUS_KM of one
 *   point, so GPS jitter while standing and a watch on auto-pause both count as standing.
 * - Planned vs real (Noah 3): from the trip's route (trip.route, shared out per day like the ride
 *   day does), its riding hours (trip.hours) or its time plan (trip.plan.schedule).
 * - Learnings (Noah 4): 1-3 suggestions; nothing is stored without a tap. A confirmed one is a
 *   normal learning (table "learnings", the same shape as debrief.js applyDebrief writes).
 * - The ride can feed "Your pace" (pace.js, settings 'pace'), so the time guess learns.
 *
 * Pure functions, tested in tests/gpx041.test.js. No Strava, Komoot or RWGPS connection: those
 * need a server with a login (Noah 6).
 */
import { distKm, climb, thin, profileOf, CLIMB_MH } from './route.js';
import { learnPace } from './pace.js';
import { stageCount, dayIndex, dayGain, planHours, onTripDay } from './ride.js';
import { t } from './i18n.svelte.js';

/** A stop this long or longer (minutes) is a pause; shorter stops count as moving time. */
export const PAUSE_MIN = 5;
/** Standing: within this distance (km) of the point where the stop began. */
export const STOP_RADIUS_KM = 0.03;
/** Slower than this over a gap in the recording (km/h) is standing. */
const STILL_KMH = 3;
/** A pause this long (minutes) is worth a learning ("Long pause at km 80"). */
export const LONG_PAUSE_MIN = 20;
/** Speed and climbing: a difference of this share or more is worth a learning. */
export const DIFF_SHARE = 0.1;
/** A file bigger than this is refused before it is read (a phone would hang). */
export const RIDE_MAX_MB = 40;

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const round5 = (v) => Math.round(v * 1e5) / 1e5;
const attr = (s, name) => s.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];
const tag = (s, name) => s.match(new RegExp(`<${name}>\\s*([^<]+?)\\s*</${name}>`, 'i'))?.[1];

/** Is this file a recorded ride we can read (GPX or TCX)? */
export const rideKind = (text) => (/<TrainingCenterDatabase/i.test(text) ? 'tcx' : /<gpx[\s>]/i.test(text) ? 'gpx' : null);

/**
 * The points of a ride with position, elevation and time, oldest first.
 * GPX: track points (<trkpt lat lon><ele/><time/></trkpt>); TCX: <Trackpoint> with <Time>,
 * <LatitudeDegrees>, <LongitudeDegrees>, <AltitudeMeters>. Points without a position are left out.
 */
export function ridePoints(text) {
  // v0.44.1 (AP22): an empty file is called empty, like the route in Pack (not "not a GPX file").
  if (!String(text ?? '').trim()) throw new Error(t('This file is empty.'));
  const kind = rideKind(text);
  if (!kind) throw new Error(t('This is not a GPX file.'));
  const out = [];
  if (kind === 'gpx') {
    for (const m of text.matchAll(/<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/gi)) {
      const lat = Number(attr(m[1], 'lat'));
      const lon = Number(attr(m[1], 'lon'));
      const body = m[2] ?? '';
      const ele = Number(tag(body, 'ele'));
      const at = Date.parse(tag(body, 'time') ?? '');
      if (Number.isFinite(lat) && Number.isFinite(lon)) out.push({ lat, lon, ele: Number.isFinite(ele) ? ele : null, t: Number.isFinite(at) ? at : null });
    }
  } else {
    for (const m of text.matchAll(/<Trackpoint\b[^>]*>([\s\S]*?)<\/Trackpoint>/gi)) {
      const lat = Number(tag(m[1], 'LatitudeDegrees'));
      const lon = Number(tag(m[1], 'LongitudeDegrees'));
      const ele = Number(tag(m[1], 'AltitudeMeters'));
      const at = Date.parse(tag(m[1], 'Time') ?? '');
      if (Number.isFinite(lat) && Number.isFinite(lon) && tag(m[1], 'LatitudeDegrees')) out.push({ lat, lon, ele: Number.isFinite(ele) ? ele : null, t: Number.isFinite(at) ? at : null });
    }
  }
  return out;
}

/**
 * The stops of a ride: runs of points that stay within STOP_RADIUS_KM of the point where the run
 * began, at least PAUSE_MIN minutes long; and a gap in the recording of that length with hardly any
 * way between its two points (a watch on auto-pause). Returns [{ from, to, ms }] (point indexes).
 */
export function findPauses(pts, minMin = PAUSE_MIN, radiusKm = STOP_RADIUS_KM) {
  const out = [];
  const need = minMin * 60000;
  let i = 0;
  while (i < pts.length - 1) {
    let j = i;
    while (j + 1 < pts.length && distKm(pts[i], pts[j + 1]) <= radiusKm) j++;
    const ms = pts[j].t - pts[i].t;
    const gap = pts[i + 1].t - pts[i].t;
    if (j > i && ms >= need) {
      out.push({ from: i, to: j, ms });
      i = j;
    } else if (gap >= need && (distKm(pts[i], pts[i + 1]) / gap) * 36e5 < STILL_KMH) {
      // a watch on auto-pause: one long gap in time, hardly any way between the two points
      out.push({ from: i, to: i + 1, ms: gap });
      i++;
    } else i++;
  }
  return out;
}

/**
 * One recorded ride → the numbers to store, or an Error with a plain message.
 * - The ride starts at the first point and ends at the last one; a stop at the very start or
 *   end (the watch running at home) is cut off, it is neither a pause nor riding time.
 * - km and climbing leave out the jitter of the pauses.
 * - parts: the climbing kilometres (3 % or steeper over a kilometre) and the flat ones (under 2 %),
 *   each with km, metres up and hours, for "Climbing slower than assumed".
 */
export function analyseRide(text, file = '') {
  const all = ridePoints(text)
    .filter((p) => p.t != null)
    .sort((a, b) => a.t - b.t);
  if (all.length < 2) throw new Error(t('This file has no times. Upload a recorded ride, not a planned route.'));
  let pauses = findPauses(all);
  let s = 0;
  let e = all.length - 1;
  if (pauses[0]?.from === 0) (s = pauses[0].to), (pauses = pauses.slice(1));
  if (pauses.at(-1)?.to === all.length - 1) (e = pauses.at(-1).from), (pauses = pauses.slice(0, -1));
  const pts = all.slice(s, e + 1);
  pauses = pauses.map((p) => ({ ...p, from: p.from - s, to: p.to - s }));
  if (pts.length < 2 || pts.at(-1).t <= pts[0].t) throw new Error(t('This ride is too short to read.'));

  // Inside a pause the rider stands: no km, no climbing, no riding time.
  const still = new Array(pts.length).fill(false);
  for (const p of pauses) for (let k = p.from + 1; k <= p.to; k++) still[k] = true;
  let km = 0;
  const kmAt = [0];
  for (let k = 1; k < pts.length; k++) {
    if (!still[k]) km += distKm(pts[k - 1], pts[k]);
    kmAt.push(km);
  }
  const moving = pts.filter((_, k) => !still[k] || pauses.some((p) => p.to === k));
  const { gain, loss } = climb(moving);
  const totalMs = pts.at(-1).t - pts[0].t;
  const pauseMs = pauses.reduce((sum, p) => sum + p.ms, 0);
  const startAt = new Date(pts[0].t).toISOString();
  const name =
    text.match(/<(?:trk|metadata)>[\s\S]*?<name>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/name>/i)?.[1]?.trim() ||
    file.replace(/\.(gpx|tcx)$/i, '') ||
    t('Ride|dayride');
  return {
    id: `ride-${startAt.slice(0, 16)}-${Math.round(km)}`,
    name: decode(name),
    file,
    date: localDate(pts[0].t),
    startAt,
    km: r1(km),
    gainM: gain,
    lossM: loss,
    totalH: r2(totalMs / 36e5),
    pauseH: r2(pauseMs / 36e5),
    movingH: r2((totalMs - pauseMs) / 36e5),
    pauses: pauses.map((p) => ({ km: r1(kmAt[p.from]), at: new Date(pts[p.from].t).toISOString(), min: Math.round(p.ms / 60000) })),
    parts: parts(pts, still),
    line: thin(moving),
    profile: profileOf(moving),
    start: { lat: round5(pts[0].lat), lon: round5(pts[0].lon) },
    end: { lat: round5(pts.at(-1).lat), lon: round5(pts.at(-1).lon) },
  };
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
/** The day of the ride on the device's clock (YYYY-MM-DD), so a ride at 6 am in Zurich is that day. */
const localDate = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Climbing and flat kilometres (moving only). null without elevation. */
function parts(pts, still) {
  if (pts.filter((p) => p.ele != null).length < 2) return null;
  const out = { climb: { km: 0, gainM: 0, h: 0 }, flat: { km: 0, h: 0 } };
  let chunk = null;
  const close = () => {
    if (!chunk || chunk.km < 0.2 || chunk.ele0 == null || chunk.ele1 == null) return;
    const grade = (chunk.ele1 - chunk.ele0) / (chunk.km * 1000);
    if (grade >= 0.03) (out.climb.km += chunk.km), (out.climb.gainM += chunk.ele1 - chunk.ele0), (out.climb.h += chunk.ms / 36e5);
    else if (Math.abs(grade) < 0.02) (out.flat.km += chunk.km), (out.flat.h += chunk.ms / 36e5);
  };
  for (let k = 1; k < pts.length; k++) {
    if (still[k]) {
      close();
      chunk = null;
      continue;
    }
    chunk ??= { km: 0, ms: 0, ele0: pts[k - 1].ele, ele1: null };
    chunk.km += distKm(pts[k - 1], pts[k]);
    chunk.ms += pts[k].t - pts[k - 1].t;
    if (pts[k].ele != null) chunk.ele1 = pts[k].ele;
    chunk.ele0 ??= pts[k].ele;
    if (chunk.km >= 1) close(), (chunk = null);
  }
  close();
  return {
    climb: { km: r1(out.climb.km), gainM: Math.round(out.climb.gainM), h: r2(out.climb.h) },
    flat: { km: r1(out.flat.km), h: r2(out.flat.h) },
  };
}

/** Average speed while moving (km/h), or null. */
export const speedOf = (ride) => (ride?.km && ride.movingH > 0 ? r1(ride.km / ride.movingH) : null);

/* ---------- which trip ---------- */

/** Trips the ride may belong to: not called off and the ride's day is one of their days. */
export const tripsOn = (trips = [], date) => trips.filter((tr) => !tr.skipped && onTripDay(tr, date)).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));

/**
 * A past trip made from a ride (Noah 1: "offer to create a past trip from it"): one day, the bike
 * given (or none), no packing list, the ride as its route. It ends on the ride's day, so it is a
 * past trip at once; it never asks for a debrief (nothing was packed in the app).
 */
export function tripFromRide(ride, bike = null, now = Date.now()) {
  return {
    id: `trip-${now.toString(36)}`,
    domain: 'bikepacking',
    title: ride.name,
    startDate: ride.date,
    days: 1,
    bikeId: bike?.id ?? null,
    bike: bike?.name ?? null,
    setup: { ...(bike?.setup ?? {}) },
    entries: [],
    ready: [],
    status: 'done',
    finished: ride.date,
    route: { name: ride.name, km: ride.km, gainM: ride.gainM, lossM: ride.lossM, start: ride.start, end: ride.end, line: ride.line, profile: ride.profile, file: ride.file },
    fromRide: ride.id,
    createdAt: new Date(now).toISOString(),
  };
}

/* ---------- planned vs real ---------- */

/**
 * What the trip planned for the day of the ride: { km, gainM, hours, kmh, source } or null.
 * km and climbing: the route shared out per day (like the ride day, ride.js stage); a nonstop
 * trip has one stage. Hours: the time plan (riding blocks, without breaks), else the riding hours
 * typed per day (trip.hours), else the guess from the route with the pace given (unrounded).
 * source: 'plan' | 'hours' | 'guess'.
 */
export function plannedFor(trip, date, pace) {
  if (!trip) return null;
  const days = stageCount(trip);
  const day = days > 1 ? dayIndex(trip, date) : 0;
  const route = trip.route?.km ? trip.route : null;
  const km = route ? r1(route.km / days) : null;
  const gainM = route ? dayGain(route, day, days) : null;
  let hours = null;
  let source = null;
  const fromPlan = planHours(trip);
  if (fromPlan) (hours = fromPlan), (source = 'plan');
  else if (Number(trip.hours) > 0) (hours = Number(trip.hours)), (source = 'hours');
  else if (km && pace?.kmh) (hours = km / pace.kmh + (gainM ?? 0) / (pace.climbMh || CLIMB_MH)), (source = 'guess');
  if (km == null && hours == null) return null;
  return { km, gainM, hours: hours == null ? null : r2(hours), kmh: km && hours ? r1(km / hours) : null, source };
}

/**
 * Planned against real, one row per number that both sides know:
 * [{ key: 'km' | 'gain' | 'moving' | 'speed', plan, real, diff }] (diff: real minus plan).
 */
export function compareRide(ride, plan) {
  if (!ride || !plan) return [];
  const real = { km: ride.km, gain: ride.gainM, moving: ride.movingH, speed: speedOf(ride) };
  const want = { km: plan.km, gain: plan.gainM, moving: plan.hours, speed: plan.kmh };
  return ['km', 'gain', 'moving', 'speed']
    .filter((k) => want[k] != null && real[k] != null)
    .map((k) => ({ key: k, plan: want[k], real: real[k], diff: k === 'gain' ? Math.round(real[k] - want[k]) : r2(real[k] - want[k]) }));
}

/* ---------- learnings ---------- */

/**
 * 1-3 learnings from a ride (Noah 4), most telling first. Each: { id, label, detail, rule }.
 * - speed: moving speed against the plan (or, without a plan, against your pace guess), when it
 *   differs by DIFF_SHARE and at least 1 km/h. "You ride faster than planned: 19 km/h instead of 16".
 * - pause: the longest pause, from LONG_PAUSE_MIN minutes. "Long pause at km 80".
 * - climb: the climbing kilometres against the guess (basis: { kmh, climbMh }), when they took
 *   DIFF_SHARE more (or less) time than the guess AND than the ride as a whole did, so a slow day
 *   does not also say "climbing slower". "Climbing slower than assumed".
 * answered: ids already answered (yes or no); they are left out.
 */
export function rideLearnings(ride, plan, basis, answered = []) {
  const out = [];
  const real = speedOf(ride);
  const want = plan?.kmh ?? basis?.kmh ?? null;
  if (real && want && ride.km >= 10 && ride.movingH >= 0.5 && Math.abs(real - want) >= 1 && Math.abs(real / want - 1) >= DIFF_SHARE) {
    const faster = real > want;
    const vars = { real: Math.round(real), plan: Math.round(want) };
    const label = plan?.kmh
      ? faster ? t('You ride faster than planned: {real} km/h instead of {plan}', vars) : t('You ride slower than planned: {real} km/h instead of {plan}', vars)
      : faster ? t('You ride faster than your guess: {real} km/h instead of {plan}', vars) : t('You ride slower than your guess: {real} km/h instead of {plan}', vars);
    out.push({ id: 'speed', label, detail: t('Moving time only; pauses of {n} minutes or more are left out.', { n: PAUSE_MIN }), rule: label });
  }
  const long = [...(ride.pauses ?? [])].sort((a, b) => b.min - a.min)[0];
  if (long && long.min >= LONG_PAUSE_MIN) {
    const label = t('Long pause at km {km}', { km: Math.round(long.km) });
    out.push({ id: 'pause', label, detail: t('{min} min. Plan a stop there next time.', { min: long.min }), rule: t('Long pause at km {km} ({min} min): plan a stop there.', { km: Math.round(long.km), min: long.min }) });
  }
  const c = ride.parts?.climb;
  if (c && c.km >= 2 && c.gainM >= 100 && c.h > 0 && basis?.kmh) {
    const climbMh = basis.climbMh || CLIMB_MH;
    const guess = c.km / basis.kmh + c.gainM / climbMh;
    const whole = ride.km / basis.kmh + (ride.gainM ?? 0) / climbMh;
    const ratio = c.h / guess;
    const overall = whole > 0 ? ride.movingH / whole : 1;
    const vars = { real: Math.round(c.gainM / c.h / 10) * 10, plan: Math.round(c.gainM / guess / 10) * 10 };
    if (ratio >= 1 + DIFF_SHARE && ratio - overall >= DIFF_SHARE) {
      const label = t('Climbing slower than assumed: {real} m per hour instead of {plan}', vars);
      out.push({ id: 'climb', label, detail: t('Uphill took {pct} % longer than the guess.', { pct: Math.round((ratio - 1) * 100) }), rule: label });
    } else if (ratio <= 1 - DIFF_SHARE && overall - ratio >= DIFF_SHARE) {
      const label = t('Climbing faster than assumed: {real} m per hour instead of {plan}', vars);
      out.push({ id: 'climb', label, detail: t('Uphill took {pct} % less time than the guess.', { pct: Math.round((1 - ratio) * 100) }), rule: label });
    }
  }
  return out.filter((s) => !answered.includes(s.id)).slice(0, 3);
}

/**
 * A confirmed learning, in the shape every learning has (debrief.js applyDebrief): the next
 * number as id, topic 'Pace', the ride (or its trip) as the source. rideId links it back.
 */
export function learningFrom(sugg, learnings = [], source = '', rideId = null, now = new Date().toISOString()) {
  const id = Math.max(0, ...learnings.map((l) => (typeof l.id === 'number' ? l.id : 0))) + 1;
  return { id, topic: 'Pace', rule: sugg.rule, action: '', itemIds: [], source, appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: now, rideId, kind: sugg.id };
}

/* ---------- your pace ---------- */

/**
 * The ride added to "Your pace" (settings 'pace', pace.js): the same row an imported GPX gets
 * there, and the pace learned again. A ride already there (same id) is not added twice.
 * Returns the new setting value.
 */
export function addToPace(setting, ride, now = new Date().toISOString()) {
  const rides = [...(setting?.rides ?? [])];
  if (!rides.some((r) => r.id === ride.id)) rides.push({ id: ride.id, name: ride.name, date: ride.date, km: ride.km, gainM: ride.gainM, movingH: ride.movingH, totalH: ride.totalH, use: true, from: 'upload' });
  const learned = learnPace(rides);
  return { ...(learned ?? { kmh: null, climbMh: null }), rides, updatedAt: now };
}

/** The ride taken out of "Your pace" again (when the ride is deleted). */
export function dropFromPace(setting, rideId, now = new Date().toISOString()) {
  const rides = (setting?.rides ?? []).filter((r) => r.id !== rideId);
  const learned = learnPace(rides);
  return { ...(learned ?? { kmh: null, climbMh: null }), rides, updatedAt: now };
}

/** "3:05" for hours. */
export const hm = (h) => {
  if (h == null) return '–';
  const mins = Math.round(h * 60);
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
};

/* ---------- a file shared from another app (Android share sheet) ---------- */

/** Where the service worker leaves a shared file (public/share-target.js uses the same names). */
export const SHARE_CACHE = 'pg-shared-ride';
export const SHARE_KEY = 'shared-ride';
