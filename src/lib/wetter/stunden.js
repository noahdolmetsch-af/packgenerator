/**
 * «Die nächsten Stunden» (Ziel 6, Noah 27.10.2026 «4a»): the weather of the next 2, 4, 6 and 8 hours from
 * several weather models side by side, so you see where they agree and where not. One request to Open-Meteo
 * (free, no key) asks all models at once; the answer is kept on this device for one hour (db.meta).
 *
 * The models (all free on Open-Meteo): MeteoSwiss ICON-CH1 (1 km) and ICON-CH2 (2 km), DWD ICON-D2,
 * Météo-France AROME and ECMWF. A model that does not cover the place answers with empty values and is
 * left out. Along the route (the place you reach in 2, 4, 6, 8 hours) comes in a next step.
 *
 * Pure functions plus loadHours (db + fetcher for tests). Tested in tests/wetter-stunden.test.js.
 */
import { OPEN_METEO, LIMITS } from './kern.js';

export const HOURS_KEY = 'wx-hours:';
export const HOURS_MAX_AGE_MIN = 60;
/** Offline a kept answer is still shown up to this age (with its time). */
export const HOURS_SHOW_H = 6;
export const STEPS = [2, 4, 6, 8];

/** Names stay as the services call them (never through t()). */
export const MODELS = [
  { id: 'meteoswiss_icon_ch1', name: 'MeteoSchweiz 1 km' },
  { id: 'meteoswiss_icon_ch2', name: 'MeteoSchweiz 2 km' },
  { id: 'icon_d2', name: 'DWD ICON-D2' },
  { id: 'meteofrance_arome_france_hd', name: 'Météo-France AROME' },
  { id: 'ecmwf_ifs025', name: 'ECMWF' },
];
const VARS = { temperature_2m: 'temp', precipitation: 'rainMm', wind_speed_10m: 'wind', wind_gusts_10m: 'gust', weather_code: 'code' };

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const r1 = (v) => Math.round(v * 10) / 10;

export const hoursKey = (place) => `${HOURS_KEY}${Number(place.lat).toFixed(2)},${Number(place.lon).toFixed(2)}`;

/** The address: the next 10 hours of every model, one request. */
export function hoursUrl(place, models = MODELS) {
  const q = new URLSearchParams({
    latitude: Number(place.lat).toFixed(3),
    longitude: Number(place.lon).toFixed(3),
    hourly: Object.keys(VARS).join(','),
    models: models.map((m) => m.id).join(','),
    forecast_hours: '10',
    timezone: 'auto',
    timeformat: 'unixtime',
  });
  return `${OPEN_METEO}?${q}`;
}

/**
 * The answer as the app keeps it: { offset, models: [{ id, name, hours: [{ ms, temp, rainMm, wind, gust, code }] }] }.
 * With several models Open-Meteo names each column «temperature_2m_<model>»; a model without any value is left out.
 */
export function parseHours(j, models = MODELS) {
  const h = j?.hourly ?? {};
  const time = h.time ?? [];
  const out = [];
  for (const m of models) {
    const col = (v) => h[`${v}_${m.id}`] ?? (models.length === 1 ? h[v] : null) ?? [];
    const hours = time.map((s, i) => {
      const row = { ms: s * 1000 };
      for (const [v, k] of Object.entries(VARS)) row[k] = fin(col(v)[i]) ? col(v)[i] : null;
      return row;
    });
    if (hours.some((x) => fin(x.temp) || fin(x.rainMm))) out.push({ id: m.id, name: m.name, hours });
  }
  return { offset: fin(j?.utc_offset_seconds) ? j.utc_offset_seconds : 0, models: out };
}

/** The kept answer when fresh, else one request. → { at, place, offset, models, old } or null. */
export async function loadHours(db, place, { fetcher = fetch, now = Date.now(), online = typeof navigator === 'undefined' ? true : navigator.onLine !== false, force = false } = {}) {
  if (!place || !fin(Number(place.lat)) || !fin(Number(place.lon))) return null;
  const key = hoursKey(place);
  const kept = (await db.meta.get(key)) ?? null;
  const fresh = kept && now - kept.at < HOURS_MAX_AGE_MIN * 6e4;
  if ((!fresh || force) && online) {
    try {
      const res = await fetcher(hoursUrl(place));
      if (res.ok) {
        const row = { key, at: now, place: { lat: Number(place.lat), lon: Number(place.lon), name: place.name ?? '' }, ...parseHours(await res.json()) };
        await db.meta.put(row);
        return { ...row, old: false };
      }
    } catch {
      /* offline or the service failed: the kept answer below */
    }
  }
  if (kept && now - kept.at < HOURS_SHOW_H * 36e5) return { ...kept, old: !fresh };
  return null;
}

/** One model over the hours from now to now + h: rain sum, wettest hour, temp range, strongest gust. */
export function modelWindow(hours = [], now, h) {
  const inside = hours.filter((x) => x.ms + 36e5 > now && x.ms < now + h * 36e5);
  const vals = (k) => inside.map((x) => x[k]).filter(fin);
  if (!vals('temp').length && !vals('rainMm').length) return null;
  const rain = vals('rainMm');
  const firstWet = inside.find((x) => fin(x.rainMm) && x.rainMm >= LIMITS.rainMm);
  const t = vals('temp');
  const g = vals('gust');
  const codes = vals('code');
  return {
    rainMm: rain.length ? r1(rain.reduce((a, b) => a + b, 0)) : null,
    rainFrom: firstWet ? firstWet.ms : null,
    tmin: t.length ? Math.min(...t) : null,
    tmax: t.length ? Math.max(...t) : null,
    gust: g.length ? Math.max(...g) : null,
    thunder: codes.some((c) => c >= 95),
  };
}

/**
 * The steps 2, 4, 6, 8 h: per step every model's window and what they say together.
 * → [{ h, models: [{ id, name, w }], wet: n, of: n, agree: 'dry'|'wet'|'split', rainMm: [min, max],
 *     temp: [min, max], gust: max, thunder: n, rainFrom: earliest ms }]
 * agree: all models dry, all wet, or split (some wet). «Wet» = at least LIMITS.rainMm in the window.
 */
export function steps(data, now = Date.now(), list = STEPS) {
  const models = data?.models ?? [];
  return list.map((h) => {
    const rows = models.map((m) => ({ id: m.id, name: m.name, w: modelWindow(m.hours, now, h) })).filter((x) => x.w);
    const isWet = (w) => fin(w.rainMm) && w.rainMm >= LIMITS.rainMm;
    const wetN = rows.filter((x) => isWet(x.w)).length;
    const nums = (k) => rows.map((x) => x.w[k]).filter(fin);
    const rain = nums('rainMm');
    const tmin = nums('tmin');
    const tmax = nums('tmax');
    const gust = nums('gust');
    const from = nums('rainFrom');
    return {
      h,
      models: rows,
      wet: wetN,
      of: rows.length,
      agree: !rows.length ? null : wetN === 0 ? 'dry' : wetN === rows.length ? 'wet' : 'split',
      rainMm: rain.length ? [Math.min(...rain), Math.max(...rain)] : null,
      temp: tmin.length ? [Math.min(...tmin), Math.max(...tmax)] : null,
      gust: gust.length ? Math.max(...gust) : null,
      thunder: rows.filter((x) => x.w.thunder).length,
      rainFrom: from.length ? Math.min(...from) : null,
    };
  });
}

/** The words for a step (English source, through t() in the page). */
export const AGREE_TEXT = {
  dry: 'All {n} models: dry',
  wet: 'All {n} models: rain',
  split: '{wet} of {n} models: rain',
};
