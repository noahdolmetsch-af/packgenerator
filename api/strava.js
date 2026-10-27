/**
 * /api/strava (E3 «Strava-Verbindung», mockups S1–S5 approved by Noah 12.10.2026 13:39 Zurich).
 *
 * The app fetches Noah's rides with their Strava bike, so every ride lands on the right bike
 * (Garmin profile → Strava default bike per sport type → app). Read only: the server never writes
 * to Strava. One owner: the first athlete who connects (or ALLOWED_ATHLETE_ID).
 *
 *   POST ?step=start        { returnTo }        → { url } (the Strava login page)
 *   GET  ?step=callback     (Strava sends the browser back here) → 302 into the app with #…&strava=connected&key=…
 *   GET  ?step=status       Bearer <device key> → { connected, athlete, scope }
 *   GET  ?step=gear         Bearer              → { bikes: [{ id, name, km, primary, retired }], ftp } (ftp: the profile's FTP or null)
 *   GET  ?step=activities   Bearer, &after=<unix s>&before=<unix s>&page=1 → { activities, page, more }
 *   GET  ?step=zones        Bearer              → { hr: [{ min, max }], custom } (Training TR, Noah 13.10.2026 «1-5a»)
 *   GET  ?step=detail       Bearer, &id=<activity id> → { kcal, hist, curve, w20, … cHist, secs5, prof, hw, halves, climbs, photos,
 *                           laps, splits, rpe, tempMin, tempMax, steep } (the heart rate per second as a
 *                           histogram { bpm: seconds }, a short curve [[minute, bpm]] and the best 20 minutes of
 *                           power from a power meter; never the route)
 *   GET  ?step=line         Bearer, &id=<activity id> → { id, line } (Paket S «Reise-Spur»: the finer route line of one
 *                           activity, encoded polyline; for rides fetched before the list carried the line)
 *   POST ?step=disconnect   Bearer              → { ok } (Strava access withdrawn; device keys stay for Google)
 *
 * BF8 «Gratis-Grenzen» (Noah 13.10.2026): every answer after a call to Strava carries `rate`, Strava's
 * request numbers from its headers (X-RateLimit-* and X-ReadRateLimit-*, "15 min,day"), also with a 429.
 *
 * Environment (names only; values only in the Vercel project «packgen», never in code or chat):
 *   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, optional ALLOWED_ATHLETE_ID, KV_REST_API_URL / KV_REST_API_TOKEN.
 * In the Strava API settings the «Authorization Callback Domain» must be packgen-three.vercel.app.
 *
 * Redis: strava:tokens (JSON, access + refresh token), strava:athlete (owner id), app:keys (device key hashes);
 * friends: strava:athletes (set), strava:invite:<hash> (7 days, once), strava:friend:<id> (+ :devices).
 *
 * «Strava pro Person vorbereiten» (Noah 27.10.2026 «3: nur ich bleibe verbunden, aber vorbereiten»): a friend
 * may connect their own Strava once their athlete id is in STRAVA_ATHLETES (comma list, empty = nobody, so
 * today only the owner). A friend's tokens live in strava:tokens:<id>; the friend's device key is NOT in
 * app:keys (that set also opens Google, which stays the owner's) but in strava:device:<key hash> → <id>.
 * Strava itself lets an app have one athlete until Strava approves more (free request).
 * Never logged or answered: tokens, codes, the secret.
 */
import { route, json, needStore, redisEnv, pick, ApiError, API_BASE } from './_lib/core.js';
import { needDevice, newDevice, saveState, takeState, backToApp, jsonBody, bearer, hash, randomKey } from './_lib/oauth.js';
import { rateOf } from './_lib/rate.js';

export const AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize';
export const TOKEN_URL = 'https://www.strava.com/oauth/token';
export const DEAUTH_URL = 'https://www.strava.com/oauth/deauthorize';
export const API = 'https://www.strava.com/api/v3';
/** read_all on activities: private rides and commutes count for the bikes too; profile:read_all: the bike list. */
export const SCOPE = 'read,profile:read_all,activity:read_all';
export const CALLBACK = `${API_BASE}/api/strava?step=callback`;
const PER_PAGE = 200; // Strava's maximum; Noah's ~1300 rides are 7 pages

/** The owner's tokens (unchanged key, so the owner needs no new login); a friend's: strava:tokens:<athlete id>. */
export const OWNER_TOKENS = 'strava:tokens';
export const friendTokens = (id) => `strava:tokens:${id}`;
/** A friend's device: its key hash → the athlete id. Not in app:keys, so it never opens Google. */
export const friendDevice = (h) => `strava:device:${h}`;

/**
 * Whose Strava this request reads: the owner's for a key in app:keys, a friend's for a friend's key,
 * else 401 (as needDevice). Returns the Redis key of the tokens.
 */
export async function whoseTokens(request, store) {
  const key = bearer(request);
  if (key) {
    const friend = await store.get(friendDevice(hash(key)));
    if (friend && /^\d{1,20}$/.test(friend)) return friendTokens(friend);
  }
  await needDevice(request, store);
  return OWNER_TOKENS;
}

/**
 * Switch at any time (Noah 27.10.2026 «bauen, dass wir in zukunft jederzeit umstellen können»): the owner
 * lets friends in from the app, without Vercel. «Freund einladen» gives a link that works once within
 * 7 days; whoever connects Strava with it is kept in strava:athletes (next to STRAVA_ATHLETES).
 */
export const FRIENDS = 'strava:athletes';
export const INVITE_DAYS = 7;
export const inviteKey = (code) => `strava:invite:${hash(code)}`;
/** A friend's name (Strava first name) and since when, for the owner's list. */
export const friendInfo = (id) => `strava:friend:${id}`;
/** The device key hashes of a friend, so «Entfernen» closes every device of theirs. */
export const friendDevices = (id) => `strava:friend:${id}:devices`;
const goodInvite = (v) => typeof v === 'string' && /^[\w-]{8,40}$/.test(v);

export function stravaEnv(e = process.env) {
  return {
    clientId: pick('STRAVA_CLIENT_ID', e),
    clientSecret: pick('STRAVA_CLIENT_SECRET', e),
    allowedAthlete: pick('ALLOWED_ATHLETE_ID', e),
    athletes: (pick('STRAVA_ATHLETES', e) ?? '').split(',').map((x) => x.trim()).filter((x) => /^\d{1,20}$/.test(x)),
    ...redisEnv(e),
  };
}

/** The start of a ride as a coarse grid cell '47.4,8.5' (0.1°, about 10 km), or null. */
export function spotOf(ll) {
  if (!Array.isArray(ll) || ll.length < 2) return null;
  const [lat, lon] = ll.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return `${(Math.round(lat * 10) / 10).toFixed(1)},${(Math.round(lon * 10) / 10).toFixed(1)}`;
}

