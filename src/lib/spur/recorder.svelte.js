/**
 * Paket S «Reise-Spur» (Noah 19.10.2026 «1b»): the app records the route itself, but only while the
 * screen is on. A web app cannot record with the screen off; so the screen stays on (Wake Lock), a
 * point is kept every 30 s or 50 m (spur.js keepFix) and stored on this device (table tracks, kind
 * 'rec'). Screen off or app closed → a gap; a Strava/Garmin ride of that day fills it later by itself
 * (spur.js tourSpur: the Strava line wins).
 *
 * One recording at a time. It survives a reload: the open recording stays in the table (open: true)
 * and «Continue» picks it up (the time between is a gap).
 */
import { db as appDb } from '../db.js';
import { localDay } from '../localday.js';
import { keepFix, zurichDay } from './spur.js';
import { distKm } from './polyline.js';
import { hold } from '../holdreload.js';
import { keepSample } from '../live/ble.js';
import { setWhy, addBreak } from '../tourenc/pausewhy.js';

export const rec = $state({ on: false, id: null, tripId: null, startAt: 0, pts: 0, km: 0, acc: null, lastAt: 0, error: '', lock: false, here: null, paused: false, auto: false, breaks: [], laps: [], whys: {} });

let watch = null;
let lock = null;
let last = null;
let row = null;
let saving = Promise.resolve();
let onVis = null;
let release = null; // no automatic reload while recording (holdreload.js)
let jump = false; // after a pause: the way from the last point to the first new one is not counted

/*
 * Pausieren (Noah 20.10.2026 «Hinweis … dass man die Tour pausieren kann … dass die Zeit dann auch steht»):
 * while paused no point is kept and the riding time stands. The pauses are kept with the recording
 * (row.breaks: [[fromMs, toMs]], the last one open while paused), so they survive a reload and
 * pauses() in live-lib.js leaves them out of the riding time. auto: paused by the auto-pause (speed).
 */
const saveRow = (db) => {
  if (!row) return saving;
  const sensors = row.sensors ? Object.fromEntries(Object.entries(row.sensors).map(([k, v]) => [k, v.slice()])) : undefined;
  const snap = { ...row, pts: row.pts.slice(), breaks: (row.breaks ?? []).map((b) => b.slice()), ...(row.laps ? { laps: row.laps.map((x) => ({ ...x })) } : {}), ...(sensors ? { sensors } : {}) };
  saving = saving.then(() => db.tracks.put(snap)).catch(() => {});
  return saving;
};

/**
 * A sensor value (live/sensors.svelte.js: hr, power, cadence) for the running recording: kept every 5 s
 * as row.sensors[kind] = [[sec, value]], stored with the next point. Not while paused.
 */
export function addSensor(kind, value, at = Date.now()) {
  if (!rec.on || !row || rec.paused) return false;
  row.sensors ??= {};
  const list = (row.sensors[kind] ??= []);
  const n = list.length;
  keepSample(list, (at - row.startAt) / 1000, value);
  return list.length > n;
}

/**
 * A new lap (Noah 20.10.2026 «Runden-Taste»): where it starts, kept as row.laps = [{ at, km, movingS }].
 * movingS: the riding time now (the live map knows it).
 */
export async function lapRecording({ db = appDb, now = Date.now(), movingS = 0 } = {}) {
  if (!rec.on || !row) return false;
  row.laps = [...(row.laps ?? []), { at: now, km: rec.km, movingS: Math.round(movingS) }];
  rec.laps = row.laps.map((x) => ({ ...x }));
  await saveRow(db);
  return true;
}

/** Pause the running recording (auto: by the auto-pause). */
export async function pauseRecording({ db = appDb, now = Date.now(), auto = false } = {}) {
  if (!rec.on || !row || rec.paused) return false;
  row.breaks = [...(row.breaks ?? []), [now, null]];
  rec.paused = true;
  rec.auto = auto;
  rec.breaks = row.breaks.map((x) => x.slice());
  await saveRow(db);
  return true;
}

/**
 * Touren c 60 «Pausengrund»: the reason of a pause (rest, repair, waiting), kept as row.whys by the pause's
 * start. fromMs: the start of that pause (default: the open or last one).
 */
export async function setPauseWhy(why, { db = appDb, fromMs = null } = {}) {
  if (!rec.on || !row) return false;
  const from = fromMs ?? row.breaks?.at(-1)?.[0];
  if (from == null) return false;
  row.whys = setWhy(row.whys, from, why);
  rec.whys = { ...row.whys };
  await saveRow(db);
  return true;
}

