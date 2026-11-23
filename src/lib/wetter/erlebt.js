/**
 * «Erlebtes Wetter im Rückblick» (Wetter-Ausbau E, Noah 22.11.2026 «a»): in the debrief of a tour the question
 * «Weather: colder, as planned, warmer» is answered from what really came, so you only change it when it felt different.
 * The weather of the days comes from Open-Meteo (the forecast service for the last weeks, its archive for older days; free,
 * no key) through touren/tourwx.js and is kept with the trip (trip.wxReal), the same data the tour page already shows.
 * The suggestion compares the middle of the planned range (trip.wx min/max) with the middle of the real range. A tap on
 * an answer always wins: once you answered, the page never overwrites it. Pure functions plus ensureTripWeather(db, trip).
 * Tested in tests/wetter-erlebt.test.js.
 */
import { tripEnd } from '../tripstate.js';
import { startPlace, fetchTourWeather, wxSummary } from '../touren/tourwx.js';

/** From this many degrees apart the answer is «colder» or «warmer». */
export const FELT_DIFF = 3;

const fin = (x) => typeof x === 'number' && Number.isFinite(x);

/** The planned range of a trip: { min, max } or null. */
export function plannedRange(trip) {
  const w = trip?.wx;
  return fin(w?.min) && fin(w?.max) ? { min: w.min, max: w.max } : null;
}

/** What came: { tmin, tmax, mm, wind } over the days of the trip, or null while nothing is kept. */
export function livedWeather(trip) {
  const s = wxSummary(trip?.wxReal);
  return s && fin(s.tmin) && fin(s.tmax) ? { tmin: s.tmin, tmax: s.tmax, mm: s.mm, wind: s.wind } : null;
}

/** 'colder' | 'planned' | 'warmer' (the answers of «How was it?»), or null without a plan or without what came. */
export function weatherVerdict(trip) {
  const plan = plannedRange(trip);
  const lived = livedWeather(trip);
  if (!plan || !lived) return null;
  const diff = (lived.tmin + lived.tmax) / 2 - (plan.min + plan.max) / 2;
  return diff <= -FELT_DIFF ? 'colder' : diff >= FELT_DIFF ? 'warmer' : 'planned';
}

/**
 * Should the page set the answer by itself? Only a draft whose answer nobody tapped (weatherTouched), and only when it
 * differs. → the answer to set, or null.
 */
export function prefill(debrief, trip) {
  if (!debrief || debrief.status === 'done' || debrief.weatherTouched) return null;
  const v = weatherVerdict(trip);
  return v && v !== debrief.weather ? v : null;
}

/** The days a trip covers: { from, to } as YYYY-MM-DD, or null without a start. */
export function tripDays(trip) {
  if (!trip?.startDate) return null;
  return { from: trip.startDate, to: tripEnd(trip) || trip.startDate };
}

/**
 * Keep the weather of a finished trip with it when it has none yet (device online, the trip over, a place known).
 * → the stored weather, or null when nothing was asked. Throws when the service does not answer.
 */
export async function ensureTripWeather(db, trip, today, { fetcher = fetch, online = typeof navigator === 'undefined' ? true : navigator.onLine !== false } = {}) {
  if (!trip || trip.wxReal?.days?.length || !online) return null;
  const span = tripDays(trip);
  const place = startPlace([], trip);
  if (!span || !place || span.to >= today) return null;
  const w = await fetchTourWeather(place, span.from, span.to, today, fetcher);
  if (!w.days.length) return null;
  await db.trips.update(trip.id, { wxReal: w });
  return w;
}

/** The line under the question: «Came: 4–11 °C, 3 mm rain, wind up to 28 km/h». say: { t, num }. */
export function livedText(lived, say) {
  if (!lived) return '';
  const temp = lived.tmin === lived.tmax ? `${say.num(lived.tmin)} °C` : `${say.num(lived.tmin)}–${say.num(lived.tmax)} °C`;
  const rain = lived.mm != null ? (lived.mm >= 0.5 ? say.t('{mm} mm rain', { mm: say.num(lived.mm) }) : say.t('dry')) : '';
  const wind = lived.wind != null ? say.t('wind up to {kmh} km/h', { kmh: say.num(lived.wind) }) : '';
  return [temp, rain, wind].filter(Boolean).join(', ');
}
