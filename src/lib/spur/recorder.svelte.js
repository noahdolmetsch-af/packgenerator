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

export const rec = $state({ on: false, id: null, tripId: null, startAt: 0, pts: 0, km: 0, acc: null, lastAt: 0, error: '', lock: false, here: null });

let watch = null;
let lock = null;
let last = null;
let row = null;
let saving = Promise.resolve();
let onVis = null;

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
  // Live-Karte (Paket U3): the latest position, every fix, so the live map reads the same GPS.
  rec.here = { lat: fix.lat, lon: fix.lon, acc: fix.acc ?? null, at: fix.at, speed: pos.coords.speed ?? null, alt: pos.coords.altitude ?? null };
  if (!keepFix(last, fix)) return false;
  const sec = Math.max(0, Math.round((fix.at - row.startAt) / 1000));
  const p = [r6(fix.lat), r6(fix.lon), sec];
  if (last) rec.km = Math.round((rec.km + distKm([last.lat, last.lon], [fix.lat, fix.lon])) * 100) / 100;
  row.pts.push(p);
  row.endAt = fix.at;
  row.km = rec.km;
  last = fix;
  rec.pts = row.pts.length;
  rec.lastAt = fix.at;
  const snap = { ...row, pts: row.pts.slice() };
  saving = saving.then(() => db.tracks.put(snap)).catch(() => {});
  await saving;
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
    row = { ...cont, pts: cont.pts.slice(), open: true };
    const lp = row.pts.at(-1);
    last = lp ? { lat: lp[0], lon: lp[1], at: row.startAt + lp[2] * 1000 } : null;
  } else {
    row = { id: `rec-${now}`, kind: 'rec', tripId: trip?.id ?? null, day: localDay(new Date(now)), startAt: now, endAt: now, pts: [], km: 0, open: true, createdAt: new Date(now).toISOString() };
    last = null;
  }
  await db.tracks.put({ ...row, pts: row.pts.slice() });
  Object.assign(rec, { on: true, id: row.id, tripId: row.tripId, startAt: row.startAt, pts: row.pts.length, km: row.km ?? 0, acc: null, lastAt: row.endAt });
  await getLock();
  onVis = () => document.visibilityState === 'visible' && rec.on && getLock();
  document.addEventListener('visibilitychange', onVis);
  watch = navigator.geolocation.watchPosition(
    (pos) => addFix(pos, db),
    (err) => {
      rec.error = err?.code === 1 ? 'Location is not allowed. Allow it for this site in the browser settings.' : 'No GPS signal right now. Recording goes on as soon as there is one.';
    },
    // saver (Live-Karte battery saver): no high accuracy, older fixes allowed → less GPS.
    saver ? { enableHighAccuracy: false, maximumAge: 30_000, timeout: 60_000 } : { enableHighAccuracy: true, maximumAge: 5000, timeout: 60_000 },
  );
  return '';
}

/** Stop recording; the recording stays (closed). Returns it, or null when it had fewer than 2 points (then it goes). */
export async function stopRecording(db = appDb) {
  if (watch != null) navigator.geolocation?.clearWatch(watch);
  watch = null;
  try {
    await lock?.release?.();
  } catch {
    /* already released */
  }
  lock = null;
  if (onVis) document.removeEventListener('visibilitychange', onVis);
  onVis = null;
  await saving;
  const done = row ? { ...row, pts: row.pts.slice(), open: false, day: row.pts.length ? zurichDay(row.startAt + row.pts[0][2] * 1000) : row.day } : null;
  row = null;
  last = null;
  Object.assign(rec, { on: false, id: null, tripId: null, startAt: 0, pts: 0, km: 0, acc: null, lastAt: 0, lock: false, here: null });
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
export async function savePlace(trip, pos, { text = '', photo = null, db = appDb, now = new Date() } = {}) {
  const p = { id: `place-${now.getTime()}`, kind: 'place', tripId: trip?.id ?? null, day: localDay(now), at: now.toISOString(), lat: r6(pos.lat), lon: r6(pos.lon), acc: pos.acc ?? null, text: String(text ?? '').trim().slice(0, 1000), photo: photo ?? null };
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
