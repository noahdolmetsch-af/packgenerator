/**
 * Erinnerungen aufs Handy (Web-Push): the pure parts of api/push.js.
 *
 * The app sends the list of its next reminders (only the ones switched on, Noah «2b»), each with its
 * time and its words, already in the app's language. The server keeps them until they are due, sends
 * them and forgets them. The weather warning on the tour day (Noah «3a») is checked on the morning
 * itself: the server asks Open-Meteo and sends a message only for a storm, heat or a thunderstorm.
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
  return { key, at, date, lat, lon, title: str(x?.title, 80), url: url.startsWith('#/') ? url : '#/' };
}

/** The words of the weather message, one per reason, «{temp}» filled in by the server. */
export function cleanTexts(t) {
  return { storm: str(t?.storm, 200), heat: str(t?.heat, 200), thunder: str(t?.thunder, 200), title: str(t?.title, 80) };
}

/** What the app sent, made safe. → { items, weather, texts, hotC } */
export function cleanList(body) {
  const items = (Array.isArray(body?.items) ? body.items : []).map(cleanItem).filter(Boolean).slice(0, MAX_ITEMS);
  const weather = (Array.isArray(body?.weather) ? body.weather : []).map(cleanWeather).filter(Boolean).slice(0, MAX_WEATHER);
  const hot = num(body?.hotC);
  return { items, weather, texts: cleanTexts(body?.texts), hotC: hot != null && hot >= 15 && hot <= 45 ? hot : 30 };
}

/** The earliest time anything of this record is due, or null. */
export const nextAt = (rec) => Math.min(Infinity, ...(rec?.items ?? []).map((i) => i.at), ...(rec?.weather ?? []).map((w) => w.at));

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

/** Open-Meteo's daily answer for one day → the reasons to warn: 'storm', 'heat', 'thunder'. */
export function weatherReasons(daily, date, hotC = 30) {
  const i = (daily?.time ?? []).indexOf(date);
  if (i < 0) return { reasons: [], tmax: null };
  const tmax = daily.temperature_2m_max?.[i] ?? null;
  const gust = daily.wind_gusts_10m_max?.[i] ?? null;
  const code = daily.weather_code?.[i] ?? null;
  const reasons = [];
  if (THUNDER.includes(code)) reasons.push('thunder');
  if (gust != null && gust >= GUST_KMH) reasons.push('storm');
  if (tmax != null && tmax >= hotC) reasons.push('heat');
  return { reasons, tmax };
}

/** The forecast address for one place and day (free, no key). */
export const forecastUrl = (w) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${w.lat.toFixed(3)}&longitude=${w.lon.toFixed(3)}&daily=temperature_2m_max,wind_gusts_10m_max,weather_code&timezone=Europe%2FZurich&start_date=${w.date}&end_date=${w.date}`;

/** The message of a weather warning: the first reason (thunder before storm before heat), or null. */
export function weatherMessage(w, verdict, texts) {
  const r = verdict.reasons[0];
  if (!r || !texts[r]) return null;
  const body = texts[r].replace('{temp}', verdict.tmax != null ? String(Math.round(verdict.tmax)) : '');
  return { title: w.title || texts.title || 'Pack Generator', body, url: w.url, tag: w.key };
}