/** A Strava activity as the app's ride needs it (nothing else leaves the server). */
export function trimActivity(a) {
  return {
    id: String(a.id),
    name: a.name ?? '',
    type: a.sport_type || a.type || '',
    start: a.start_date ?? null,
    startLocal: a.start_date_local ?? null,
    km: Math.round((Number(a.distance) || 0) / 100) / 10,
    hm: Math.round(Number(a.total_elevation_gain) || 0),
    movingS: Number(a.moving_time) || 0,
    elapsedS: Number(a.elapsed_time) || 0,
    gearId: a.gear_id ?? null,
    device: a.device_name ?? '',
    // Paket S «Reise-Spur» (Noah 19.10.2026 «1a»): the route as Strava's short line (encoded polyline), for the tour map
    line: typeof a.map?.summary_polyline === 'string' && a.map.summary_polyline ? a.map.summary_polyline.slice(0, 60_000) : null,
    commute: !!a.commute,
    trainer: !!a.trainer,
    hrAvg: a.has_heartrate === false || !Number(a.average_heartrate) ? null : Math.round(Number(a.average_heartrate)),
    hrMax: a.has_heartrate === false || !Number(a.max_heartrate) ? null : Math.round(Number(a.max_heartrate)),
    // power (Noah 13.10.2026 «a»): Ø and max watts; device false = Strava's estimate (no max then)
    wAvg: Number(a.average_watts) > 0 ? Math.round(Number(a.average_watts)) : null,
    wMax: Number(a.max_watts) > 0 ? Math.round(Number(a.max_watts)) : null,
    wDevice: !!a.device_watts,
    // tour look back (Noah 13.10.2026 «alle, DGS1 bis DGS5», «a und b»): speed in km/h, cadence and
    // temperature only with a sensor, NP and kJ only from a power meter, Relative Effort from heart rate
    spdAvg: Number(a.average_speed) > 0 ? Math.round(Number(a.average_speed) * 36) / 10 : null,
    spdMax: Number(a.max_speed) > 0 ? Math.round(Number(a.max_speed) * 36) / 10 : null,
    cad: Number(a.average_cadence) > 0 ? Math.round(Number(a.average_cadence)) : null,
    tempAvg: a.average_temp == null || !Number.isFinite(Number(a.average_temp)) ? null : Math.round(Number(a.average_temp)),
    wNorm: a.device_watts && Number(a.weighted_average_watts) > 0 ? Math.round(Number(a.weighted_average_watts)) : null,
    kj: a.device_watts && Number(a.kilojoules) > 0 ? Math.round(Number(a.kilojoules)) : null,
    effort: Number(a.suffer_score) > 0 ? Math.round(Number(a.suffer_score)) : null,
    // «Velo-Inspektion» (Noah 19.10.2026 «3a»): where the ride started, only to about 10 km (0.1°), for the rain
    spot: spotOf(a.start_latlng),
    // «Strava-Fahrt vollständig» (Noah 19.10.2026 «2a»): the kind (race, workout, long), the new bests,
    // the highest and lowest point; nothing about the route
    workout: WORKOUT[Number(a.workout_type)] ?? null,
    prs: Number(a.pr_count) > 0 ? Math.round(Number(a.pr_count)) : 0,
    achv: Number(a.achievement_count) > 0 ? Math.round(Number(a.achievement_count)) : 0,
    elevHigh: Number.isFinite(Number(a.elev_high)) && a.elev_high != null ? Math.round(Number(a.elev_high)) : null,
    elevLow: Number.isFinite(Number(a.elev_low)) && a.elev_low != null ? Math.round(Number(a.elev_low)) : null,
  };
}

/** Strava's workout_type as a word: 1/11 race, 2 long run, 3/12 workout; 0/10 (default) is none. */
export const WORKOUT = { 1: 'race', 11: 'race', 2: 'long', 3: 'workout', 12: 'workout' };

const r1 = (v) => Math.round(v * 10) / 10;
const posOr = (v) => (Number(v) > 0 ? Number(v) : null);
const LAPS_MAX = 60;
const SPLITS_MAX = 300;

/**
 * The laps of the bike computer (the lap button, or Garmin's auto lap): per lap km, moving seconds,
 * metres climbed, Ø heart rate, Ø watts (power meter only), Ø km/h. Only with two laps or more.
 */
export function trimLaps(list, meter = false) {
  if (!Array.isArray(list) || list.length < 2) return [];
  return list.slice(0, LAPS_MAX).map((l, i) => ({
    n: i + 1,
    name: String(l?.name ?? '').slice(0, 60),
    km: r1((Number(l?.distance) || 0) / 1000),
    s: Math.round(Number(l?.moving_time) || Number(l?.elapsed_time) || 0),
    el: Math.round(Number(l?.elapsed_time) || 0),
    hm: Math.round(Number(l?.total_elevation_gain) || 0),
    hr: posOr(l?.average_heartrate) ? Math.round(Number(l.average_heartrate)) : null,
    w: meter && posOr(l?.average_watts) ? Math.round(Number(l.average_watts)) : null,
    kmh: posOr(l?.average_speed) ? r1(Number(l.average_speed) * 3.6) : null,
  }));
}

/** Strava's splits per km: km number, moving seconds, metres up or down, Ø heart rate, Ø km/h. */
export function trimSplits(list) {
  if (!Array.isArray(list) || list.length < 2) return [];
  return list.slice(0, SPLITS_MAX).map((x, i) => ({
    k: Number(x?.split) || i + 1,
    km: r1((Number(x?.distance) || 0) / 1000),
    s: Math.round(Number(x?.moving_time) || Number(x?.elapsed_time) || 0),
    hm: Number.isFinite(Number(x?.elevation_difference)) ? Math.round(Number(x.elevation_difference)) : null,
    hr: posOr(x?.average_heartrate) ? Math.round(Number(x.average_heartrate)) : null,
    kmh: posOr(x?.average_speed) ? r1(Number(x.average_speed) * 3.6) : null,
  }));
}

/** Strava's «How hard was it?» (1–10), or null when not given. */
export const rpeOf = (one) => {
  const n = Math.round(Number(one?.perceived_exertion));
  return n >= 1 && n <= 10 ? n : null;
};

/**
 * From the temperature and the course: the lowest and highest temperature, and the steepest
 * 200 metres in % (with at least 10 m up, so a jump of the altimeter does not count).
 */
