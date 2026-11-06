/**
 * «Nachttemperatur» (Noah 06.11.2026 «1a und c 2a 3a 4a 5a»): the lowest temperature of the night at a place, for the
 * night that just ended («Heute früh»), the coming night («Morgen früh»), the nights before and the nights ahead. A night
 * is the time between 18 h and 8 h, and its name is the morning it ends on (3a). One small request per place (only the
 * temperature, 8 days back and 9 days ahead, about 400 numbers), kept 3 h on this device like the weather core (db.meta,
 * never in a backup); offline the kept answer shows with its time.
 *
 * From the nights the page says (everything a calm hint, only when it is worth a word):
 * - the change against the night before («+2° wärmer») and against the night a week ago;
 * - the trend of the next days (falling, rising) and «5 Plus in X Tagen» (4a: the first night with at least 5 °C when it
 *   is colder now), «Frost in X Tagen» (first night under 0 °C) or «Frostfrei in X Tagen».
 * The value is the weather model's air temperature at the place, not a thermometer. Beyond 5 days a forecast is unsure.
 *
 * Pure apart from loadNacht (db and fetcher are passed in); tested in tests/nacht.test.js.
 */
import { CORE_MAX_AGE_H, CORE_SHOW_H, OPEN_METEO, atLocal, localDate } from './kern.js';

export const NACHT_KEY = 'wx-nacht:';
/** The setting that switches the calm line on Today off (false = no line), like 'fogHome' for the fog line. */
export const HOME_KEY = 'nachtHome';
export const BACK_DAYS = 8;
export const AHEAD_DAYS = 9;
/** The night: from this hour of the evening before to this hour of the morning (local time). */
export const FROM_H = 18;
export const TO_H = 8;
/** A night needs this many of its 14 hours; else it has no value. */
export const MIN_HOURS = 10;
/** «5 Plus»: the warm threshold (4a); frost is 0 °C. */
export const PLUS_C = 5;
export const FROST_C = 0;
/** A change is worth a word from this many degrees: against the night before, and against a week ago. */
export const WORTH_DAY = 2;
export const WORTH_WEEK = 3;
/** The trend: the mean of the nights 4–5 against the mean of the nights 1–2 differs by this much. */
export const WORTH_TREND = 3;
/** How many nights ahead the hints look; beyond UNSURE_AFTER days the page says «unsure». */
export const LOOK_AHEAD = 7;
export const UNSURE_AFTER = 5;
/** The bars: this many nights back and ahead of today. */
export const BARS_BACK = 7;
export const BARS_AHEAD = 6;

const fin = (v) => typeof v === 'number' && Number.isFinite(v);

export const cacheKey = (place) => `${NACHT_KEY}${Number(place.lat).toFixed(2)},${Number(place.lon).toFixed(2)}`;

/** The Open-Meteo address: only the temperature of the hours, back and ahead. */
export function nachtUrl(place) {
  const q = new URLSearchParams({
    latitude: Number(place.lat).toFixed(3),
    longitude: Number(place.lon).toFixed(3),
    hourly: 'temperature_2m',
    past_days: String(BACK_DAYS),
    forecast_days: String(AHEAD_DAYS),
    timezone: 'auto',
    timeformat: 'unixtime',
  });
  return `${OPEN_METEO}?${q}`;
}

/** Open-Meteo's answer → { elev, offset (s), hours: [{ ms, t }] }. */
export function parseNacht(j) {
  const h = j?.hourly ?? {};
  const hours = (h.time ?? []).map((s, i) => ({ ms: s * 1000, t: fin(h.temperature_2m?.[i]) ? h.temperature_2m[i] : null })).filter((x) => x.t != null);
  return { elev: fin(j?.elevation) ? j.elevation : null, offset: fin(j?.utc_offset_seconds) ? j.utc_offset_seconds : 0, hours };
}

/**
 * The nights for a place: the kept answer when it is fresh, else one request (online). → { at, place, ...nacht, old }
 * or null. A failing service keeps the old answer (up to CORE_SHOW_H) and says it is old.
 */
export async function loadNacht(db, place, { fetcher = fetch, now = Date.now(), online = typeof navigator === 'undefined' ? true : navigator.onLine !== false, force = false } = {}) {
  if (!place || !fin(Number(place.lat)) || !fin(Number(place.lon))) return null;
  const key = cacheKey(place);
  const kept = (await db.meta.get(key)) ?? null;
  const fresh = kept && now - kept.at < CORE_MAX_AGE_H * 36e5;
  if ((!fresh || force) && online) {
    try {
      const res = await fetcher(nachtUrl(place));
      if (res.ok) {
        const row = { key, at: now, place: { lat: Number(place.lat), lon: Number(place.lon) }, ...parseNacht(await res.json()) };
        await db.meta.put(row);
        return { ...row, old: false };
      }
    } catch {
      /* offline or the service failed: the kept answer below */
    }
  }
  if (kept && now - kept.at < CORE_SHOW_H * 36e5) return { ...kept, old: !fresh };
  return null;
}