/** Touren c 61 «Vergessene Pause»: a long standing time put in afterwards as a pause, with its reason. */
export async function addPastPause(from, to, why, { db = appDb } = {}) {
  if (!rec.on || !row) return false;
  const next = addBreak(row.breaks, from, to);
  if (next.length === (row.breaks ?? []).length) return false;
  const added = next.find((b) => !(row.breaks ?? []).some((x) => x[0] === b[0]));
  row.breaks = next;
  if (added) row.whys = setWhy(row.whys, added[0], why);
  rec.breaks = row.breaks.map((x) => x.slice());
  rec.whys = { ...(row.whys ?? {}) };
  await saveRow(db);
  return true;
}

/** Go on after a pause. */
export async function resumeRecording({ db = appDb, now = Date.now() } = {}) {
  if (!rec.on || !row || !rec.paused) return false;
  const b = row.breaks?.at(-1);
  if (b && b[1] == null) b[1] = Math.max(b[0], now);
  rec.paused = false;
  rec.auto = false;
  rec.breaks = (row.breaks ?? []).map((x) => x.slice());
  jump = true;
  await saveRow(db);
  return true;
}

const r6 = (v) => Math.round(v * 1e6) / 1e6;

async function getLock() {
  try {
    lock = (await navigator.wakeLock?.request('screen')) ?? null;
    rec.lock = !!lock;
    lock?.addEventListener?.('release', () => (rec.lock = false));
  } catch {
    rec.lock = false;
  }
}

/** The open recording of this device, if one was left running (reload, app closed). */
export async function openRecording(db = appDb) {
  const rows = await db.tracks.where('kind').equals('rec').toArray();
  return rows.find((r) => r.open) ?? null;
}

/** Put a fix into the running recording (also used by tests with a fake position). */
export async function addFix(pos, db = appDb) {
  if (!rec.on || !row) return false;
  const fix = { lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy, at: pos.timestamp || Date.now() };
  rec.acc = Number.isFinite(fix.acc) ? Math.round(fix.acc) : null;
  rec.error = ''; // a fix came: the old «no GPS» line goes
  // Live-Karte (Paket U3): the latest position, every fix, so the live map reads the same GPS.
  rec.here = { lat: fix.lat, lon: fix.lon, acc: fix.acc ?? null, at: fix.at, speed: pos.coords.speed ?? null, alt: pos.coords.altitude ?? null };
  if (rec.paused) return false; // paused: the map still shows where you are, nothing is kept
  if (!keepFix(last, fix)) return false;
  const sec = Math.max(0, Math.round((fix.at - row.startAt) / 1000));
  const p = [r6(fix.lat), r6(fix.lon), sec];
  if (last && !jump) rec.km = Math.round((rec.km + distKm([last.lat, last.lon], [fix.lat, fix.lon])) * 100) / 100;
  jump = false;
  row.pts.push(p);
  row.endAt = fix.at;
  row.km = rec.km;
  last = fix;
  rec.pts = row.pts.length;
  rec.lastAt = fix.at;
  await saveRow(db);
  return true;
}

/**
 * Start (or continue) recording for a trip. Returns '' or an error key for t().
 * cont: an open recording to continue (openRecording()).
 */
export async function startRecording(trip, { db = appDb, cont = null, now = Date.now(), saver = false } = {}) {
  if (rec.on) return '';
  if (!navigator.geolocation) return 'This device cannot tell where it is.';
  rec.error = '';
  if (cont) {
    row = { ...cont, pts: cont.pts.slice(), breaks: (cont.breaks ?? []).map((b) => b.slice()), ...(cont.sensors ? { sensors: Object.fromEntries(Object.entries(cont.sensors).map(([k, v]) => [k, v.slice()])) } : {}), open: true };
    const lp = row.pts.at(-1);
    last = lp ? { lat: lp[0], lon: lp[1], at: row.startAt + lp[2] * 1000 } : null;
  } else {
    row = { id: `rec-${now}`, kind: 'rec', tripId: trip?.id ?? null, day: localDay(new Date(now)), startAt: now, endAt: now, pts: [], km: 0, open: true, createdAt: new Date(now).toISOString() };
    last = null;
  }
  jump = false;
  await db.tracks.put({ ...row, pts: row.pts.slice() });
  // a pause still open when the app closed: it goes on paused
  const paused = row.breaks?.at(-1)?.[1] === null;
  Object.assign(rec, { on: true, id: row.id, tripId: row.tripId, startAt: row.startAt, pts: row.pts.length, km: row.km ?? 0, acc: null, lastAt: row.endAt, paused, auto: false, breaks: (row.breaks ?? []).map((x) => x.slice()), laps: (row.laps ?? []).map((x) => ({ ...x })), whys: { ...(row.whys ?? {}) } });
  release = hold('recording');
  await getLock();
  onVis = () => document.visibilityState === 'visible' && rec.on && getLock();
  document.addEventListener('visibilitychange', onVis);
  watchDb = db;
  gpsSaver = saver;
  gpsLow = false;
  startWatch();
  return '';
}