export const STEEP_M = 200;
export function trimExtra(streams) {
  const time = streams?.time?.data;
  const len = Array.isArray(time) ? time.length : 0;
  const arr = (k) => (Array.isArray(streams?.[k]?.data) && streams[k].data.length === len ? streams[k].data : null);
  const temp = arr('temp');
  let tempMin = null;
  let tempMax = null;
  if (temp) {
    const vals = temp.map(Number).filter((v) => Number.isFinite(v) && v > -40 && v < 60);
    if (vals.length) (tempMin = Math.round(Math.min(...vals))), (tempMax = Math.round(Math.max(...vals)));
  }
  const dist = arr('distance');
  const alt = arr('altitude');
  let steep = null;
  if (dist && alt) {
    let j = 0;
    for (let i = 0; i < len; i++) {
      while (j < len && Number(dist[j]) - Number(dist[i]) < STEEP_M) j++;
      if (j >= len) break;
      const up = Number(alt[j]) - Number(alt[i]);
      const run = Number(dist[j]) - Number(dist[i]);
      if (up >= 10 && run > 0) {
        const g = (up / run) * 100;
        if (g < 40 && (steep == null || g > steep)) steep = g;
      }
    }
    if (steep != null) steep = r1(steep);
  }
  return { tempMin, tempMax, steep };
}

/**
 * Tour-Auswertung «wie komoot» (Noah 20.10.2026): the course by distance and the speed over time, still
 * no position. dprof: the height every `step` km (50 m, coarser on very long rides, at most DPROF_MAX
 * points), as whole metres, first value then differences; the app smooths and draws it like a planned
 * route (map/fineprofile.js). sprof: up to SPROF_POINTS rows [minute, km/h] over the whole time, stops 0.
 */
export const DPROF_MAX = 6000;
export const SPROF_POINTS = 400;
export function trimCourse(streams) {
  const time = streams?.time?.data;
  const len = Array.isArray(time) ? time.length : 0;
  const arr = (k) => (Array.isArray(streams?.[k]?.data) && streams[k].data.length === len ? streams[k].data : null);
  const dist = arr('distance');
  const alt = arr('altitude');
  if (!dist || len < 2) return { dprof: null, sprof: null };
  const totalKm = (Number(dist[len - 1]) || 0) / 1000;
  let dprof = null;
  if (alt && totalKm > 0.1) {
    let step = 0.05;
    while (totalKm / step > DPROF_MAX) step *= 2;
    const n = Math.floor(totalKm / step) + 1;
    const d = [];
    let j = 0;
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const m = i * step * 1000;
      while (j < len - 2 && Number(dist[j + 1]) < m) j++;
      const [a, b] = [Number(dist[j]), Number(dist[j + 1])];
      const [ha, hb] = [Number(alt[j]), Number(alt[j + 1])];
      const h = Math.round(m <= a ? ha : m >= b ? hb : ha + ((hb - ha) * (m - a)) / (b - a || 1));
      d.push(i ? h - prev : h);
      prev = h;
    }
    dprof = { step, km: Math.round(totalKm * 100) / 100, d };
  }
  const t0 = Number(time[0]) || 0;
  const span = (Number(time[len - 1]) || 0) - t0;
  let sprof = null;
  if (span > 0) {
    const k = Math.min(SPROF_POINTS, len - 1);
    sprof = [];
    let j = 0;
    for (let b = 0; b < k; b++) {
      const from = t0 + (span * b) / k;
      const to = t0 + (span * (b + 1)) / k;
      while (j < len - 1 && Number(time[j + 1]) <= from) j++;
      let e = j;
      while (e < len - 1 && Number(time[e]) < to) e++;
      const dt = Number(time[e]) - Number(time[j]);
      const dd = Number(dist[e]) - Number(dist[j]);
      sprof.push([Math.round((from - t0) / 6) / 10, dt > 0 && dd > 0 ? Math.round((dd / dt) * 36) / 10 : 0]);
    }
  }
  return { dprof, sprof, ser: seriesOf(time, dist, arr) };
}

/**
 * Strava-Analyse 1:1 (Noah 20.10.2026 «nimm das als vorlage und baue es 1:1 nach»): the curves under the
 * profile, all on one km grid of at most SER_POINTS steps: t (seconds since the start), alt (m), spd
 * (km/h × 10), w (W), hr, cad, temp; null where the ride has no such sensor. Mean over each step.
 */
export const SER_POINTS = 600;
function seriesOf(time, dist, arr) {
  const len = time.length;
  const totalKm = (Number(dist[len - 1]) || 0) / 1000;
  if (!(totalKm > 0.2)) return null;
  let step = 0.05;
  while (totalKm / step > SER_POINTS) step = Math.round(step * 2 * 1000) / 1000;
  const n = Math.max(2, Math.ceil(totalKm / step));
  const srcs = { alt: arr('altitude'), w: arr('watts'), hr: arr('heartrate'), cad: arr('cadence'), temp: arr('temp') };
  const keys = Object.keys(srcs).filter((k) => srcs[k]);
  const sum = Object.fromEntries(keys.map((k) => [k, new Array(n).fill(0)]));
  const cnt = Object.fromEntries(keys.map((k) => [k, new Array(n).fill(0)]));
  const t = new Array(n).fill(null);
  const firstT = new Array(n).fill(null);
  const firstD = new Array(n).fill(null);
  const lastT = new Array(n).fill(null);
  const lastD = new Array(n).fill(null);
  for (let i = 0; i < len; i++) {
    const d = Number(dist[i]) || 0;
    const b = Math.min(n - 1, Math.floor(d / 1000 / step));
    const ti = Number(time[i]) || 0;
    if (firstT[b] == null) (firstT[b] = ti), (firstD[b] = d);
    lastT[b] = ti;
    lastD[b] = d;
    if (t[b] == null) t[b] = ti;
    for (const k of keys) {
      const v = Number(srcs[k][i]);
      if (Number.isFinite(v) && (k === 'alt' || k === 'temp' || v >= 0)) (sum[k][b] += v), cnt[k][b]++;
    }
  }
  const out = { step, km: Math.round(totalKm * 100) / 100, t: [], spd: [] };
  for (const k of keys) out[k] = [];
  let prevT = 0;
  for (let b = 0; b < n; b++) {
    const tb = t[b] ?? prevT;
    out.t.push(Math.round(tb));
    prevT = tb;
    // speed over the step, without the time standing still in it (gaps over 30 s)
    const dd = (lastD[b] ?? 0) - (firstD[b] ?? 0);
    const dt = (lastT[b] ?? 0) - (firstT[b] ?? 0);
    out.spd.push(dd > 0 && dt > 0 && dt < 3600 ? Math.round((dd / dt) * 36) : null);
    for (const k of keys) out[k].push(cnt[k][b] ? Math.round(sum[k][b] / cnt[k][b]) : null);
  }
  return out;
}

