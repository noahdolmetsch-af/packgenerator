/**
 * Fitbit über Google Health (Noah 14.10.2026 «ich möchte fitbit anbindung sofort»): the app side of
 * the daily values. Observation only: no score, no diagnosis, nothing is invented.
 *
 * - Table healthDays (db.js): one row per day { date, restingHr, hrvMs, sleep, steps, azm, src, at }.
 *   The same shape comes from the server (api/_lib/googledays.js) and from the one-time Fitbit file.
 * - Merge: per value the newer source wins; a value the new source does not have stays.
 * - Fetch: the server (api/google?step=days) with this device's Strava key. The first time the last
 *   90 days, later from 3 days before the last day held (sleep and HRV can arrive late).
 * The server keeps no health values; they live only in this app (and its backups).
 */
import { localDay } from './localday.js';
import { readKey } from './strava/client.svelte.js';

export const GOOGLE_URL = 'https://packgen-three.vercel.app/api/google';
/** db.settings: { lastSync, until, fetch } (in backups). */
export const HEALTH_KEY = 'health';
/** The values a day can hold, in the order the app shows them. */
export const VALUES = ['sleep', 'restingHr', 'hrvMs', 'steps', 'azm'];
export const FIRST_DAYS = 90;
export const AGAIN_DAYS = 3;

export class HealthError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/** «iso» plus n calendar days (UTC arithmetic on a date string, no time zone involved). */
export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** A row as stored: only known values, numbers checked. Null when it is not a day. */
export function cleanDay(r) {
  if (!r || !/^\d{4}-\d{2}-\d{2}$/.test(r.date ?? '')) return null;
  const out = { date: r.date };
  for (const k of ['restingHr', 'hrvMs', 'steps', 'azm']) if (Number.isFinite(r[k])) out[k] = r[k];
  if (r.sleep && Number.isFinite(r.sleep.asleepMin)) out.sleep = { ...r.sleep };
  return out;
}

/** The old row with the new values on top (per value the newer source wins). */
export function mergeDay(old, neu, src, at) {
  const out = { ...(old ?? {}), date: neu.date };
  for (const k of VALUES) if (neu[k] !== undefined) out[k] = neu[k];
  return { ...out, src, at };
}

/** Writes the rows; returns how many days changed or were new. */
export async function saveDays(db, rows, { src = 'google', at = new Date().toISOString() } = {}) {
  const clean = rows.map(cleanDay).filter(Boolean);
  if (!clean.length) return 0;
  let changed = 0;
  await db.transaction('rw', db.healthDays, async () => {
    const old = await db.healthDays.bulkGet(clean.map((r) => r.date));
    const next = clean.map((r, i) => {
      const m = mergeDay(old[i], r, src, at);
      const same = old[i] && VALUES.every((k) => JSON.stringify(old[i][k]) === JSON.stringify(m[k]));
      if (!same) changed++;
      return same ? old[i] : m;
    });
    await db.healthDays.bulkPut(next);
  });
  return changed;
}

/** Which days to ask for: { from, to } (both inclusive, at most 90 days). */
export function rangeToFetch(lastDay, today) {
  const first = addDays(today, -(FIRST_DAYS - 1));
  if (!lastDay) return { from: first, to: today };
  const from = addDays(lastDay, -AGAIN_DAYS);
  return { from: from < first ? first : from, to: today };
}

/** One call to the server. Throws HealthError with the server's code (network: no answer at all). */
export async function call(step, { method = 'GET', body = null, params = {}, key = readKey(), doFetch = (...a) => fetch(...a) } = {}) {
  if (!key) throw new HealthError('unauthorized');
  const headers = { Authorization: `Bearer ${key}` };
  if (body) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await doFetch(`${GOOGLE_URL}?${new URLSearchParams({ step, ...params })}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new HealthError('network');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.ok === false) throw new HealthError(data?.code ?? data?.error ?? 'server_error');
  return data;
}

/** Fetch the missing days and keep them. Returns { from, to, changed }. */
export async function syncHealth(db, { c = call, now = new Date() } = {}) {
  const last = await db.healthDays.orderBy('date').last();
  const { from, to } = rangeToFetch(last?.date ?? null, localDay(now));
  const { days } = await c('days', { params: { from, to } });
  const at = now.toISOString();
  const changed = await saveDays(db, days ?? [], { src: 'google', at });
  const prev = (await db.settings.get(HEALTH_KEY))?.value ?? {};
  const until = (await db.healthDays.orderBy('date').last())?.date ?? null;
  await db.settings.put({ key: HEALTH_KEY, value: { ...prev, lastSync: at, until } });
  return { from, to, changed };
}

/** The latest day (up to «today») that has value k, or null. */
export function latest(rows, k, today) {
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i].date <= today && rows[i][k] !== undefined) return rows[i];
  return null;
}

/**
 * «Dein Normal»: the median of value k over the 30 days before «today» (at least 7 values), or null.
 * For sleep the minutes asleep.
 */
export function normalOf(rows, k, today, days = 30) {
  const from = addDays(today, -days);
  const vals = rows.filter((r) => r.date >= from && r.date < today).map((r) => (k === 'sleep' ? r.sleep?.asleepMin : r[k])).filter(Number.isFinite).sort((a, b) => a - b);
  if (vals.length < 7) return null;
  const m = vals.length >> 1;
  return vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2;
}

/** Active zone minutes of the week (Monday to «today»). */
export function weekAzm(rows, today) {
  const wd = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = addDays(today, -wd);
  return rows.filter((r) => r.date >= monday && r.date <= today).reduce((s, r) => s + (r.azm ?? 0), 0);
}

/** The weekly goal for the active zone minutes (db.settings AZM_WEEK_KEY { of }, in backups). */
export const AZM_WEEK_KEY = 'azmWeek';
export const AZM_WEEK_OF = 150;
export const azmWeekOf = (v) => (Number.isFinite(Number(v?.of)) && Number(v.of) > 0 ? Math.round(Number(v.of)) : AZM_WEEK_OF);

/**
 * Aktiv (Noah 19.10.2026 «1b»): the active zone minutes of this week, Monday to Sunday, one entry per day.
 * min is null for a day without a value and for days after «today». sum counts up to «today».
 */
export function azmWeek(rows, today) {
  const wd = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = addDays(today, -wd);
  const by = new Map((rows ?? []).filter((r) => Number.isFinite(r?.azm)).map((r) => [r.date, r.azm]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { date, min: date <= today && by.has(date) ? by.get(date) : null, future: date > today, today: date === today };
  });
  return { monday, days, sum: days.reduce((s, d) => s + (d.min ?? 0), 0), any: days.some((d) => d.min !== null) };
}