let watchDb = appDb;
let gpsSaver = false;
let gpsLow = false;
// saver (Live-Karte battery saver) or low (paused / standing, Stromsparen 1a): no high accuracy, older fixes → less GPS
const gpsOptions = () => (gpsSaver || gpsLow ? { enableHighAccuracy: false, maximumAge: 30_000, timeout: 60_000 } : { enableHighAccuracy: true, maximumAge: 5000, timeout: 60_000 });
function startWatch() {
  if (watch != null) navigator.geolocation?.clearWatch(watch);
  watch = navigator.geolocation.watchPosition(
    (pos) => addFix(pos, watchDb),
    (err) => {
      rec.error = err?.code === 1 ? 'Location is not allowed. Allow it for this site in the browser settings.' : 'No GPS signal right now. Recording goes on as soon as there is one.';
    },
    gpsOptions(),
  );
}

/**
 * Stromsparen (Noah 20.10.2026 «1a»): while paused or standing the GPS asks less often and less exactly;
 * riding again → as before. The recording and the sensors go on all the time.
 */
export function setGpsLow(low) {
  if (!rec.on || !!low === gpsLow) return false;
  gpsLow = !!low;
  if (!gpsSaver) startWatch();
  return true;
}

/** Stop recording; the recording stays (closed). Returns it, or null when it had fewer than 2 points (then it goes). */
export async function stopRecording(db = appDb) {
  if (watch != null) navigator.geolocation?.clearWatch(watch);
  watch = null;
  gpsLow = false;
  try {
    await lock?.release?.();
  } catch {
    /* already released */
  }
  lock = null;
  if (onVis) document.removeEventListener('visibilitychange', onVis);
  onVis = null;
  release?.();
  release = null;
  await saving;
  const ob = row?.breaks?.at(-1);
  if (ob && ob[1] == null) ob[1] = Math.max(ob[0], Date.now());
  jump = false;
  const done = row ? { ...row, pts: row.pts.slice(), open: false, day: row.pts.length ? zurichDay(row.startAt + row.pts[0][2] * 1000) : row.day } : null;
  row = null;
  last = null;
  Object.assign(rec, { on: false, id: null, tripId: null, startAt: 0, pts: 0, km: 0, acc: null, lastAt: 0, lock: false, here: null, paused: false, auto: false, breaks: [], laps: [], whys: {} });
  if (!done) return null;
  if (done.pts.length < 2) {
    await db.tracks.delete(done.id);
    return null;
  }
  await db.tracks.put(done);
  return done;
}

/**
 * «Hier bin ich» (answer 1a): the place now, with an optional text and photo → the stored place.
 * pos: a position from the browser (getHere()).
 */
export async function savePlace(trip, pos, { text = '', photo = null, inputs = null, db = appDb, now = new Date() } = {}) {
  const p = { id: `place-${now.getTime()}`, kind: 'place', tripId: trip?.id ?? null, day: localDay(now), at: now.toISOString(), lat: r6(pos.lat), lon: r6(pos.lon), acc: pos.acc ?? null, text: String(text ?? '').trim().slice(0, 1000), photo: photo ?? null, ...(inputs ? { inputs } : {}) };
  await db.tracks.put(p);
  return p;
}

/** The place now from the browser: { lat, lon, acc } or throws an Error with a text key. */
export function getHere({ timeout = 20_000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('This device cannot tell where it is.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy ?? 0) }),
      (err) => reject(new Error(err?.code === 1 ? 'Location is not allowed. Allow it for this site in the browser settings.' : 'The place could not be found. Try again outside.')),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout },
    );
  });
}