/** Strava's heart rate zones: the upper bounds in order, the last open (max -1). */
export function trimZones(z) {
  const list = Array.isArray(z?.heart_rate?.zones) ? z.heart_rate.zones : [];
  return { hr: list.map((x) => ({ min: Math.round(Number(x.min) || 0), max: Number.isFinite(Number(x.max)) ? Math.round(Number(x.max)) : -1 })), custom: !!z?.heart_rate?.custom_zones };
}

const CURVE_POINTS = 120;
/**
 * The heart rate of one activity, reduced: seconds per beat (for the zones, so a changed zone needs
 * no new call) and at most CURVE_POINTS averages for the chart. Nothing about the route.
 */
/**
 * The best 20 minutes of power in watts: the highest average over 1200 moving seconds (a gap of more
 * than 30 s is a pause and does not count). null when the ride has no power stream or is shorter.
 */
/** Power per moving second (a gap of more than 30 s is a pause and does not count). */
function powerSeconds(time, watts) {
  if (!Array.isArray(time) || !Array.isArray(watts) || watts.length < 2) return [];
  const sec = [];
  for (let i = 0; i < watts.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    if (!(dt > 0 && dt <= 30)) continue;
    const w = Math.max(0, Number(watts[i]) || 0);
    for (let k = 0; k < dt; k++) sec.push(w);
  }
  return sec;
}

/** The highest whole number of a stream (cadence: Strava check 21.10.2026, 110 against 95 from the short series), or null. */
export function maxOf(data) {
  if (!Array.isArray(data)) return null;
  let m = 0;
  for (const v of data) if (Number(v) > m) m = Number(v);
  return m > 0 ? Math.round(m) : null;
}

/**
 * Normalized Power from the watts stream (Strava check 21.10.2026: Strava's weighted_average_watts was 147 where
 * the ride's NP is about 168): the watts per second while moving (stops left out), the 30-second rolling average,
 * the 4th-power mean of it, its 4th root. null without 30 seconds of power.
 */
export function npOf(time, watts, moving = null) {
  if (!Array.isArray(time) || !Array.isArray(watts) || watts.length < 2) return null;
  const sec = [];
  for (let i = 0; i < watts.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    if (!(dt > 0 && dt <= 30)) continue;
    if (Array.isArray(moving) && moving[i] === false) continue;
    const w = Math.max(0, Number(watts[i]) || 0);
    for (let k = 0; k < dt; k++) sec.push(w);
  }
  if (sec.length < 30) return null;
  let sum = 0;
  let s4 = 0;
  for (let i = 0; i < sec.length; i++) {
    sum += sec[i];
    if (i >= 30) sum -= sec[i - 30];
    if (i >= 29) s4 += (sum / 30) ** 4;
  }
  const v = Math.round((s4 / (sec.length - 29)) ** 0.25);
  return v > 0 ? v : null;
}

/** The highest average over `span` seconds, or null when the ride is shorter. */
function bestOver(sec, span) {
  if (sec.length < span) return null;
  let sum = 0;
  for (let i = 0; i < span; i++) sum += sec[i];
  let best = sum;
  for (let i = span; i < sec.length; i++) {
    sum += sec[i] - sec[i - span];
    if (sum > best) best = sum;
  }
  return Math.round(best / span);
}

/**
 * The best 20 minutes of power in watts: the highest average over 1200 moving seconds (a gap of more
 * than 30 s is a pause and does not count). null when the ride has no power stream or is shorter.
 */
export function best20(time, watts, span = 1200) {
  return bestOver(powerSeconds(time, watts), span);
}

/** The power curve: the best average for each of these spans in seconds (null when too short). */
// Tour-Auswertung (Noah 20.10.2026 «3a und b»): 2 and 10 minutes too, as on the Garmin
// Strava-Analyse 1:1 (Noah 20.10.2026): Peak Power 5 s … 1 h and the curve from 1 s to 6 h
export const POWER_SPANS = [1, 5, 15, 30, 60, 120, 300, 600, 1200, 1800, 2700, 3600, 5400, 7200, 10800, 14400, 21600];
/** The spans of the heart rate curve in seconds: the best average heart rate over 1, 2, 5, 10 and 20 minutes. */
export const HR_SPANS = [60, 120, 300, 600, 1200];

/** The heart rate curve: the highest average heart rate for each of HR_SPANS (null when too short), or null without heart rate. */
export function trimHrCurve(time, hr) {
  if (!Array.isArray(time) || !Array.isArray(hr) || hr.length < 2) return null;
  const sec = [];
  for (let i = 0; i < hr.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    const b = Number(hr[i]);
    if (!(dt > 0 && dt <= 30) || !(b > 0)) continue;
    for (let k = 0; k < dt; k++) sec.push(b);
  }
  if (!sec.length) return null;
  return HR_SPANS.map((span) => [span, bestOver(sec, span)]);
}
export const POWER_BIN = 10;

/** Power, reduced: seconds per 10 W (for the power zones, so a new FTP needs no new call) and the curve. */
export function trimPower(time, watts) {
  const sec = powerSeconds(time, watts);
  if (!sec.length) return { pHist: null, p25: null, pCurve: null };
  const pHist = {};
  for (const w of sec) {
    const b = Math.floor(w / POWER_BIN) * POWER_BIN;
    pHist[b] = (pHist[b] ?? 0) + 1;
  }
  // the 25 W distribution of the Strava analysis: seconds per 25 W
  const p25 = {};
  for (const w of sec) {
    const b = Math.floor(w / 25) * 25;
    p25[b] = (p25[b] ?? 0) + 1;
  }
  return { pHist, p25, pCurve: POWER_SPANS.map((span) => [span, bestOver(sec, span)]) };
}

/** The minutes from which a stop is listed with its place (the Zeitleiste of the Rückblick: «jede Pause ≥5 min»). */
export const PAUSE_LIST_S = 300;
const PAUSE_LIST_MAX = 40;
/** The km at index i of Strava's distance stream (metres), or null. */
const kmAt = (dist, i) => (Array.isArray(dist) && Number.isFinite(Number(dist[i])) ? Math.round(Number(dist[i]) / 100) / 10 : null);
/** The clock time 'HH:MM' of a local start ('2026-10-07T08:05:00Z' as Strava sends start_date_local) plus s seconds. */
export function clockAfter(startLocal, s) {
  const m = /T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(startLocal ?? ''));
  if (!m || !Number.isFinite(s)) return null;
  const v = (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0) + Math.round(s)) % 86400;
  return `${String(Math.floor(v / 3600)).padStart(2, '0')}:${String(Math.floor((v % 3600) / 60)).padStart(2, '0')}`;
}

/**
 * Breaks: stops of at least `min` seconds (Strava's moving flag false, or no data for more than 30 s).
 * { n, secs, list }: list = the stops of 5 minutes and more with where they were (Zeitleiste):
 * { t: seconds after the start, at: 'HH:MM' (with startLocal), km (with Strava's distance stream), min }.
 */
