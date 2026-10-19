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
/* Wetter-Wecker (Paket G, Noah 19.10.2026): a planned tour is watched twice a day until the day before. */
export const WATCH_MAX_DAYS = 5;
export const WATCH_EVERY_MS = 12 * 3600 * 1000;
export const WATCH_SPAN = 3; // a better window is looked for up to 3 days before or after
export const GOOD = { rainMm: 2, rainPct: 50, gustKmh: 50, minC: 5 };

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

/** One Wetter-Wecker watch (Paket G): { key, at (ms, first check), date, days, lat, lon, title, url }. */
export function cleanWatch(x) {
  const w = cleanWeather(x);
  if (!w) return null;
  const days = Number.isInteger(x?.days) ? Math.min(Math.max(x.days, 1), WATCH_MAX_DAYS) : 1;
  return { ...w, days };
}

/** The words of the weather messages, «{temp}», «{trip}», «{day}» filled in by the server. */
export function cleanTexts(t) {
  const out = { storm: str(t?.storm, 200), heat: str(t?.heat, 200), thunder: str(t?.thunder, 200), title: str(t?.title, 80) };
  for (const k of ['turn', 'good', 'window', 'bad', 'better', 'wtitle']) out[k] = str(t?.[k], 200);
  out.wdays = (Array.isArray(t?.wdays) ? t.wdays : []).slice(0, 7).map((d) => str(d, 6));
  return out;
}

/** What the app sent, made safe. → { items, weather, texts, hotC } */
export function cleanList(body) {
  const items = (Array.isArray(body?.items) ? body.items : []).map(cleanItem).filter(Boolean).slice(0, MAX_ITEMS);
  const weather = (Array.isArray(body?.weather) ? body.weather : []).map(cleanWeather).filter(Boolean).slice(0, MAX_WEATHER);
  const watch = (Array.isArray(body?.watch) ? body.watch : []).map(cleanWatch).filter(Boolean).slice(0, MAX_WEATHER);
  const hot = num(body?.hotC);
  return { items, weather, watch, texts: cleanTexts(body?.texts), hotC: hot != null && hot >= 15 && hot <= 45 ? hot : 30 };
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

/** The earliest time anything of this record is due, or null. */
export const nextAt = (rec) => Math.min(Infinity, ...(rec?.items ?? []).map((i) => i.at), ...(rec?.weather ?? []).map((w) => w.at), ...(rec?.watch ?? []).map((w) => w.at));

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
