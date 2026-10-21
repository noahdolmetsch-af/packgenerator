/**
 * Erinnerungen aufs Handy (Web-Push): the pure parts of api/push.js.
 *
 * The app sends the list of its next reminders (only the ones switched on, Noah «2b»), each with its
 * time and its words, already in the app's language. The server keeps them until they are due, sends
 * them and forgets them. The weather warning on the tour day (Noah «3a») is checked on the morning
 * itself: the server asks Open-Meteo and sends a message only for a storm, heat, ice or a thunderstorm.
 * «Glätte» (Paket Wetter, 0.172+): ice = the coldest hour at or below ICE_C with rain or snow that day;
 * a weather check with only: ['ice'] (the morning ice warning at home) tells only of ice.
 * No quiet hours (Noah «4b»).
 *
 * Storage (Upstash Redis): push:dev:<sha256 of the phone's code> = the phone's record, push:devs =
 * the set of those keys, push:next = the earliest time anything is due (so the tick every minute
 * costs one read when nothing is due).
 */
import { createHash } from 'node:crypto';

export const MAX_ITEMS = 200;
export const MAX_WEATHER = 20;
export const STALE_MS = 6 * 3600 * 1000; // a message more than 6 hours late is not sent any more
export const KEEP_S = 60 * 24 * 3600; // a phone that has not sent its list for 60 days is forgotten
export const GUST_KMH = 60;
export const THUNDER = [95, 96, 99];
export const ICE_C = 1;
export const ICE_WET_MM = 0.2;
/** Freezing drizzle and rain, snow and snow showers (WMO codes). */
export const FREEZE = [56, 57, 66, 67, 71, 73, 75, 77, 85, 86];
export const REASONS = ['thunder', 'ice', 'storm', 'heat'];
/* Wetter-Wecker (Paket G, Noah 19.10.2026): a planned tour is watched twice a day until the day before. */
export const WATCH_MAX_DAYS = 5;
export const WATCH_EVERY_MS = 12 * 3600 * 1000;
export const WATCH_SPAN = 3; // a better window is looked for up to 3 days before or after
export const GOOD = { rainMm: 2, rainPct: 50, gustKmh: 50, minC: 5 };
/* Regen-Warnung unterwegs (Paket G): while riding, every 15 min a look at the next 45 min at the expected place. */
export const RAIN_MAX_TRIPS = 5;
export const RAIN_MAX_POINTS = 120;
export const RAIN_EVERY_MS = 15 * 60 * 1000;
export const RAIN_QUIET_MS = 2 * 3600 * 1000; // after a warning, 2 hours quiet for that tour
export const RAIN_MM = 0.3; // per quarter hour
/* Ozon und Pollen (Paket G): «strong» from the Swiss classes (pollen grains/m³), ozone from the Swiss limit (µg/m³). */
export const OZONE_HIGH = 180;
export const POLLEN = [
  { key: 'birch', field: 'birch_pollen', strong: 70 },
  { key: 'alder', field: 'alder_pollen', strong: 70 },
  { key: 'grass', field: 'grass_pollen', strong: 50 },
  { key: 'mugwort', field: 'mugwort_pollen', strong: 15 },
  { key: 'ragweed', field: 'ragweed_pollen', strong: 10 },
];

