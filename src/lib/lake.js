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
 *
 * Thread «Seetemperatur und Sauna» (Noah 20.10.2026 «1a 2a 3a 4a 5a», «Zürisee reicht»):
 * - 2a a cold-water scale instead of one threshold: warm, fresh, cold, icy; all three limits changeable.
 * - 4a the app keeps the daily means it has seen (setting LAKE_DAYS_KEY, in the backup), so every
 *   swim ticked in Aktiv gets its water temperature: swims this season, the coldest one.
 * - 1a lakeBrief(): the short form for the Heute line (LakeChip.svelte) and the weather core's
 *   outdoor suggestion; it only reads what is stored, it never fetches.
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
/** 2a: below cold it is «cold», below icy «icy» (between cold and warm «fresh»). */
export const COLD_DEFAULT = 15;
export const ICY_DEFAULT = 10;
export const COLD_MIN = 0;
/** 4a: the daily means seen so far ({ day: mean }), at most this many days. */
export const LAKE_DAYS_KEY = 'lake.days';
export const MAX_LAKE_DAYS = 800;
/** The short name of the lake on cards and the Heute line (Noah 5a «Zürisee reicht»). */
export const LAKE_NAME = 'Lake Zurich';

/* ---------- settings ---------- */

const half = (n) => Math.round(n * 2) / 2;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** The settings made safe: { warm, cold, icy, saunaSee }, always icy < cold < warm. */
export function lakeSetOf(v) {
  const w = Number(v?.warm);
  const warm = Number.isFinite(w) ? clamp(half(w), WARM_MIN, WARM_MAX) : WARM_DEFAULT;
  const c = Number(v?.cold);
  const cold = clamp(Number.isFinite(c) ? half(c) : Math.min(COLD_DEFAULT, warm - 0.5), COLD_MIN + 0.5, warm - 0.5);
  const i = Number(v?.icy);
  const icy = clamp(Number.isFinite(i) ? half(i) : Math.min(ICY_DEFAULT, cold - 0.5), COLD_MIN, cold - 0.5);
  return { warm, cold, icy, saunaSee: v?.saunaSee !== false };
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
  if (!force && isFresh(cache, now)) {
    await keepLakeDays(db, cache.data);
    return cache;
  }
  try {
    const { data, via } = await fetchLake({ fetcher, now });
    const rec = { fetchedAt: now.toISOString(), via, data: JSON.parse(JSON.stringify(data)) };
    await db.meta.put({ key: LAKE_CACHE_KEY, value: rec });
    await keepLakeDays(db, rec.data);
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

/** 2a: the English words of the scale (t() gives German). */
export const SCALE_WORDS = { warm: 'pleasant|water', fresh: 'fresh|water', cold: 'cold|water', icy: 'icy|water' };

/** 2a: the cold-water scale: 'warm' | 'fresh' | 'cold' | 'icy', null without a value. */
export function waterScale(water, set = lakeSetOf()) {
  if (typeof water !== 'number' || !Number.isFinite(water)) return null;
  const s = lakeSetOf(set);
  if (water >= s.warm) return 'warm';
  if (water >= s.cold) return 'fresh';
  if (water >= s.icy) return 'cold';
  return 'icy';
}

/* ---------- 4a: the days seen, the swims ---------- */

/** Merge the daily means of an answer into the kept days ({ day: mean }); the newest MAX_LAKE_DAYS stay. */
export function mergeLakeDays(kept, data) {
  const out = { ...(kept && typeof kept === 'object' ? kept : {}) };
  for (const d of data?.days ?? []) if (/^\d{4}-\d{2}-\d{2}$/.test(d?.day ?? '') && typeof d.mean === 'number') out[d.day] = d.mean;
  const days = Object.keys(out).sort();
  for (const d of days.slice(0, Math.max(0, days.length - MAX_LAKE_DAYS))) delete out[d];
  return out;
}

const sameDays = (a, b) => {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
};

/** Keep the daily means of an answer in the settings (only when something changed). */
export async function keepLakeDays(db, data) {
  const kept = (await db.settings.get(LAKE_DAYS_KEY))?.value ?? {};
  const next = mergeLakeDays(kept, data);
  if (!sameDays(kept, next)) await db.settings.put({ key: LAKE_DAYS_KEY, value: next });
  return next;
}

/** An activity that is a swim in the lake or a river (by id, icon or name). */
export function isSwimAct(a) {
  if (!a) return false;
  if (a.id === 'swim' || a.icon === 'swim') return true;
  return /schwimm|swim|\bbaden\b|\baare\b|\bsee\b|\blake\b/i.test(`${a.name ?? ''} ${a.nameDe ?? ''}`);
}
/** The sauna activity (by id, icon or name). */
export function isSaunaAct(a) {
  if (!a) return false;
  return a.id === 'sauna' || a.icon === 'sauna' || /sauna/i.test(`${a.name ?? ''} ${a.nameDe ?? ''}`);
}

/** The first day of the bathing season a day belongs to: the season starts on 1 September. */
export function seasonStart(today) {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  return `${m >= 9 ? y : y - 1}-09-01`;
}

/**
 * 4a: the swims with their water temperature. acts, log (flowLog), lakeDays ({ day: mean }), today,
 * nowWater (today's measurement, preferred for today). → { season, since, coldest, last, list }
 * season: swim days since seasonStart; coldest / last: { day, water } or null; list: [{ day, water|null }].
 */
export function swimStats({ acts = [], log = [], lakeDays = {}, today, nowWater = null }) {
  const ids = new Set(acts.filter(isSwimAct).map((a) => a.id));
  const days = [...new Set(log.filter((e) => ids.has(e.actId) && typeof e.day === 'string' && e.day <= today).map((e) => e.day))].sort();
  const waterOn = (day) => (day === today && typeof nowWater === 'number' ? nowWater : typeof lakeDays?.[day] === 'number' ? lakeDays[day] : null);
  const list = days.map((day) => ({ day, water: waterOn(day) }));
  const since = seasonStart(today);
  const inSeason = list.filter((s) => s.day >= since);
  const known = list.filter((s) => s.water != null);
  const coldest = known.length ? known.reduce((m, s) => (s.water < m.water || (s.water === m.water && s.day > m.day) ? s : m)) : null;
  return { season: inSeason.length, since, coldest, last: list.at(-1) ?? null, list };
}

/* ---------- 1a: the short form ---------- */

/**
 * What the Heute line and the outdoor suggestion need, from the stored answer only (never fetches):
 * → { name, water, air, at, stale, scale } or null when there is no measurement.
 */
export function briefOf(cache, set, now = new Date()) {
  const cur = cache?.data?.now;
  if (!cur || typeof cur.water !== 'number') return null;
  return { name: LAKE_NAME, water: cur.water, air: typeof cur.air === 'number' ? cur.air : null, at: cur.at, stale: isStale(cur.at, now), scale: waterScale(cur.water, set) };
}

export async function lakeBrief(db, now = new Date()) {
  const [c, s] = await Promise.all([db.meta.get(LAKE_CACHE_KEY), db.settings.get(LAKE_SET_KEY)]);
  return briefOf(c?.value ?? null, lakeSetOf(s?.value), now);
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