export function pausesOf(time, moving, min = 60, dist = null, startLocal = null) {
  if (!Array.isArray(time) || time.length < 2) return null;
  const stops = [];
  let run = 0;
  let from = 0;
  for (let i = 0; i < time.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    if (!(dt > 0)) continue;
    const still = dt > 30 || (Array.isArray(moving) && moving[i] === false);
    if (still) {
      if (!run) from = i;
      run += dt;
    } else if (run) (stops.push([run, from]), (run = 0));
  }
  if (run) stops.push([run, from]);
  const long = stops.filter(([x]) => x >= min);
  const list = long
    .filter(([x]) => x >= PAUSE_LIST_S)
    .slice(0, PAUSE_LIST_MAX)
    .map(([x, i]) => {
      const t = Math.round(Number(time[i]) - Number(time[0]));
      return { t, at: clockAfter(startLocal, t), km: kmAt(dist, i), min: Math.round(x / 60) };
    });
  return { n: long.length, secs: long.reduce((a, [b]) => a + b, 0), list };
}

/** The kind of detail this server sends (the app's DETAIL_V): 4 = with 2/10 min power and the heart rate curve; 5 = with the NP from the watts stream; 6 = pauses, segments and climbs with their place, and the photos. */
export const DETAIL_KIND = 6;

const SEG_MAX = 40;
/**
 * Where an effort starts (Zeitleiste of the Rückblick): { from: km, t: seconds after the start, at: 'HH:MM' } from its start_index in Strava's
 * distance and time streams; nothing when the streams are missing.
 */
export function placeOf(e, where = {}) {
  const i = Number(e?.start_index);
  if (!Number.isInteger(i) || i < 0) return {};
  const out = {};
  const km = kmAt(where.dist, i);
  if (km != null) out.from = km;
  const time = where.time;
  if (Array.isArray(time) && Number.isFinite(Number(time[i]))) {
    out.t = Math.round(Number(time[i]) - Number(time[0]));
    const at = clockAfter(where.startLocal, out.t);
    if (at) out.at = at;
  }
  return out;
}

/** Own segment times and best efforts (runs); personal records (rank 1–3) first. No route, no leaderboards. */
export function trimEfforts(list, where = {}) {
  if (!Array.isArray(list)) return [];
  return list
    .map((e) => ({ name: String(e?.name ?? '').slice(0, 120), s: Math.round(Number(e?.moving_time) || Number(e?.elapsed_time) || 0), pr: [1, 2, 3].includes(e?.pr_rank) ? e.pr_rank : null, ...placeOf(e, where) }))
    .filter((e) => e.name && e.s > 0)
    .sort((a, b) => (a.pr ?? 9) - (b.pr ?? 9))
    .slice(0, SEG_MAX);
}

const PHOTO_MAX = 20;
/**
 * The photos of a ride (Zeitleiste of the Rückblick, Noah 21.10.2026 «die Strava-Fotos an ihrer Stelle»): the
 * address of Strava's picture, the caption, and where it was taken along the ride, from the time it was taken
 * (seconds after the start → km in the distance stream). Only https pictures; no position is kept.
 * where: { time, dist, startLocal, start } (start = Strava's start_date, UTC).
 */
export function trimPhotos(list, where = {}) {
  if (!Array.isArray(list)) return [];
  const t0 = Date.parse(where.start ?? '');
  const time = Array.isArray(where.time) ? where.time.map(Number) : null;
  return list
    .map((p) => {
      const urls = p?.urls && typeof p.urls === 'object' ? p.urls : {};
      const url = Object.entries(urls)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([, u]) => u)
        .find((u) => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u));
      if (!url) return null;
      const taken = Date.parse(p?.created_at ?? '');
      const t = Number.isFinite(taken) && Number.isFinite(t0) ? Math.round((taken - t0) / 1000) : null;
      const out = { url: url.slice(0, 1000), caption: typeof p?.caption === 'string' ? p.caption.trim().slice(0, 300) : '' };
      if (t != null && t >= 0) {
        out.t = t;
        out.at = clockAfter(where.startLocal, t);
        if (time && time.length) {
          let i = time.findIndex((x) => x - time[0] >= t);
          if (i < 0) i = time.length - 1;
          const km = kmAt(where.dist, i);
          if (km != null) out.km = km;
        }
      }
      return out;
    })
    .filter(Boolean)
    .slice(0, PHOTO_MAX);
}

export function trimStreams(streams, startLocal = null) {
  const time = streams?.time?.data;
  const hr = streams?.heartrate?.data;
  const w20 = best20(time, streams?.watts?.data);
  const more = { ...trimPower(time, streams?.watts?.data), np: npOf(time, streams?.watts?.data, streams?.moving?.data), cadMax: maxOf(streams?.cadence?.data), pauses: pausesOf(time, streams?.moving?.data, 60, streams?.distance?.data, startLocal), hCurve: trimHrCurve(time, hr) };
  if (!Array.isArray(time) || !Array.isArray(hr) || hr.length < 2) return { hist: null, curve: [], w20, ...more };
  const hist = {};
  for (let i = 0; i < hr.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    const b = Math.round(Number(hr[i]));
    if (!(dt > 0 && dt <= 30) || !(b > 0)) continue; // a pause: not counted
    hist[b] = (hist[b] ?? 0) + dt;
  }
  const n = Math.min(CURVE_POINTS, hr.length);
  const curve = [];
  for (let k = 0; k < n; k++) {
    const a = Math.floor((k * hr.length) / n);
    const e = Math.max(a + 1, Math.floor(((k + 1) * hr.length) / n));
    let sum = 0;
    let c = 0;
    for (let i = a; i < e; i++) if (Number(hr[i]) > 0) (sum += Number(hr[i])), c++;
    if (c) curve.push([Math.round(Number(time[a]) / 6) / 10, Math.round(sum / c)]);
  }
  return { hist, curve, w20, ...more };
}

/*
 * TR5b–TR7f (Noah 14.10.2026 «TR5–TR7 freigegeben»): more from the same streams, still nothing about
 * the route (no position): the cadence spread, a row per 5 km, the course of elevation, heart rate and
 * power, heart rate by power, the two halves. Each a few hundred numbers at most.
 */
export const SECTION_KM = 5;
const PROF_POINTS = 120;
const avg = (sum, n) => (n ? Math.round(sum / n) : null);

/** The moving seconds as [i, dt] (a gap of more than 30 s or Strava's moving false is a pause). */
function movingSteps(time, moving) {
  const out = [];
  for (let i = 0; i < time.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    if (!(dt > 0 && dt <= 30) || (Array.isArray(moving) && moving[i] === false)) continue;
    out.push([i, dt]);
  }
  return out;
}