export const devKey = (token) => `push:dev:${createHash('sha256').update(String(token)).digest('hex')}`;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The phone's subscription as the browser gives it; null when it is not one. */
export function cleanSub(sub) {
  const endpoint = str(sub?.endpoint, 1000);
  const p256dh = str(sub?.keys?.p256dh, 200);
  const auth = str(sub?.keys?.auth, 100);
  if (!/^https:\/\//.test(endpoint) || !p256dh || !auth) return null;
  return { endpoint, keys: { p256dh, auth } };
}

/** One reminder: { key, at (ms), title, body, url }; null when something needed is missing. */
export function cleanItem(x) {
  const at = num(x?.at);
  const title = str(x?.title, 80);
  const key = str(x?.key, 100);
  if (at == null || !title || !key) return null;
  const url = str(x?.url, 200);
  return { key, at, title, body: str(x?.body, 240), url: url.startsWith('#/') ? url : '#/' };
}

/** One weather check: { key, at (ms), date, lat, lon, title, url }. */
export function cleanWeather(x) {
  const at = num(x?.at);
  const lat = num(x?.lat);
  const lon = num(x?.lon);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(x?.date ?? '') ? x.date : '';
  const key = str(x?.key, 100);
  if (at == null || lat == null || lon == null || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !date || !key) return null;
  const url = str(x?.url, 200);
  const only = Array.isArray(x?.only) ? [...new Set(x.only.filter((r) => REASONS.includes(r)))] : [];
  return { key, at, date, lat, lon, title: str(x?.title, 80), url: url.startsWith('#/') ? url : '#/', ...(only.length ? { only } : {}) };
}

/** One Wetter-Wecker watch (Paket G): { key, at (ms, first check), date, days, lat, lon, title, url }. */
export function cleanWatch(x) {
  const w = cleanWeather(x);
  if (!w) return null;
  const days = Number.isInteger(x?.days) ? Math.min(Math.max(x.days, 1), WATCH_MAX_DAYS) : 1;
  return { ...w, days };
}

/** One rain watch on the way (Paket G): { key, title, url, points: [{ at, lat, lon }] } (expected place every 30 min). */
export function cleanRain(x) {
  const key = str(x?.key, 100);
  const points = (Array.isArray(x?.points) ? x.points : [])
    .map((p) => ({ at: num(p?.at), lat: num(p?.lat), lon: num(p?.lon) }))
    .filter((p) => p.at != null && p.lat != null && p.lon != null && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180)
    .sort((a, b) => a.at - b.at)
    .slice(0, RAIN_MAX_POINTS);
  if (!key || !points.length) return null;
  const url = str(x?.url, 200);
  return { key, at: points[0].at, title: str(x?.title, 80), url: url.startsWith('#/') ? url : '#/', points };
}

/** Which air values to watch (Paket G «Ozon und Pollen»): { ozone, pollen: [kinds] }. */
export function cleanAir(a) {
  return { ozone: a?.ozone !== false, pollen: (Array.isArray(a?.pollen) ? a.pollen : POLLEN.map((p) => p.key)).filter((k) => POLLEN.some((p) => p.key === k)) };
}

/** The words of the weather messages, «{temp}», «{trip}», «{day}» filled in by the server. */
export function cleanTexts(t) {
  const out = { storm: str(t?.storm, 200), heat: str(t?.heat, 200), thunder: str(t?.thunder, 200), ice: str(t?.ice, 200), title: str(t?.title, 80), ititle: str(t?.ititle, 80) };
  for (const k of ['turn', 'good', 'window', 'bad', 'better', 'wtitle', 'rain', 'rtitle', 'ozone', 'pollen']) out[k] = str(t?.[k], 200);
  out.pollenNames = Object.fromEntries(POLLEN.map((p) => [p.key, str(t?.pollenNames?.[p.key], 30)]));
  out.wdays = (Array.isArray(t?.wdays) ? t.wdays : []).slice(0, 7).map((d) => str(d, 6));
  return out;
}

/** What the app sent, made safe. → { items, weather, texts, hotC } */
export function cleanList(body) {
  const items = (Array.isArray(body?.items) ? body.items : []).map(cleanItem).filter(Boolean).slice(0, MAX_ITEMS);
  const weather = (Array.isArray(body?.weather) ? body.weather : []).map(cleanWeather).filter(Boolean).slice(0, MAX_WEATHER);
  const watch = (Array.isArray(body?.watch) ? body.watch : []).map(cleanWatch).filter(Boolean).slice(0, MAX_WEATHER);
  const rain = (Array.isArray(body?.rain) ? body.rain : []).map(cleanRain).filter(Boolean).slice(0, RAIN_MAX_TRIPS);
  const hot = num(body?.hotC);
  return { items, weather, watch, rain, air: body?.air ? cleanAir(body.air) : null, texts: cleanTexts(body?.texts), hotC: hot != null && hot >= 15 && hot <= 45 ? hot : 30 };
}

/**
 * A new list keeps what the server already learned about a watch (its last verdict and the window it
 * told of) and its next check time, so a resend of the app does not repeat a message.
 */
export function keepWatch(fresh = [], old = []) {
  const by = new Map((old ?? []).map((w) => [w.key, w]));
  return fresh.map((w) => {
    const o = by.get(w.key);
    return o ? { ...w, at: o.at, last: o.last ?? null, alt: o.alt ?? null } : { ...w, last: null, alt: null };
  });
}

/** The same for the rain watches: the next check and the last warning stay. */
export function keepRain(fresh = [], old = []) {
  const by = new Map((old ?? []).map((w) => [w.key, w]));
  return fresh.map((w) => {
    const o = by.get(w.key);
    return o ? { ...w, at: Math.max(w.at, o.at ?? 0), warned: o.warned ?? 0 } : { ...w, warned: 0 };
  });
}

/** The earliest time anything of this record is due, or null. */
export const nextAt = (rec) => Math.min(Infinity, ...(rec?.items ?? []).map((i) => i.at), ...(rec?.weather ?? []).map((w) => w.at), ...(rec?.watch ?? []).map((w) => w.at), ...(rec?.rain ?? []).map((w) => w.at));

/** Split into what is due now (and not stale), what is stale (dropped) and what waits. */
export function split(list, now) {
  const due = [];
  const wait = [];
  for (const x of list ?? []) {
    if (x.at > now) wait.push(x);
    else if (now - x.at <= STALE_MS) due.push(x);
  }
  return { due, wait };
}

/** Open-Meteo's daily answer for one day → the reasons to warn, in the order of REASONS: thunder, ice, storm, heat. */
export function weatherReasons(daily, date, hotC = 30) {
  const i = (daily?.time ?? []).indexOf(date);
  if (i < 0) return { reasons: [], tmax: null, tmin: null };
  const tmax = daily.temperature_2m_max?.[i] ?? null;
  const tmin = daily.temperature_2m_min?.[i] ?? null;
  const gust = daily.wind_gusts_10m_max?.[i] ?? null;
  const code = daily.weather_code?.[i] ?? null;
  const wet = (daily.precipitation_sum?.[i] ?? 0) >= ICE_WET_MM || FREEZE.includes(code);
  const reasons = [];
  if (THUNDER.includes(code)) reasons.push('thunder');
  if (tmin != null && tmin <= ICE_C && wet) reasons.push('ice');
  if (gust != null && gust >= GUST_KMH) reasons.push('storm');
  if (tmax != null && tmax >= hotC) reasons.push('heat');
  return { reasons, tmax, tmin };
}

/** The forecast address for one place and day (free, no key). */
export const forecastUrl = (w) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${w.lat.toFixed(3)}&longitude=${w.lon.toFixed(3)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max,weather_code&timezone=Europe%2FZurich&start_date=${w.date}&end_date=${w.date}`;

/**
 * The message of a weather warning: the first reason (thunder, ice, storm, heat) that has words, or null.
 * A check with only (the ice warning at home) looks at those reasons alone. {temp} = the warmest hour,
 * for ice the coldest.
 */
export function weatherMessage(w, verdict, texts) {
  const r = verdict.reasons.find((x) => (!w.only || w.only.includes(x)) && texts[x]);
  if (!r) return null;
  const temp = r === 'ice' ? verdict.tmin : verdict.tmax;
  const body = texts[r].replace('{temp}', temp != null ? String(Math.round(temp)) : '');
  return { title: w.title || (w.only ? texts.ititle : '') || texts.title || 'Pack Generator', body, url: w.url, tag: w.key };
}

/* ---------- Wetter-Wecker (Paket G) ---------- */

const ymdAdd = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** Today in Zurich (the server runs in UTC). */
export const zurichDay = (ms) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

/** The forecast address for the tour days and up to 3 days around them (free, no key). */
export function watchUrl(w, today) {
  let from = ymdAdd(w.date, -WATCH_SPAN);
  if (from < ymdAdd(today, 1)) from = ymdAdd(today, 1);
  const to = ymdAdd(w.date, w.days - 1 + WATCH_SPAN);
  return `https://api.open-meteo.com/v1/forecast?latitude=${w.lat.toFixed(3)}&longitude=${w.lon.toFixed(3)}&daily=temperature_2m_max,wind_gusts_10m_max,weather_code,precipitation_sum,precipitation_probability_max&timezone=Europe%2FZurich&start_date=${from}&end_date=${to}`;
}

/** Is one forecast day good for a tour? Dry, no thunder, no storm, not too cold. null when unknown. */
export function dayGood(daily, day) {
  const i = (daily?.time ?? []).indexOf(day);
  if (i < 0) return null;
  const v = (k) => daily[k]?.[i] ?? null;
  if (THUNDER.includes(v('weather_code'))) return false;
  if ((v('precipitation_sum') ?? 0) >= GOOD.rainMm) return false;
  if ((v('precipitation_probability_max') ?? 0) >= GOOD.rainPct) return false;
  if ((v('wind_gusts_10m_max') ?? 0) >= GOOD.gustKmh) return false;
  if (v('temperature_2m_max') != null && v('temperature_2m_max') < GOOD.minC) return false;
  return true;
}

/**
 * The verdict for a watched tour: 'good' when every tour day looks good, 'bad' when one does not,
 * null when the forecast does not reach it yet. alt = the first other start day (up to 3 days before or
 * after, from tomorrow on) whose days all look good, or null.
 */
export function watchVerdict(daily, w, today) {
  const days = Array.from({ length: w.days }, (_, i) => ymdAdd(w.date, i));
  const tour = days.map((d) => dayGood(daily, d));
  if (tour.some((g) => g == null)) return { verdict: null, alt: null };
  const verdict = tour.every(Boolean) ? 'good' : 'bad';
  let alt = null;
  if (verdict === 'bad')
    for (const n of [1, -1, 2, -2, 3, -3]) {
      const start = ymdAdd(w.date, n);
      if (start <= today) continue;
      if (Array.from({ length: w.days }, (_, i) => dayGood(daily, ymdAdd(start, i))).every((g) => g === true)) {
        alt = start;
        break;
      }
    }
  return { verdict, alt };
}

/**
 * What to tell (Noah «Wetter-Wecker»: when a good window comes or the weather turns):
 * - first look, good: nothing; first look, bad: 'bad' (with the better day, if any)
 * - good → bad: 'turn'; bad → good: 'good'
 * - still bad, a better day shows up that was not told yet: 'window'
 * → { kind, alt } or null
 */
export function watchNews(prev, verdict, alt, prevAlt) {
  if (!verdict) return null;
  if (verdict === 'good') return prev === 'bad' ? { kind: 'good', alt: null } : null;
  if (prev == null) return { kind: 'bad', alt };
  if (prev === 'good') return { kind: 'turn', alt };
  if (alt && alt !== prevAlt) return { kind: 'window', alt };
  return null;
}

/** The message of a watch: the words for its kind, plus the better day when there is one. */
export function watchMessage(w, news, texts) {
  let body = texts?.[news.kind];
  if (!body) return null;
  const dayWord = (day) => {
    const wd = texts.wdays?.[new Date(`${day}T12:00:00Z`).getUTCDay()] ?? '';
    return `${wd ? `${wd} ` : ''}${+day.slice(8, 10)}.${+day.slice(5, 7)}.`;
  };
  body = body.replace('{trip}', w.title || '').replace('{day}', news.alt ? dayWord(news.alt) : '');
  if ((news.kind === 'bad' || news.kind === 'turn') && news.alt && texts.better) body = `${body} ${texts.better.replace('{day}', dayWord(news.alt))}`;
  return { title: texts.wtitle || texts.title || 'Pack Generator', body: body.trim(), url: w.url, tag: w.key };
}

/* ---------- Regen-Warnung unterwegs (Paket G) ---------- */

/** The expected place now: the last point at or before now, if the ride is on (until 30 min after the last point). */
export function placeNow(w, now) {
  const last = w.points.at(-1);
  if (!last || now < w.points[0].at || now > last.at + 30 * 60 * 1000) return null;
  return [...w.points].reverse().find((p) => p.at <= now) ?? null;
}

/** The 15-minute rain for the next hour at a place (free, no key). */
export const rainUrl = (p) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(3)}&longitude=${p.lon.toFixed(3)}&minutely_15=precipitation&forecast_minutely_15=4&timezone=UTC`;

/**
 * Rain coming? Dry now (the first quarter under 0.1 mm), rain from RAIN_MM in one of the next three
 * quarters → minutes until it starts (15, 30, 45), else null.
 */
export function rainSoon(m15) {
  const p = m15?.precipitation ?? [];
  if (p.length < 2 || (p[0] ?? 0) >= 0.1) return null;
  for (let i = 1; i < Math.min(4, p.length); i++) if ((p[i] ?? 0) >= RAIN_MM) return i * 15;
  return null;
}

/** The message of a rain warning. */
export function rainMessage(w, minutes, texts) {
  if (!texts?.rain) return null;
  return { title: texts.rtitle || texts.title || 'Pack Generator', body: texts.rain.replace('{trip}', w.title || '').replace('{min}', String(minutes)), url: w.url, tag: w.key };
}

/* ---------- Ozon und Pollen (Paket G) ---------- */

/** The air-quality address for one place and day (free, no key; Europe). */
export const airUrl = (w) =>
  `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${w.lat.toFixed(3)}&longitude=${w.lon.toFixed(3)}&hourly=ozone,${POLLEN.map((p) => p.field).join(',')}&timezone=Europe%2FZurich&start_date=${w.date}&end_date=${w.date}`;

/**
 * The air of one day: { ozone (max µg/m³), pollen: [{ key, max }] strong ones only, as chosen }.
 * hourly: Open-Meteo's answer; prefs: cleanAir.
 */
export function airVerdict(hourly, date, prefs = { ozone: true, pollen: POLLEN.map((p) => p.key) }) {
  const idx = (hourly?.time ?? []).map((x, i) => (String(x).startsWith(date) ? i : -1)).filter((i) => i >= 0);
  const max = (field) => {
    const v = idx.map((i) => hourly[field]?.[i]).filter((x) => typeof x === 'number');
    return v.length ? Math.max(...v) : null;
  };
  const oz = max('ozone');
  const pollen = POLLEN.filter((p) => prefs.pollen.includes(p.key))
    .map((p) => ({ key: p.key, max: max(p.field) }))
    .filter((p) => p.max != null && p.max >= POLLEN.find((x) => x.key === p.key).strong);
  return { ozone: prefs.ozone && oz != null && oz >= OZONE_HIGH ? Math.round(oz) : null, pollen };
}

/** The air words for a message («Viel Ozon …», «Starker Pollenflug: Birke, Gräser.»), or ''. */
export function airText(v, texts) {
  const out = [];
  if (v.ozone != null && texts?.ozone) out.push(texts.ozone.replace('{n}', String(v.ozone)));
  if (v.pollen.length && texts?.pollen) out.push(texts.pollen.replace('{list}', v.pollen.map((p) => texts.pollenNames?.[p.key] || p.key).join(', ')));
  return out.join(' ');
}
