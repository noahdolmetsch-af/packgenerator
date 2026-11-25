/**
 * «Wetter» of the tour suggestions (Noah 24.11.2026 «a»): for each tour a traffic light (good, so-so, bad) for today, tomorrow and
 * the day after, the best day of the next ten, and «wet trails» (rain of the last two days). Only a suggestion: a forecast, never a rule.
 *
 * One request for all tours: the start of each tour falls into a cell of 0.25° (about 20 km); Open-Meteo answers the daily values of
 * all cells at once (two days back, sixteen days ahead). Only the coordinates of the public tours go out, never your home place.
 * The answer is kept for three hours (db.meta, like the weather core). Pure functions, tested in tests/vorschlaege.test.js.
 */
import { OPEN_METEO } from '../wetter/kern.js';

export const CELL = 0.25;
export const PAST_DAYS = 2;
export const FORECAST_DAYS = 16;
/** The best day is looked for in this many days from today: further out a forecast is only a guess. */
export const BEST_DAYS = 10;
export const KEY = 'wx-tours';
export const MAX_AGE_H = 3;
export const DAILY = ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'precipitation_probability_max', 'wind_gusts_10m_max'];

/** Limits of the traffic light: rain in mm and chance in %, gusts in km/h, temperature up high in °C. */
export const LIMITS = { rainFair: 2, rainBad: 8, chanceFair: 50, gustFair: 45, gustBad: 70, coldFair: 3, coldBad: -3, hot: 32, wetTrail: 5 };
/** A drop of 0.65 °C per 100 m. */
const LAPSE = 0.0065;

const fin = (x) => typeof x === 'number' && Number.isFinite(x);
export const cellKey = (lat, lon) => `${Math.round(lat / CELL)}:${Math.round(lon / CELL)}`;
export const cellCentre = (k) => k.split(':').map((n) => Number(n) * CELL);
/** The cell of the start of a tour, or null. */
export function cellOf(t) {
  const p = t?.line?.[0];
  return Array.isArray(p) && fin(p[0]) && fin(p[1]) ? cellKey(p[0], p[1]) : null;
}
/** The cells the tours start in (sorted: the same list gives the same address). */
export const cellsOf = (tours = []) => [...new Set(tours.map(cellOf).filter(Boolean))].sort();

/** The address of one request for these cells. */
export function wetterUrl(cells = []) {
  const c = cells.map(cellCentre);
  const q = new URLSearchParams({
    latitude: c.map((p) => p[0].toFixed(3)).join(','),
    longitude: c.map((p) => p[1].toFixed(3)).join(','),
    daily: DAILY.join(','),
    past_days: String(PAST_DAYS),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'Europe/Zurich',
    wind_speed_unit: 'kmh',
  });
  return `${OPEN_METEO}?${q}`;
}

/** The answer of Open-Meteo (one object, or a list for several places) → { [cell]: { elevation, days: [{ date, code, tmax, tmin, rain, chance, gust }] } }. */
export function parseWetter(json, cells = []) {
  const list = Array.isArray(json) ? json : json ? [json] : [];
  const out = {};
  list.forEach((p, i) => {
    const k = cells[i];
    const d = p?.daily;
    if (!k || !Array.isArray(d?.time)) return;
    const num = (a, j) => (fin(a?.[j]) ? a[j] : null);
    out[k] = {
      elevation: fin(p.elevation) ? p.elevation : null,
      days: d.time.map((date, j) => ({ date, code: num(d.weather_code, j), tmax: num(d.temperature_2m_max, j), tmin: num(d.temperature_2m_min, j), rain: num(d.precipitation_sum, j), chance: num(d.precipitation_probability_max, j), gust: num(d.wind_gusts_10m_max, j) })),
    };
  });
  return out;
}

/**
 * The traffic light of one day for one tour. day: a row of parseWetter; elevation: the height of the cell (m). The temperature
 * is counted up to the highest point of the tour. → { level: 'good' | 'fair' | 'bad', reasons: ['thunder' | 'rain' | 'wind' | 'cold' | 'hot'], top } or null.
 */
export function dayVerdict(day, tour = null, elevation = null) {
  if (!day || (day.rain === null && day.gust === null && day.code === null)) return null;
  const up = fin(tour?.max) && fin(elevation) ? Math.max(0, tour.max - elevation) : 0;
  const top = fin(day.tmax) ? Math.round((day.tmax - LAPSE * up) * 10) / 10 : null;
  const bad = [];
  const fair = [];
  if (fin(day.code) && day.code >= 95) bad.push('thunder');
  if (fin(day.rain) && day.rain >= LIMITS.rainBad) bad.push('rain');
  else if ((fin(day.rain) && day.rain >= LIMITS.rainFair) || (fin(day.chance) && day.chance >= LIMITS.chanceFair && (day.rain ?? 0) >= 0.5)) fair.push('rain');
  if (fin(day.gust) && day.gust >= LIMITS.gustBad) bad.push('wind');
  else if (fin(day.gust) && day.gust >= LIMITS.gustFair) fair.push('wind');
  if (top !== null && top <= LIMITS.coldBad) bad.push('cold');
  else if (top !== null && top < LIMITS.coldFair) fair.push('cold');
  if (fin(day.tmax) && day.tmax >= LIMITS.hot) fair.push('hot');
  if (bad.length) return { level: 'bad', reasons: [...new Set([...bad, ...fair])], top };
  if (fair.length) return { level: 'fair', reasons: [...new Set(fair)], top };
  return { level: 'good', reasons: [], top };
}

