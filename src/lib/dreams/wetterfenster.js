/**
 * «Wetterfenster für Träume» (Träume und Neuland N15, Noah 27.10.2026 «1-5 a»): when a dream that fits this
 * month gets two or three dry days in a row in the forecast, Touren › Träume says so quietly at the dream
 * («Dry Thu–Sat») and Touren › Übersicht adds it to «A dream that fits now».
 *
 * - The place: the start of the dream's route, else the home place.
 * - A day is dry under 1 mm and under 40 % rain chance. The window needs the dream's days, at least 2, at most 3.
 * - The forecast (free Open-Meteo, as everywhere in the app) is kept in db.meta DREAM_WX per place (rounded to
 *   0.1°) and fetched again after 3 hours, at most MAX_PLACES places, only when Träume or Übersicht opens.
 * Pure parts tested in tests/wetterfenster.test.js.
 */
import { fetchForecast } from '../weather.js';

export const DREAM_WX = 'dreams.wx';
export const MAX_PLACES = 4;
const FRESH_MS = 3 * 3600 * 1000;
/** A kept forecast older than this goes. */
const OLD_MS = 2 * 86400 * 1000;

/** A day of the forecast is dry: under 1 mm and under 40 % rain chance. */
export const isDry = (d) => d != null && (Number(d.rainMm) || 0) < 1 && (Number(d.rainPct) || 0) < 40;

/** Where the weather counts: { lat, lon } of the route start, else the home place, else null. */
export function placeOf(dream, home) {
  const p = dream?.route?.line?.[0];
  if (Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1]))) return { lat: Number(p[0]), lon: Number(p[1]) };
  if (Number.isFinite(Number(home?.lat)) && Number.isFinite(Number(home?.lon))) return { lat: Number(home.lat), lon: Number(home.lon) };
  return null;
}

/** The key of a place in the kept forecasts (0.1° ≈ 10 km). */
export const placeKey = (p) => `${(Math.round(p.lat * 10) / 10).toFixed(1)},${(Math.round(p.lon * 10) / 10).toFixed(1)}`;

/**
 * The first window of dry days from `today` on: { from, to, n } or null. need: days in a row (2–3).
 * days: [{ date, rainMm, rainPct }] in order.
 */
export function dryWindow(days = [], today, need = 2) {
  let run = [];
  for (const d of days) {
    if (!d?.date || d.date < today) continue;
    if (isDry(d) && (!run.length || nextDay(run.at(-1).date) === d.date)) run.push(d);
    else run = isDry(d) ? [d] : [];
    if (run.length >= need) {
      // take the whole run of dry days
      const i = days.indexOf(run.at(-1));
      let end = run.at(-1);
      for (let k = i + 1; k < days.length && isDry(days[k]) && nextDay(end.date) === days[k].date; k++) end = days[k];
      const n = Math.round((Date.parse(`${end.date}T12:00:00Z`) - Date.parse(`${run[0].date}T12:00:00Z`)) / 864e5) + 1;
      return { from: run[0].date, to: end.date, n };
    }
  }
  return null;
}
function nextDay(day) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** The days in a row a dream needs for its window: its days, at least 2, at most 3. */
export const needDays = (dream) => Math.min(3, Math.max(2, Math.round(Number(dream?.days) || 1)));

/**
 * The windows of the dreams: Map(dream id → { from, to, n }). dreams: the ones that fit now; kept: the
 * DREAM_WX value { places: { key: { fetchedAt, days } } }.
 */
export function windowsOf(dreams = [], home, kept, today) {
  const out = new Map();
  for (const d of dreams) {
    const p = placeOf(d, home);
    const f = p ? kept?.places?.[placeKey(p)] : null;
    const w = f ? dryWindow(f.days, today, needDays(d)) : null;
    if (w) out.set(d.id, w);
  }
  return out;
}

/** The places still to fetch (not kept or older than 3 hours), at most MAX_PLACES. */
export function placesToFetch(dreams = [], home, kept, now = Date.now()) {
  const want = new Map();
  for (const d of dreams) {
    const p = placeOf(d, home);
    if (p) want.set(placeKey(p), p);
  }
  return [...want]
    .filter(([k]) => {
      const f = kept?.places?.[k];
      return !f || now - Date.parse(f.fetchedAt) > FRESH_MS;
    })
    .slice(0, MAX_PLACES);
}

/**
 * Fetch what is missing and keep it (db.meta, this device only). Forecasts older than 2 days go.
 * → the kept value. Offline or a failed fetch keeps what was there.
 */
let running = null;
export function refreshDreamWx(db, dreams, home, opts = {}) {
  // one refresh at a time: a second call while one runs gets the same answer
  if (running) return running;
  running = doRefresh(db, dreams, home, opts).finally(() => (running = null));
  return running;
}
async function doRefresh(db, dreams, home, { fetcher = fetch, now = Date.now(), online = typeof navigator === 'undefined' ? true : navigator.onLine } = {}) {
  const row = (await db.meta.get(DREAM_WX)) ?? null;
  const kept = { places: { ...(row?.places ?? {}) } };
  if (!online) return kept;
  const todo = placesToFetch(dreams, home, kept, now);
  if (!todo.length) return kept;
  for (const [k, p] of todo) {
    try {
      const f = await fetchForecast({ name: k, ...p }, fetcher, new Date(now));
      kept.places[k] = { fetchedAt: f.fetchedAt, days: f.days.map(({ date, rainMm, rainPct, max }) => ({ date, rainMm, rainPct, max })) };
    } catch {
      /* offline or the service failed: what was kept stays */
    }
  }
  for (const [k, f] of Object.entries(kept.places)) if (!(now - Date.parse(f.fetchedAt) < OLD_MS)) delete kept.places[k];
  await db.meta.put({ key: DREAM_WX, ...kept });
  return kept;
}

/** «Thu–Sat» (or «Thu» for one day) in the given locale. */
export function dayRange(w, loc = 'de-CH') {
  const wd = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { weekday: 'short', timeZone: 'UTC' }).replace(/\.$/, '');
  return w.from === w.to ? wd(w.from) : `${wd(w.from)}–${wd(w.to)}`;
}