export function trimMore(streams) {
  const time = streams?.time?.data;
  const none = { cHist: null, secs5: null, prof: null, hw: null, halves: null };
  if (!Array.isArray(time) || time.length < 2) return none;
  const arr = (k) => (Array.isArray(streams?.[k]?.data) && streams[k].data.length === time.length ? streams[k].data : null);
  const hr = arr('heartrate');
  const w = arr('watts');
  const cad = arr('cadence');
  const dist = arr('distance');
  const alt = arr('altitude');
  const steps = movingSteps(time, arr('moving'));
  if (!steps.length) return none;
  const num = (a, i) => (a && Number(a[i]) > 0 ? Number(a[i]) : null);

  // cadence: moving seconds per 10 rpm (coasting, 0, does not count)
  let cHist = null;
  if (cad) {
    cHist = {};
    for (const [i, dt] of steps) {
      const c = num(cad, i);
      if (c) cHist[Math.floor(c / 10) * 10] = (cHist[Math.floor(c / 10) * 10] ?? 0) + dt;
    }
    if (!Object.keys(cHist).length) cHist = null;
  }

  // climbing with 2 m of slack, so the noise of the altimeter does not add up
  const climbed = new Array(time.length).fill(0);
  if (alt) {
    let low = Number(alt[0]);
    let sum = 0;
    for (let i = 1; i < alt.length; i++) {
      const a = Number(alt[i]);
      if (a < low) low = a;
      else if (a - low >= 2) (sum += a - low), (low = a);
      climbed[i] = sum;
    }
  }

  // one row per 5 km: moving seconds, metres climbed, Ø heart rate, Ø watts
  let secs5 = null;
  if (dist) {
    secs5 = [];
    let row = null;
    for (const [i, dt] of steps) {
      const k = Math.floor((Number(dist[i]) || 0) / (SECTION_KM * 1000));
      if (!row || row.k !== k) {
        if (row) secs5.push(row);
        row = { k, s: 0, hmFrom: climbed[i], hmTo: climbed[i], hr: 0, nh: 0, w: 0, nw: 0, to: 0 };
      }
      row.s += dt;
      row.hmTo = climbed[i + 1] ?? climbed[i];
      row.to = Number(dist[i + 1]) || row.to;
      const h = num(hr, i);
      if (h) (row.hr += h * dt), (row.nh += dt);
      if (w) (row.w += Math.max(0, Number(w[i]) || 0) * dt), (row.nw += dt);
    }
    if (row) secs5.push(row);
    secs5 = secs5.map((r) => ({ from: r.k * SECTION_KM, to: Math.round(Math.max(r.to / 1000, r.k * SECTION_KM) * 10) / 10, s: r.s, hm: Math.round(r.hmTo - r.hmFrom), hr: avg(r.hr, r.nh), w: avg(r.w, r.nw) }));
    if (!secs5.length) secs5 = null;
  }

  // the course: up to 120 points [minute, metres, beats, watts] (null where there is none), the breaks as [from, to] minutes
  const n = Math.min(PROF_POINTS, time.length);
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = Math.floor((k * time.length) / n);
    const e = Math.max(a + 1, Math.floor(((k + 1) * time.length) / n));
    let sa = 0, na = 0, sh = 0, nh = 0, sw = 0, nw = 0;
    for (let i = a; i < e; i++) {
      if (alt && Number.isFinite(Number(alt[i]))) (sa += Number(alt[i])), na++;
      const h = num(hr, i);
      if (h) (sh += h), nh++;
      if (w) (sw += Math.max(0, Number(w[i]) || 0)), nw++;
    }
    pts.push([Math.round(Number(time[a]) / 6) / 10, avg(sa, na), avg(sh, nh), avg(sw, nw)]);
  }
  const breaks = [];
  for (let i = 0; i < time.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    if (dt >= 60) breaks.push([Math.round(Number(time[i]) / 6) / 10, Math.round(Number(time[i + 1]) / 6) / 10]);
  }
  const prof = { pts, breaks: breaks.slice(0, 20) };

  // heart rate by power: seconds per 5 beats × 20 W (the zones are drawn from it on the device)
  let hw = null;
  if (hr && w) {
    hw = {};
    for (const [i, dt] of steps) {
      const h = num(hr, i);
      if (!h) continue;
      const key = `${Math.floor(h / 5) * 5}|${Math.floor(Math.max(0, Number(w[i]) || 0) / 20) * 20}`;
      hw[key] = (hw[key] ?? 0) + dt;
    }
    if (!Object.keys(hw).length) hw = null;
  }

  // the two halves of the moving time: seconds, Ø watts, Ø heart rate
  const total = steps.reduce((s, [, dt]) => s + dt, 0);
  const halves = [0, 1].map(() => ({ s: 0, w: 0, nw: 0, hr: 0, nh: 0 }));
  let run = 0;
  for (const [i, dt] of steps) {
    const half = halves[run < total / 2 ? 0 : 1];
    run += dt;
    half.s += dt;
    const h = num(hr, i);
    if (h) (half.hr += h * dt), (half.nh += dt);
    if (w) (half.w += Math.max(0, Number(w[i]) || 0) * dt), (half.nw += dt);
  }
  const hv = halves.map((h) => ({ s: h.s, w: avg(h.w, h.nw), hr: avg(h.hr, h.nh) }));

  return { cHist, secs5, prof, hw, halves: hv[0].s && hv[1].s ? hv : null };
}

/** The climbs of a ride (TR7f): the own segment efforts with more than 3 % and at least 30 m up. VAM = metres per hour. */
export function trimClimbs(list, where = {}) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list
    .map((e) => {
      const g = e?.segment ?? {};
      const km = (Number(g.distance) || Number(e?.distance) || 0) / 1000;
      const hm = Number(g.elevation_high) - Number(g.elevation_low);
      const s = Math.round(Number(e?.moving_time) || Number(e?.elapsed_time) || 0);
      return {
        name: String(e?.name ?? '').slice(0, 120),
        km: Math.round(km * 10) / 10,
        grade: Math.round((Number(g.average_grade) || 0) * 10) / 10,
        hm: Number.isFinite(hm) ? Math.round(hm) : 0,
        s,
        w: Number(e?.average_watts) > 0 && e?.device_watts !== false ? Math.round(Number(e.average_watts)) : null,
        hr: Number(e?.average_heartrate) > 0 ? Math.round(Number(e.average_heartrate)) : null,
        ...placeOf(e, where),
      };
    })
    .filter((c) => c.name && c.s > 0 && c.grade > 3 && c.hm >= 30 && !seen.has(c.name) && seen.add(c.name))
    .map((c) => ({ ...c, vam: Math.round(c.hm / (c.s / 3600)) }))
    .slice(0, 12);
}