export const RANK = { good: 0, fair: 1, bad: 2 };

/** The rain of the two days before day i (mm), or null when the data does not reach back. */
export function rainBefore(days = [], i) {
  const a = days[i - 1]?.rain;
  const b = days[i - 2]?.rain;
  if (!fin(a) && !fin(b)) return null;
  return Math.round(((a ?? 0) + (b ?? 0)) * 10) / 10;
}

/** A tour that is single trail or technical: wet roots and stones are slippery. */
export const technical = (t) => (t?.single ?? 0) >= 40 || t?.tech === 'medium' || t?.tech === 'difficult';

/** «Wet trails» for day i: { mm, state: 'slippery' | 'fine' } after at least 5 mm in the two days before; else null. */
export function wetTrail(tour, days = [], i) {
  const mm = rainBefore(days, i);
  if (mm === null || mm < LIMITS.wetTrail) return null;
  return { mm, state: technical(tour) ? 'slippery' : 'fine' };
}

/** The index of a date in the days, or -1. */
export const indexOfDate = (days = [], date) => days.findIndex((d) => d.date === date);

/** Adds whole days to a date text (calendar days, no clock). */
export function addDays(date, n) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The weekday of a date text, 0 = Sunday. */
export const weekdayOf = (date) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** The day a chip stands for, as a date: 'today', 'tomorrow', 'dayafter', 'weekend' (the next Saturday or Sunday, today if it is one). */
export function dateOfChoice(choice, today) {
  if (choice === 'today') return today;
  if (choice === 'tomorrow') return addDays(today, 1);
  if (choice === 'dayafter') return addDays(today, 2);
  if (choice === 'weekend') {
    const w = weekdayOf(today);
    return w === 6 || w === 0 ? today : addDays(today, 6 - w);
  }
  return null;
}
export const CHOICES = ['today', 'tomorrow', 'dayafter', 'weekend'];

/**
 * The verdict of a tour for a chosen day: { date, level, reasons, top, trail } or null (no data). 'weekend' takes the better of
 * Saturday and Sunday (a Sunday that is the first day counts alone).
 */
export function verdictFor(tour, wx, choice, today) {
  const cell = wx?.[cellOf(tour)];
  if (!cell) return null;
  const first = dateOfChoice(choice, today);
  if (!first) return null;
  const dates = choice === 'weekend' ? (weekdayOf(first) === 6 ? [first, addDays(first, 1)] : [first]) : [first];
  let best = null;
  for (const date of dates) {
    const i = indexOfDate(cell.days, date);
    const v = i < 0 ? null : dayVerdict(cell.days[i], tour, cell.elevation);
    if (v && (!best || RANK[v.level] < RANK[best.level])) best = { date, ...v, trail: wetTrail(tour, cell.days, i) };
  }
  return best;
}

/** The best day of the next BEST_DAYS days (the first good one, else the first so-so one; none when every day is bad): { date, level, reasons, top } or null. */
export function bestDay(tour, wx, today) {
  const cell = wx?.[cellOf(tour)];
  if (!cell) return null;
  let fair = null;
  for (let n = 0; n < BEST_DAYS; n++) {
    const date = addDays(today, n);
    const i = indexOfDate(cell.days, date);
    const v = i < 0 ? null : dayVerdict(cell.days[i], tour, cell.elevation);
    if (!v) continue;
    if (v.level === 'good') return { date, ...v };
    if (v.level === 'fair' && !fair) fair = { date, ...v };
  }
  return fair;
}

/** The days of one tour for its page: the next 7 days from today, each { date, level, reasons, top, tmin, rain, gust, trail }. */
export function weekOf(tour, wx, today, n = 7) {
  const cell = wx?.[cellOf(tour)];
  if (!cell) return [];
  const out = [];
  for (let k = 0; k < n; k++) {
    const date = addDays(today, k);
    const i = indexOfDate(cell.days, date);
    const day = cell.days[i];
    const v = day ? dayVerdict(day, tour, cell.elevation) : null;
    if (v) out.push({ date, ...v, tmax: day.tmax, tmin: day.tmin, rain: day.rain, gust: day.gust, trail: wetTrail(tour, cell.days, i) });
  }
  return out;
}

/** The tours in this order: good days first, then so-so; bad days (and tours without data) are left where they were relative to each other. Stable. */
export const sortByWeather = (tours = [], wx, choice, today) =>
  tours.map((t, i) => [t, RANK[verdictFor(t, wx, choice, today)?.level] ?? 3, i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((x) => x[0]);

/** The kept answer when it is fresh, else one request (online). → the cells' map or null. A failing service keeps the old answer for a day. */
export async function loadWetter(db, tours, { fetcher = fetch, now = Date.now(), online = typeof navigator === 'undefined' ? true : navigator.onLine !== false } = {}) {
  const cells = cellsOf(tours);
  if (!cells.length) return null;
  const sig = cells.join(';');
  const kept = (await db.meta.get(KEY)) ?? null;
  const same = kept && kept.sig === sig;
  const fresh = same && now - kept.at < MAX_AGE_H * 36e5;
  if (!fresh && online) {
    try {
      const res = await fetcher(wetterUrl(cells));
      if (res.ok) {
        const data = parseWetter(await res.json(), cells);
        if (Object.keys(data).length) {
          await db.meta.put({ key: KEY, at: now, sig, data });
          return data;
        }
      }
    } catch {
      /* offline or the service failed: the kept answer below */
    }
  }
  return same && now - kept.at < 24 * 36e5 ? kept.data : null;
}
