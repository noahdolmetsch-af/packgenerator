/**
 * Paket G «Ozon und Pollen» (Noah 19.10.2026 «3a»): the air of today and tomorrow at the home place
 * from Open-Meteo's free air-quality service (Europe, no key). Strong pollen after the Swiss classes,
 * ozone from 180 µg/m³ (the information threshold). Which pollen counts is the user's choice
 * (settings 'air' = { ozone, pollen: [kinds] }, everything on at the start). The same numbers and
 * classes as the server (api/_lib/push.js) for the tour-morning message.
 */
import { localDay } from './localday.js';

export const AIR_KEY = 'air';
export const AIR_CACHE = 'air.last'; // db.meta: the last answer, for offline
export const OZONE_HIGH = 180;
export const POLLEN = [
  { key: 'birch', field: 'birch_pollen', strong: 70 },
  { key: 'alder', field: 'alder_pollen', strong: 70 },
  { key: 'grass', field: 'grass_pollen', strong: 50 },
  { key: 'mugwort', field: 'mugwort_pollen', strong: 15 },
  { key: 'ragweed', field: 'ragweed_pollen', strong: 10 },
];
/** English names for t(). */
export const POLLEN_NAMES = { birch: 'Birch', alder: 'Alder', grass: 'Grasses', mugwort: 'Mugwort', ragweed: 'Ragweed' };

/** The stored choice, made safe: everything on unless switched off. */
export function airPrefs(v) {
  const all = POLLEN.map((p) => p.key);
  return { ozone: v?.ozone !== false, pollen: Array.isArray(v?.pollen) ? v.pollen.filter((k) => all.includes(k)) : all };
}

export const airUrl = (place) =>
  `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${Number(place.lat).toFixed(3)}&longitude=${Number(place.lon).toFixed(3)}&hourly=ozone,${POLLEN.map((p) => p.field).join(',')}&timezone=Europe%2FZurich&forecast_days=2`;

/** One day of the answer: { day, ozone (max), pollen: { [key]: max } } with null where unknown. */
export function airDay(hourly, day) {
  const idx = (hourly?.time ?? []).map((x, i) => (String(x).startsWith(day) ? i : -1)).filter((i) => i >= 0);
  const max = (field) => {
    const v = idx.map((i) => hourly?.[field]?.[i]).filter((x) => typeof x === 'number' && Number.isFinite(x));
    return v.length ? Math.round(Math.max(...v)) : null;
  };
  return { day, ozone: max('ozone'), pollen: Object.fromEntries(POLLEN.map((p) => [p.key, max(p.field)])) };
}

/** What is high on a day, as chosen: { ozone: n|null, pollen: [{ key, max }] }. */
export function airHigh(d, prefs = airPrefs(null)) {
  return {
    ozone: prefs.ozone && d?.ozone != null && d.ozone >= OZONE_HIGH ? d.ozone : null,
    pollen: POLLEN.filter((p) => prefs.pollen.includes(p.key) && d?.pollen?.[p.key] != null && d.pollen[p.key] >= p.strong).map((p) => ({ key: p.key, max: d.pollen[p.key] })),
  };
}

/** Fetch today and tomorrow (and keep them for offline). → { at, days: [airDay, airDay] } */
export async function fetchAir(place, { db = null, fetcher = fetch, now = new Date() } = {}) {
  const res = await fetcher(airUrl(place));
  if (!res.ok) throw new Error(`air ${res.status}`);
  const { hourly } = await res.json();
  const today = localDay(now);
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const out = { at: now.toISOString(), place: { lat: place.lat, lon: place.lon }, days: [airDay(hourly, today), airDay(hourly, tomorrow.toISOString().slice(0, 10))] };
  if (db) await db.table('meta').put({ key: AIR_CACHE, value: out }).catch(() => {});
  return out;
}