export function trimBike(b) {
  return { id: String(b.id), name: b.name ?? '', km: Math.round((Number(b.distance) || 0) / 1000), primary: !!b.primary, retired: !!b.retired };
}

export function makeHandler({ env = () => stravaEnv(), doFetch = (...a) => fetch(...a), now = () => Date.now() } = {}) {
  const setUp = (cfg) => {
    if (!cfg.clientId || !cfg.clientSecret) throw new ApiError(503, 'not_set_up', 'Strava is not set up on the server (STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET).');
  };

  async function tokenCall(cfg, params) {
    let res;
    try {
      res = await doFetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...params }) });
    } catch {
      throw new ApiError(502, 'strava_unreachable', 'Strava could not be reached.');
    }
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.access_token) {
      if (res.status === 400 || res.status === 401) throw new ApiError(401, 'strava_login_needed', 'Strava needs a new login.');
      throw new ApiError(502, 'strava_error', 'Strava answered with an error.');
    }
    return body;
  }

  /** A valid access token, refreshed when it ends within a minute. */
  async function accessToken(cfg, store, tokKey = OWNER_TOKENS) {
    const raw = await store.get(tokKey);
    if (!raw) throw new ApiError(409, 'not_connected', 'Strava is not connected.');
    const t = JSON.parse(raw);
    if ((t.expires_at ?? 0) * 1000 - 60_000 > now()) return t.access_token;
    const fresh = await tokenCall(cfg, { grant_type: 'refresh_token', refresh_token: t.refresh_token });
    await store.set(tokKey, JSON.stringify({ access_token: fresh.access_token, refresh_token: fresh.refresh_token ?? t.refresh_token, expires_at: fresh.expires_at, scope: t.scope }));
    return fresh.access_token;
  }

  async function stravaGet(cfg, store, path, ctx = {}) {
    const token = await accessToken(cfg, store, ctx.tokKey ?? OWNER_TOKENS);
    let res;
    try {
      res = await doFetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      throw new ApiError(502, 'strava_unreachable', 'Strava could not be reached.');
    }
    const rate = rateOf(res.headers);
    if (rate) ctx.rate = rate;
    if (res.status === 429) throw new ApiError(429, 'strava_busy', 'Strava allows only a few requests per 15 minutes. Try again later.', rate ? { rate } : null);
    if (res.status === 401) throw new ApiError(401, 'strava_login_needed', 'Strava needs a new login.');
    if (!res.ok) throw new ApiError(502, 'strava_error', 'Strava answered with an error.');
    return res.json();
  }

  const int = (v, min, max) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  };

  return route(
    {
      GET: async (request) => {
        const url = new URL(request.url);
        const step = url.searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);

        if (step === 'callback') {
          setUp(cfg);
          const st = await takeState(store, 'strava', url.searchParams.get('state'));
          if (!st) return backToApp(null, { strava: 'error', error: 'expired' });
          if (url.searchParams.get('error') || !url.searchParams.get('code')) return backToApp(st.returnTo, { strava: 'error', error: 'denied' });
          const granted = (url.searchParams.get('scope') ?? '').split(',');
          if (!granted.includes('activity:read_all') && !granted.includes('activity:read')) return backToApp(st.returnTo, { strava: 'error', error: 'scope' });
          const tok = await tokenCall(cfg, { grant_type: 'authorization_code', code: url.searchParams.get('code') });
          const athlete = String(tok.athlete?.id ?? '');
          const owner = cfg.allowedAthlete || (await store.get('strava:athlete'));
          const saved = JSON.stringify({ access_token: tok.access_token, refresh_token: tok.refresh_token, expires_at: tok.expires_at, scope: granted.join(',') });
          const listed = (cfg.athletes ?? []).includes(athlete) || Number(await store.cmd('SISMEMBER', FRIENDS, athlete)) === 1;
          // an invite counts once: it goes when a friend uses it
          const invited = !listed && athlete && owner && owner !== athlete && goodInvite(st.invite) && !!(await store.cmd('GETDEL', inviteKey(st.invite)));
          if (athlete && owner && owner !== athlete && (listed || invited)) {
            // a friend with their own Strava: own tokens, a device key that opens only their Strava
            if (invited) await store.cmd('SADD', FRIENDS, athlete);
            if (invited || !(await store.get(friendInfo(athlete)))) await store.set(friendInfo(athlete), JSON.stringify({ name: String(tok.athlete?.firstname ?? '').slice(0, 40), since: new Date(now()).toISOString().slice(0, 10) }));
            await store.set(friendTokens(athlete), saved);
            const key = randomKey();
            await store.set(friendDevice(hash(key)), athlete);
            await store.cmd('SADD', friendDevices(athlete), hash(key));
            return backToApp(st.returnTo, { strava: 'connected', key });
          }
          if (st.invite && athlete && owner && owner !== athlete) return backToApp(st.returnTo, { strava: 'error', error: 'invite_gone' });
          if (!athlete || (owner && owner !== athlete)) return backToApp(st.returnTo, { strava: 'error', error: 'other_athlete' });
          if (!owner) await store.set('strava:athlete', athlete);
          await store.set(OWNER_TOKENS, saved);
          const key = await newDevice(store);
          return backToApp(st.returnTo, { strava: 'connected', key });
        }

        if (step === 'friends') {
          await needDevice(request, store);
          const ids = [...new Set([...(cfg.athletes ?? []), ...(((await store.cmd('SMEMBERS', FRIENDS)) ?? []).map(String))])].filter((x) => /^\d{1,20}$/.test(x));
          const friends = [];
          for (const id of ids) {
            const info = JSON.parse((await store.get(friendInfo(id))) || '{}');
            friends.push({ id, name: typeof info.name === 'string' ? info.name : '', since: typeof info.since === 'string' ? info.since : null, connected: !!(await store.get(friendTokens(id))), inVercel: (cfg.athletes ?? []).includes(id) });
          }
          return json(request, 200, { ok: true, friends });
        }

        const tokKey = await whoseTokens(request, store);
        setUp(cfg);
        const ctx = { tokKey };
        const withRate = (body) => (ctx.rate ? { ...body, rate: ctx.rate } : body);
        if (step === 'status') {
          const raw = await store.get(tokKey);
          if (!raw) return json(request, 200, { ok: true, connected: false });
          const me = await stravaGet(cfg, store, '/athlete', ctx);
          return json(request, 200, withRate({ ok: true, connected: true, athlete: { firstname: me.firstname ?? '' }, scope: JSON.parse(raw).scope ?? '' }));
        }
        if (step === 'gear') {
          const me = await stravaGet(cfg, store, '/athlete', ctx);
          return json(request, 200, withRate({ ok: true, bikes: (me.bikes ?? []).map(trimBike), ftp: Number(me.ftp) > 0 ? Math.round(Number(me.ftp)) : null }));
        }
        if (step === 'activities') {
          const p = url.searchParams;
          const page = int(p.get('page') ?? '1', 1, 500);
          const after = p.has('after') ? int(p.get('after'), 0, 4e9) : null;
          const before = p.has('before') ? int(p.get('before'), 0, 4e9) : null;
          if (page == null || (p.has('after') && after == null) || (p.has('before') && before == null)) throw new ApiError(400, 'bad_request', 'page, after and before must be whole numbers (after/before in Unix seconds).');
          const q = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
          if (after != null) q.set('after', String(after));
          if (before != null) q.set('before', String(before));
          const list = await stravaGet(cfg, store, `/athlete/activities?${q}`, ctx);
          const arr = Array.isArray(list) ? list : [];
          return json(request, 200, withRate({ ok: true, page, more: arr.length === PER_PAGE, activities: arr.map(trimActivity) }));
        }
        if (step === 'zones') {
          return json(request, 200, { ok: true, ...trimZones(await stravaGet(cfg, store, '/athlete/zones', { tokKey })) });
        }
        if (step === 'detail') {
          const id = url.searchParams.get('id') ?? '';
          if (!/^\d{1,20}$/.test(id)) throw new ApiError(400, 'bad_request', 'id must be an activity number.');
          const one = await stravaGet(cfg, store, `/activities/${id}?include_all_efforts=true`, { tokKey });
          // the streams for the breaks too (moving), so every activity; still two calls in all
          // distance, altitude and cadence too (TR5b–TR7f), still no position
          const streams = await stravaGet(cfg, store, `/activities/${id}/streams?keys=time,heartrate,watts,moving,cadence,distance,altitude,temp&key_by_type=true`, { tokKey });
          // power only from a power meter (Strava's estimate has no stream worth a best effort)
          const pm = !!one.device_watts;
          const where = { time: streams?.time?.data, dist: streams?.distance?.data, startLocal: one.start_date_local, start: one.start_date };
          const s = { ...trimStreams(streams, one.start_date_local), ...trimMore(pm ? streams : { ...streams, watts: null }) };
          // the photos only when the ride has some (one more call then)
          let photos = [];
          if (Number(one.total_photo_count) > 0) {
            try {
              photos = trimPhotos(await stravaGet(cfg, store, `/activities/${id}/photos?size=1024&photo_sources=true`, { tokKey }), where);
            } catch {
              photos = [];
            }
          }
          return json(request, 200, { ok: true, id, kcal: Number(one.calories) > 0 ? Math.round(Number(one.calories)) : null, desc: typeof one.description === 'string' ? one.description.trim().slice(0, 2000) : '', ...s, w20: pm ? s.w20 : null, pHist: pm ? s.pHist : null, p25: pm ? s.p25 : null, pCurve: pm ? s.pCurve : null, np: pm ? s.np : null, segs: trimEfforts(one.segment_efforts, where), best: trimEfforts(one.best_efforts, where), climbs: trimClimbs(one.segment_efforts, where), photos, ...trimExtra(streams), laps: trimLaps(one.laps, pm), splits: trimSplits(one.splits_metric), rpe: rpeOf(one), ...trimCourse(pm ? streams : { ...streams, watts: null }), dv: DETAIL_KIND });
        }
        if (step === 'line') {
          // Paket S «Reise-Spur»: one activity's line; Strava's finer line (map.polyline), else the short one
          const id = url.searchParams.get('id') ?? '';
          if (!/^\d{1,20}$/.test(id)) throw new ApiError(400, 'bad_request', 'id must be an activity number.');
          const one = await stravaGet(cfg, store, `/activities/${id}`, ctx);
          const line = [one?.map?.polyline, one?.map?.summary_polyline].find((x) => typeof x === 'string' && x) ?? null;
          return json(request, 200, withRate({ ok: true, id, line: line ? line.slice(0, 200_000) : null }));
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },

      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);
        if (step === 'start') {
          setUp(cfg);
          const body = await jsonBody(request);
          const state = await saveState(store, 'strava', { returnTo: typeof body.returnTo === 'string' ? body.returnTo.slice(0, 500) : null, ...(goodInvite(body.invite) ? { invite: body.invite } : {}) });
          const q = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: CALLBACK, response_type: 'code', approval_prompt: 'auto', scope: SCOPE, state });
          return json(request, 200, { ok: true, url: `${AUTHORIZE_URL}?${q}` });
        }
        if (step === 'invite') {
          // only the owner's devices (app:keys) invite; a friend's key is not in that set
          await needDevice(request, store);
          const code = randomKey(15);
          await store.set(inviteKey(code), JSON.stringify({ at: now() }), INVITE_DAYS * 86400);
          return json(request, 200, { ok: true, code, until: new Date(now() + INVITE_DAYS * 86400_000).toISOString() });
        }
        if (step === 'friend-remove') {
          await needDevice(request, store);
          const body = await jsonBody(request);
          const id = String(body.id ?? '');
          if (!/^\d{1,20}$/.test(id)) throw new ApiError(400, 'bad_request', 'Bad id.');
          if (await store.get(friendTokens(id))) {
            try {
              const token = await accessToken(cfg, store, friendTokens(id));
              await doFetch(DEAUTH_URL, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            } catch {
              // Strava unreachable or already withdrawn: the server forgets everything anyway.
            }
          }
          for (const h of (await store.cmd('SMEMBERS', friendDevices(id))) ?? []) await store.del(friendDevice(h));
          for (const k of [friendDevices(id), friendTokens(id), friendInfo(id), `google:tokens:${id}`, `google:tokens:health:${id}`]) await store.del(k);
          await store.cmd('SREM', FRIENDS, id);
          // a friend in STRAVA_ATHLETES (Vercel) may connect again until Noah takes them out there
          return json(request, 200, { ok: true, inVercel: (cfg.athletes ?? []).includes(id) });
        }
        if (step === 'disconnect') {
          const tokKey = await whoseTokens(request, store);
          const raw = await store.get(tokKey);
          if (raw) {
            try {
              const token = await accessToken(cfg, store, tokKey);
              await doFetch(DEAUTH_URL, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            } catch {
              // Strava unreachable or already withdrawn: the server forgets everything anyway.
            }
          }
          // Device keys stay: they also open Google; a new Strava login reconnects.
          await store.del(tokKey);
          // a friend's device key opens nothing else: it goes with the Strava access
          if (tokKey !== OWNER_TOKENS) {
            await store.del(friendDevice(hash(bearer(request))));
            await store.cmd('SREM', friendDevices(tokKey.split(':').pop()), hash(bearer(request)));
          }
          return json(request, 200, { ok: true });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'strava',
  );
}

const handler = makeHandler();
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
