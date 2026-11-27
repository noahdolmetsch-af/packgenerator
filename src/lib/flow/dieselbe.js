/**
 * «Eine Fahrt = ein Eintrag» (Noah 27.11.2026, Thread «Wie war's? nach Fitbit-Aktivität reparieren»): the watch (Fitbit) recognises
 * workouts by itself, and the same ride may also come from Garmin via Strava. One rule says when both are the SAME session, so no card,
 * suggestion or sum counts it twice. Until now three places had three rules (20 minutes after the start, overlap ±30 minutes, one tick a day).
 *
 * Rule (Noah «a» 27.11.2026: Strava/Garmin wins, Fitbit stays a second measurement):
 *   • same day;
 *   • the time of the Fitbit workout lies inside the Strava activity (the watch started late or ended early), or – with the same sport
 *     (a sport the app cannot sort, like Tennis, counts as one sport of its own) – within NEAR_MIN minutes of it; without a time on either side the same length (within 10 %) counts;
 *   • the sport fits: the same family (ride, run, walk), or one of them is «other» (Fitbit says Sport, Aerobic workout …).
 * A Fitbit workout that the watch cut into pieces (same sport, a gap of 15 minutes at most) is one workout (joinPieces).
 * «Walk» on the watch is not a workout for the app (WALK_OFF, Noah «a» 27.11.2026: «ich habe noch nie einen Spaziergang geloggt»).
 * Pure; tests/dieselbe.test.js.
 */

/** How far outside the Strava activity a workout of the same sport still counts as the same, in minutes. */
export const NEAR_MIN = 30;
/** A gap up to this many minutes between two pieces of the same sport makes them one workout. */
export const PIECE_GAP = 15;
/** The watch's automatic walks are never asked and never suggested. */
export const WALK_OFF = true;

const toMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** The sport family of a Fitbit workout (healthDays.exercises: type like OUTDOOR_BIKE, WALKING): bike, run, walk or other. */
export function fitFamily(ex) {
  const s = `${ex?.type ?? ''} ${ex?.name ?? ''}`.toUpperCase();
  if (/BIK|CYCL|SPINN/.test(s)) return 'bike';
  if (/RUN|JOG/.test(s)) return 'run';
  if (/WALK|HIK|GEHEN/.test(s)) return 'walk';
  return 'other';
}

/** The sport family of a Strava activity (type like Ride, GravelRide, Run, Walk, Hike): bike, run, walk or other. */
export function stravaFamily(a) {
  const t = String(a?.type ?? '');
  if (/(Ride|Velomobile|Handcycle)$/.test(t)) return 'bike';
  if (/Run$/.test(t)) return 'run';
  if (/^(Hike|Walk)$/.test(t)) return 'walk';
  return 'other';
}

/** True for a workout of the watch that is a plain walk. */
export const isWalk = (ex) => fitFamily(ex) === 'walk';

/** How long a Strava activity lasted, in minutes (elapsed time first), or 0. */
export const stravaMin = (a) => Math.max(0, Math.round((Number(a?.elapsedS) || Number(a?.movingS) || 0) / 60));

/**
 * Is this Fitbit workout the same session as this Strava activity?
 * date: the day of the workout (the row of healthDays); ex: { type, name, start, min }; a: { day, time, elapsedS, movingS, type }.
 */
export function sameSession(date, ex, a) {
  if (!a || a.day !== date) return false;
  const f = fitFamily(ex);
  const s = stravaFamily(a);
  const fits = f === s || f === 'other' || s === 'other';
  if (!fits) return false;
  const fs = toMin(ex?.start);
  const as = toMin(a.time);
  const dur = stravaMin(a);
  if (fs != null && as != null) {
    const fe = fs + Math.max(1, Number(ex?.min) || 1);
    const ae = as + Math.max(1, dur);
    if (fs < ae && as < fe) return true; // the two times touch: the same session, the watch only started late or ended early
    return f === s && fs < ae + NEAR_MIN && as - NEAR_MIN < fe; // the same sport a little before or after
  }
  const am = dur;
  return am > 0 && Number(ex?.min) > 0 && Math.abs(am - ex.min) / ex.min <= 0.1;
}

/**
 * The Strava activity that is the same session as a workout of the watch, or null. When several fit, a Garmin recording wins
 * (the chest strap measures better, Noah 27.11.2026), then the one that starts closest.
 */
export function coveredBy(date, ex, activities = []) {
  const fs = toMin(ex?.start);
  const list = activities.filter((a) => sameSession(date, ex, a));
  if (!list.length) return null;
  const garmin = (a) => (/garmin/i.test(String(a?.device ?? '')) ? 0 : 1);
  const dist = (a) => (fs != null && toMin(a.time) != null ? Math.abs(toMin(a.time) - fs) : 999);
  return [...list].sort((x, y) => garmin(x) - garmin(y) || dist(x) - dist(y))[0];
}

/**
 * Pieces of one sport that follow each other (gap up to PIECE_GAP minutes) become one workout: the first start, the last end,
 * the minutes, km, climb, kcal and zone minutes added, the pulse as the mean weighted by minutes.
 * exercises: one day, any order. → the same list, joined, by start.
 */
export function joinPieces(exercises = []) {
  const list = [...exercises].filter((e) => e && Number(e.min) > 0).sort((a, b) => String(a.start ?? '').localeCompare(String(b.start ?? '')));
  const out = [];
  for (const e of list) {
    const last = out[out.length - 1];
    const gap = last && toMin(last.end) != null && toMin(e.start) != null ? toMin(e.start) - toMin(last.end) : null;
    if (last && last.type === e.type && fitFamily(e) !== 'other' && fitFamily(last) === fitFamily(e) && gap != null && gap >= -2 && gap <= PIECE_GAP) {
      const w = last.min + e.min;
      const sum = (k) => (Number.isFinite(last[k]) || Number.isFinite(e[k]) ? (last[k] || 0) + (e[k] || 0) : undefined);
      const hr = Number.isFinite(last.hr) && Number.isFinite(e.hr) ? Math.round((last.hr * last.min + e.hr * e.min) / w) : (last.hr ?? e.hr);
      const joined = { ...last, end: e.end ?? last.end, min: w, pieces: (last.pieces ?? 1) + 1 };
      for (const k of ['km', 'hm', 'kcal', 'azm']) {
        const v = sum(k);
        if (v !== undefined) joined[k] = Math.round(v * 10) / 10;
      }
      if (hr !== undefined) joined.hr = hr;
      out[out.length - 1] = joined;
    } else out.push({ ...e });
  }
  return out;
}
