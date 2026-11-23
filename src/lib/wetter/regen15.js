/**
 * «Regen in den nächsten 3 Stunden» (Wetter-Ausbau B, Noah 22.11.2026 «a»): the rain in 15-minute steps for
 * the next three hours at a place, from Open-Meteo (free, no key; the push server asks the same, api/_lib/push.js).
 * It answers «Should I go now?» without opening the Landi radar: «Dry until 16:30. Then about 40 minutes of rain,
 * dry again from 17:15.» The answer is kept on this device (db.meta, never in a backup) for 10 minutes; older than
 * an hour it is not shown, because a rain forecast that old says nothing.
 *
 * Pure functions plus loadRain15 (db + fetcher for tests). Tested in tests/wetter-regen15.test.js.
 */
import { OPEN_METEO } from './kern.js';

export const RAIN15_KEY = 'wx-rain15:';
export const RAIN15_MAX_AGE_MIN = 10;
export const RAIN15_SHOW_MIN = 60;
export const QUARTER = 15 * 60 * 1000;
export const STEPS = 12; // 12 quarters = 3 hours
/** Rain worth a word in a quarter of an hour (mm). */
export const WET15 = 0.1;

const fin = (x) => typeof x === 'number' && Number.isFinite(x);

export const rain15Key = (place) => `${RAIN15_KEY}${Number(place.lat).toFixed(2)},${Number(place.lon).toFixed(2)}`;

/** The Open-Meteo address: the next STEPS quarters (a little more, so the strip is full after some minutes). */
export function rain15Url(place) {
  const q = new URLSearchParams({
    latitude: Number(place.lat).toFixed(3),
    longitude: Number(place.lon).toFixed(3),
    minutely_15: 'precipitation',
    forecast_minutely_15: String(STEPS + 4),
    past_minutely_15: '2',
    timezone: 'UTC',
    timeformat: 'unixtime',
  });
  return `${OPEN_METEO}?${q}`;
}

/**
 * The answer as kept: [{ ms, mm }] (a quarter with no value is left out). ms is the START of the quarter: Open-Meteo
 * stamps the rain of a quarter at its end («the preceding 15 minutes»), so one quarter is taken back (Wetterseite
 * aufräumen, Noah 23.11.2026: one rain start time for the whole page, wetter/regenzeit.js).
 */
export function parseRain15(j) {
  const m = j?.minutely_15 ?? {};
  return (m.time ?? []).map((s, i) => ({ ms: s * 1000 - QUARTER, mm: m.precipitation?.[i] })).filter((r) => fin(r.ms) && fin(r.mm));
}

/**
 * The next three hours from the quarter that holds `now`.
 * → { bars: [{ ms, mm, wet }], max (mm, at least 0.5), nowWet, dry, from (ms | null: first wet quarter after a dry
 *     start), to (ms | null: the first dry quarter after the rain), toEnd (the rain lasts to the end), minutes
 *     (length of the first rain in minutes), minutesToRain (ms until it starts, in whole minutes, or null) } or null
 * when fewer than 4 quarters are known.
 */
export function rain15Strip(rows, now = Date.now()) {
  const bars = (rows ?? [])
    .filter((r) => r.ms + QUARTER > now)
    .sort((a, b) => a.ms - b.ms)
    .slice(0, STEPS)
    .map((r) => ({ ms: r.ms, mm: Math.max(0, r.mm), wet: r.mm >= WET15 }));
  if (bars.length < 4) return null;
  const nowWet = bars[0].wet;
  const firstWet = bars.findIndex((b) => b.wet);
  const dry = firstWet < 0;
  // the first rain: from its first wet quarter to the first dry one after it
  let end = firstWet;
  while (!dry && end < bars.length && bars[end].wet) end++;
  const toEnd = !dry && end >= bars.length;
  return {
    bars,
    max: Math.max(0.5, ...bars.map((b) => b.mm)),
    nowWet,
    dry,
    from: !dry && !nowWet ? bars[firstWet].ms : null,
    to: !dry && !toEnd ? bars[end].ms : null,
    toEnd,
    minutes: dry ? 0 : (end - firstWet) * 15,
    minutesToRain: !dry && !nowWet ? Math.max(0, Math.round((bars[firstWet].ms - now) / 60000)) : null,
  };
}

/** What to say, as a kind with its values (the component turns it into words): 'dry' | 'now' | 'nowAll' | 'later' | 'laterAll'. */
export function rain15Say(s) {
  if (!s) return null;
  if (s.dry) return { kind: 'dry' };
  if (s.nowWet) return s.toEnd ? { kind: 'nowAll' } : { kind: 'now', to: s.to };
  return s.toEnd ? { kind: 'laterAll', from: s.from } : { kind: 'later', from: s.from, to: s.to, minutes: s.minutes };
}

/** Bar height in percent (a dry quarter keeps a thin line). */
export const bar15Pct = (b, max) => (b.mm <= 0 ? 3 : Math.max(10, Math.min(100, Math.round((b.mm / max) * 100))));

/**
 * The quarters for a place: the kept answer while it is under RAIN15_MAX_AGE_MIN old, else one request (online).
 * A failing service keeps the old answer for RAIN15_SHOW_MIN. → { at, rows, old } or null.
 */
export async function loadRain15(db, place, { fetcher = fetch, now = Date.now(), online = typeof navigator === 'undefined' ? true : navigator.onLine !== false, force = false } = {}) {
  if (!place || !fin(Number(place.lat)) || !fin(Number(place.lon))) return null;
  const key = rain15Key(place);
  const kept = (await db.meta.get(key)) ?? null;
  const fresh = kept && now - kept.at < RAIN15_MAX_AGE_MIN * 60000;
  if ((!fresh || force) && online) {
    try {
      const res = await fetcher(rain15Url(place));
      if (res.ok) {
        const rows = parseRain15(await res.json());
        if (rows.length) {
          await db.meta.put({ key, at: now, rows });
          return { at: now, rows, old: false };
        }
      }
    } catch {
      /* offline or the service failed: the kept answer below */
    }
  }
  if (kept && now - kept.at < RAIN15_SHOW_MIN * 60000) return { at: kept.at, rows: kept.rows, old: !fresh };
  return null;
}
