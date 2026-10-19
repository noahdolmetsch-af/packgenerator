/**
 * Paket G «Daten kommen von selbst», #9 «Seetemperatur Zürichsee als Verlauf» (Noah 19.10.2026): the
 * water of Lake Zurich, built without mockups.
 *
 * - The main value is the real measurement of the city of Zurich (station Mythenquai); the preview of
 *   the next days is a model calculation of Eawag (Alplakes, Simstrat). Both are free, without a key.
 * - The app asks its own small server (api/lake.js). When that does not answer (e.g. a PR preview
 *   before the server is deployed), it asks the sources directly with the same code
 *   (api/_lib/lake.js, one page of values only: the last ~7 days).
 * - The last answer stays on this device (db.meta LAKE_CACHE_KEY: app memory, not in backups, not
 *   synced), so the card shows something offline. A new answer at most every 30 minutes.
 * - The swim hint is an observation only, never advice: «from {warm} °C pleasant», warm changeable
 *   (db.settings LAKE_SET_KEY, travels with the backup like every setting).
 */
import { lakeNow, isLakeAnswer } from '../../api/_lib/lake.js';

export const LAKE_URL = 'https://packgen-three.vercel.app/api/lake?step=now';
export const LAKE_CACHE_KEY = 'lake.last';
export const LAKE_SET_KEY = 'lake';
export const REFRESH_MS = 30 * 60 * 1000;
/** A measurement older than this is shown as «older». */
export const STALE_MS = 3 * 60 * 60 * 1000;
export const WARM_DEFAULT = 20;
export const WARM_MIN = 10;
export const WARM_MAX = 30;

/* ---------- settings ---------- */

export function lakeSetOf(v) {
  const w = Number(v?.warm);
  return { warm: Number.isFinite(w) ? Math.min(WARM_MAX, Math.max(WARM_MIN, Math.round(w * 2) / 2)) : WARM_DEFAULT };
}

export async function readLakeSet(db) {
  return lakeSetOf((await db.settings.get(LAKE_SET_KEY))?.value);
}

export async function saveLakeSet(db, patch) {
  const cur = await readLakeSet(db);
  await db.settings.put({ key: LAKE_SET_KEY, value: lakeSetOf({ ...cur, ...patch }) });
}

/* ---------- fetching ---------- */

/** The server first, then the sources directly. → { data, via: 'server'|'direct' }; throws when both fail. */
export async function fetchLake({ fetcher = (...a) => fetch(...a), now = new Date() } = {}) {
  try {
    const res = await fetcher(LAKE_URL, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (isLakeAnswer(data)) return { data, via: 'server' };
    }
  } catch {
    // no server (offline, or not deployed in this preview): try the sources
  }
  const data = await lakeNow({ doFetch: fetcher, now, pages: 1, timeout: 8000 });
  return { data, via: 'direct' };
}

/** Is the stored answer younger than REFRESH_MS? */
export function isFresh(cache, now = new Date()) {
  const t = Date.parse(cache?.fetchedAt ?? '');
  return Number.isFinite(t) && now.getTime() - t < REFRESH_MS && now.getTime() >= t;
}

export async function readLakeCache(db) {
  const v = (await db.meta.get(LAKE_CACHE_KEY))?.value;
  return v && isLakeAnswer(v.data) ? v : null;
}

/**
 * The card's one call: the stored answer when fresh, else a new one (stored). Offline or on an error
 * it gives the stored one with error set. → { fetchedAt, via, data } | { error, …stored } | null.
 */
export async function loadLake(db, { fetcher, now = new Date(), force = false } = {}) {
  const cache = await readLakeCache(db);
  if (!force && isFresh(cache, now)) return cache;
  try {
    const { data, via } = await fetchLake({ fetcher, now });
    const rec = { fetchedAt: now.toISOString(), via, data: JSON.parse(JSON.stringify(data)) };
    await db.meta.put({ key: LAKE_CACHE_KEY, value: rec });
    return rec;
  } catch {
    return cache ? { ...cache, error: true } : { error: true, data: null };
  }
}

/* ---------- what the card shows ---------- */

/** 'warm' at or above the threshold, else 'cool'; null without a value. */
export function swimTone(water, warm = WARM_DEFAULT) {
  if (typeof water !== 'number') return null;
  return water >= warm ? 'warm' : 'cool';
}

export function isStale(at, now = new Date()) {
  const t = Date.parse(at ?? '');
  return !Number.isFinite(t) || now.getTime() - t > STALE_MS;
}

/** Change of the daily mean against `back` days earlier (rounded to 0.1), or null. */
export function trend(days, back = 7) {
  if (!Array.isArray(days) || days.length < 2) return null;
  const last = days[days.length - 1];
  const target = days.find((d) => d.day >= addDay(last.day, -back));
  if (!target || target === last) return null;
  return Math.round((last.mean - target.mean) * 10) / 10;
}

function addDay(day, k) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
}

/**
 * The 30-day line for an inline SVG: days (mean) and the preview days in one box.
 * → { past: 'M…', ahead: 'M…' | '', lo, hi, warmY, points: [{ x, y, day, v, ahead }] } or null.
 * The x axis is by calendar day, so a gap stays a gap.
 */
export function sparkline(days, forecast = [], { w = 300, h = 64, pad = 4, warm = null } = {}) {
  const past = (days ?? []).filter((d) => typeof d.mean === 'number').map((d) => ({ day: d.day, v: d.mean, ahead: false }));
  const lastPast = past.length ? past[past.length - 1].day : '';
  const next = (forecast ?? []).filter((d) => typeof d.water === 'number' && d.day > lastPast).map((d) => ({ day: d.day, v: d.water, ahead: true }));
  const all = [...past, ...next];
  if (all.length < 2) return null;
  const first = all[0].day;
  const span = Math.max(1, dayDiff(first, all[all.length - 1].day));
  let lo = Math.min(...all.map((p) => p.v));
  let hi = Math.max(...all.map((p) => p.v));
  if (hi - lo < 2) {
    const mid = (hi + lo) / 2;
    lo = mid - 1;
    hi = mid + 1;
  }
  const x = (day) => pad + (dayDiff(first, day) / span) * (w - 2 * pad);
  const y = (v) => pad + (1 - (v - lo) / (hi - lo)) * (h - 2 * pad);
  const f = (n) => Math.round(n * 10) / 10;
  const points = all.map((p) => ({ ...p, x: f(x(p.day)), y: f(y(p.v)) }));
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const pp = points.filter((p) => !p.ahead);
  const ap = points.filter((p) => p.ahead);
  return {
    past: path(pp),
    ahead: ap.length ? path([...(pp.length ? [pp[pp.length - 1]] : []), ...ap]) : '',
    lo: Math.round(lo * 10) / 10,
    hi: Math.round(hi * 10) / 10,
    warmY: warm != null && warm >= lo && warm <= hi ? f(y(warm)) : null,
    points,
  };
}

function dayDiff(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