/** The date n days from a date (calendar days, YYYY-MM-DD; no clock arithmetic). */
export const addDay = (date, n) => new Date(Date.parse(`${date}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/**
 * The lowest temperature of the night that ends on the morning of `date` (18 h the evening before to 8 h): { min (°C,
 * as the model says), at (ms), n (hours) } or null when fewer than MIN_HOURS hours are known.
 */
export function nightOf(nacht, date) {
  const off = nacht?.offset ?? 0;
  const from = atLocal(addDay(date, -1), FROM_H, off);
  const to = atLocal(date, TO_H, off);
  const hs = (nacht?.hours ?? []).filter((h) => h.ms >= from && h.ms < to && fin(h.t));
  if (hs.length < MIN_HOURS) return null;
  const low = hs.reduce((a, b) => (b.t < a.t ? b : a));
  return { min: low.t, at: low.ms, n: hs.length };
}

/** The whole degrees of a night (null without value): what the page shows and compares. */
const deg = (night) => (night ? Math.round(night.min) : null);

/** The nights around today as bars: [{ date, k (days from today, negative = back), deg }] from -BARS_BACK to +BARS_AHEAD. */
export function series(nacht, today) {
  const out = [];
  for (let k = -BARS_BACK; k <= BARS_AHEAD; k++) {
    const date = addDay(today, k);
    out.push({ date, k, deg: deg(nightOf(nacht, date)) });
  }
  return out;
}

/** A change in whole degrees against another night, or null when one has no value or it is below the threshold. */
const change = (now, then, worth) => (now == null || then == null || Math.abs(now - then) < worth ? null : now - then);

/**
 * The words behind the card, for the time `nowMs`:
 * { today, last, next (whole °C or null), lastAt, nextAt (ms), vsYesterday, vsWeek, nextVsLast (change in °, null when small),
 *   yesterday, week (whole °C, for the text), trend: 'falling' | 'rising' | null,
 *   plus: { days, unsure } | null, frost: { days, unsure, ends } | null, bars }
 * or null when the nights have no values at all.
 */
export function summary(nacht, nowMs = Date.now()) {
  if (!nacht?.hours?.length) return null;
  const today = localDate(nowMs, nacht.offset ?? 0);
  const last = nightOf(nacht, today);
  const next = nightOf(nacht, addDay(today, 1));
  if (!last && !next) return null;
  const lastD = deg(last);
  const nextD = deg(next);
  const yesterday = deg(nightOf(nacht, addDay(today, -1)));
  const week = deg(nightOf(nacht, addDay(today, -7)));
  const ahead = Array.from({ length: LOOK_AHEAD }, (_, i) => ({ k: i + 1, deg: deg(nightOf(nacht, addDay(today, i + 1))) }));
  // the trend of the next days: the nights 1–2 against the nights 4–5
  const mean = (ks) => {
    const v = ahead.filter((x) => ks.includes(x.k) && x.deg != null).map((x) => x.deg);
    return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
  };
  const early = mean([1, 2]);
  const late = mean([4, 5]);
  const trend = early == null || late == null || Math.abs(late - early) < WORTH_TREND ? null : late > early ? 'rising' : 'falling';
  // «5 Plus in X Tagen»: from the night just ended (else the coming one) as the starting point
  const base = lastD ?? nextD;
  const firstAhead = (pred) => ahead.find((x) => x.deg != null && pred(x.deg)) ?? null;
  let plus = null;
  if (base != null && base < PLUS_C) {
    const f = firstAhead((d) => d >= PLUS_C);
    if (f) plus = { days: f.k, unsure: f.k > UNSURE_AFTER };
  }
  let frost = null;
  if (base != null && base >= FROST_C) {
    const f = firstAhead((d) => d < FROST_C);
    if (f) frost = { days: f.k, unsure: f.k > UNSURE_AFTER, ends: false };
  } else if (base != null) {
    const f = firstAhead((d) => d >= FROST_C);
    if (f) frost = { days: f.k, unsure: f.k > UNSURE_AFTER, ends: true };
  }
  return {
    today,
    last: lastD,
    next: nextD,
    lastAt: last?.at ?? null,
    nextAt: next?.at ?? null,
    yesterday,
    week,
    vsYesterday: change(lastD, yesterday, WORTH_DAY),
    vsWeek: change(lastD, week, WORTH_WEEK),
    nextVsLast: change(nextD, lastD, WORTH_DAY),
    trend,
    plus,
    frost,
    bars: series(nacht, today),
  };
}
