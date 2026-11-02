/**
 * «Ein Link wird ein Traum» (Träume und Neuland N13, Noah 27.10.2026 «1-5 a»): paste a link of a tour (Ride
 * with GPS, komoot or a report) and the dream gets its name, km and climb at once.
 *
 * - Ride with GPS: the whole route as GPX through the app's own server (sources/rwgps.js, as «Neue Quellen»):
 *   map, km and climb.
 * - Any other public page (komoot, a blog): the page through the app's own reader (api/linkcheck ?read=,
 *   as «Webseite als Text»): the name from the page title, km and climb from the page's own numbers when
 *   it names them. komoot gives no GPX without an account: the map then comes from a GPX file as before.
 * Only the link goes to the app's own server; nothing is stored there. Pure parts tested in tests/fromlink.test.js.
 */
import { routeFromGpx } from '../dreams.js';
import { parseRwgpsLink, fetchRwgpsGpx } from '../sources/rwgps.js';
/** The app's own page reader (api/linkcheck.js, the same as notes/attach.js READ_URL). */
const READ_URL = 'https://packgen-three.vercel.app/api/linkcheck';
import { t } from '../i18n.svelte.js';

/** The first web link in a text (with or without https://), or null. */
export function linkIn(text) {
  const m = String(text ?? '').match(/(?:https?:\/\/|www\.)[^\s<>"']+|(?<![\w@.-])(?:[a-z0-9-]+\.)*(?:komoot\.[a-z]{2,}|ridewithgps\.com|rwgps\.com)\/[^\s<>"']*/i);
  if (!m) return null;
  const raw = m[0].replace(/[.,;:!?)\]»”'"]+$/, '');
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.href : null;
  } catch {
    return null;
  }
}

/** The climb of a GPX in metres (heights smoothed: a step counts once it passes 5 m), or null without heights. */
export function gainOfGpx(text) {
  const eles = [...String(text ?? '').matchAll(/<ele>\s*(-?[\d.]+)\s*<\/ele>/gi)].map((m) => Number(m[1])).filter(Number.isFinite);
  if (eles.length < 2) return null;
  let gain = 0;
  let base = eles[0];
  for (const e of eles) {
    if (e - base >= 5) {
      gain += e - base;
      base = e;
    } else if (base - e >= 5) base = e;
  }
  return Math.round(gain);
}

const decode = (s) =>
  String(s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
const meta = (html, name) => {
  for (const m of html.matchAll(/<meta\b((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>/gi)) {
    const attrs = Object.fromEntries([...m[1].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((a) => [a[1].toLowerCase(), a[2] ?? a[3]]));
    if ((attrs.property ?? attrs.name ?? '').toLowerCase() === name) return decode(attrs.content ?? '');
  }
  return '';
};
const number = (s) => Number(String(s).replace(/['’\s]/g, '').replace(/(\d)[.,](\d{3})(?!\d)/g, '$1$2').replace(',', '.'));

/**
 * The name, km and climb a page tells about itself. → { title, km, gainM } (km, gainM null when not named).
 * Reads the page's JSON numbers (komoot: "distance" in m, "elevation_up" in m) first, then words like
 * «84,5 km» and «1'250 Hm» / «1250 m up» in the description.
 */
export function factsFromHtml(html) {
  const h = String(html ?? '');
  const title = (meta(h, 'og:title') || decode(h.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '')).replace(/\s*[|–—-]\s*(komoot|Ride with GPS|Strava)\s*$/i, '').slice(0, 80);
  let km = null;
  let gainM = null;
  const jd = h.match(/"distance"\s*:\s*(\d+(?:\.\d+)?)/);
  const ju = h.match(/"elevation_up"\s*:\s*(\d+(?:\.\d+)?)/);
  if (jd && Number(jd[1]) > 100) km = Math.round(Number(jd[1]) / 100) / 10;
  if (ju) gainM = Math.round(Number(ju[1]));
  const text = `${meta(h, 'og:description')} ${meta(h, 'description')}`;
  if (km == null) {
    const m = text.match(/(\d[\d'’.,]*)\s*km\b/i);
    if (m && number(m[1]) > 0) km = Math.round(number(m[1]) * 10) / 10;
  }
  if (gainM == null) {
    const m = text.match(/(\d[\d'’.,]*)\s*(?:hm\b|höhenmeter|m\s*(?:up|uphill|aufwärts|bergauf|aufstieg|elevation gain|↑))/i) ?? text.match(/(?:aufstieg|bergauf|uphill|elevation gain|höhenmeter)\s*:?\s*(\d[\d'’.,]*)\s*m\b/i);
    if (m && number(m[1]) >= 0) gainM = Math.round(number(m[1]));
  }
  return { title, km: Number.isFinite(km) ? km : null, gainM: Number.isFinite(gainM) ? gainM : null };
}

/**
 * Read a link. → { url, title, route (Ride with GPS: { line, km, gainM, name }) | null, km, gainM, from: 'rwgps'|'page' }.
 * Throws an Error with a plain message (offline, not public, not readable).
 */
export async function readLink(url, { fetcher = (...a) => fetch(...a), online = typeof navigator === 'undefined' ? true : navigator.onLine } = {}) {
  if (!online) throw new Error(t('No connection. Reading the link needs the internet.'));
  if (parseRwgpsLink(url)) {
    const { gpx } = await fetchRwgpsGpx(url, { fetcher, online });
    const r = routeFromGpx(gpx);
    if (!r) throw new Error(t('No route found behind this link.'));
    const gainM = gainOfGpx(gpx);
    return { url, title: r.name, route: { ...r, ...(gainM != null ? { gainM } : {}) }, km: r.km, gainM, from: 'rwgps' };
  }
  let res;
  try {
    res = await fetcher(`${READ_URL}?read=${encodeURIComponent(url)}`);
  } catch {
    throw new Error(t('The page could not be loaded. Try again later.'));
  }
  const body = await res.json().catch(() => ({}));
  if (body?.code === 'daily_cap') throw new Error(t('The server has done enough for today. Try again tomorrow.'));
  if (!res.ok || typeof body?.html !== 'string') throw new Error(t('The page could not be loaded. Try again later.'));
  const f = factsFromHtml(body.html);
  return { url, title: f.title, route: null, km: f.km, gainM: f.gainM, from: 'page' };
}

/** A dream with what a link told (the own title stays unless it was only the link). → the changed dream. */
export function withLink(dream, info, { keepTitle = true } = {}) {
  const facts = info.route ? null : info.km != null || info.gainM != null ? { km: info.km, gainM: info.gainM } : dream.facts ?? null;
  return {
    ...dream,
    url: info.url || dream.url || '',
    title: keepTitle && dream.title?.trim() && dream.title.trim() !== info.url ? dream.title : (info.title || dream.title || '').slice(0, 80),
    ...(info.route ? { route: info.route } : {}),
    ...(facts ? { facts } : {}),
  };
}

/** «84 km · 1250 m up» for a dream (its route, else what its link told), '' when nothing is known. */
export function distText(d, fmt = (n) => String(n)) {
  const km = d?.route?.km ?? d?.facts?.km;
  const up = d?.route?.gainM ?? d?.facts?.gainM;
  return [km != null ? t('{km} km', { km: fmt(km) }) : '', up != null ? t('{m} m up', { m: fmt(up) }) : ''].filter(Boolean).join(' · ');
}
