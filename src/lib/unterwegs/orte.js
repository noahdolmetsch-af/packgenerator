/**
 * Paket K #99 «Kurztexte zu Orten»: short texts about places along the route from Wikipedia (free, no
 * account). Only when you tap «Orte laden»: the start, the middle and the finish of the route go to
 * Wikipedia's place search; the texts are kept on the trip (trip.placeTexts) so they work offline.
 * Pure functions (fetch passed in), tested in tests/unterwegs-orte.test.js.
 */
export const RADIUS_M = 10000;
export const PER_POINT = 3;
export const MAX_PLACES = 8;

/** The points to ask about: start, middle, finish of the route line ([[lat, lon]]) or the trip's start place. */
export function askPoints(route, place = null) {
  const line = Array.isArray(route?.line) ? route.line.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) : [];
  if (line.length >= 2) {
    const pick = [line[0], line[Math.floor(line.length / 2)], line.at(-1)];
    return pick.map(([lat, lon]) => ({ lat, lon }));
  }
  return place && Number.isFinite(place.lat) ? [{ lat: place.lat, lon: place.lon }] : [];
}

/** Wikipedia's place search with the short intro of each article. lang: 'de' | 'en'. */
export function wikiUrl(p, lang = 'de') {
  const q = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'geosearch',
    ggscoord: `${(Math.round(p.lat * 1e4) / 1e4).toFixed(4)}|${(Math.round(p.lon * 1e4) / 1e4).toFixed(4)}`,
    ggsradius: String(RADIUS_M),
    ggslimit: String(PER_POINT),
    prop: 'extracts|coordinates',
    exintro: '1',
    explaintext: '1',
    exsentences: '2',
    exlimit: 'max',
  });
  return `https://${lang === 'en' ? 'en' : 'de'}.wikipedia.org/w/api.php?${q.toString()}`;
}

/** The places of an answer: [{ title, text, url, lat, lon }]. */
export function parseWiki(json, lang = 'de') {
  const pages = Object.values(json?.query?.pages ?? {});
  return pages
    .filter((p) => p && p.title && typeof p.extract === 'string' && p.extract.trim())
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((p) => ({
      title: String(p.title),
      text: p.extract.trim().replace(/\s+/g, ' ').slice(0, 400),
      url: `https://${lang === 'en' ? 'en' : 'de'}.wikipedia.org/wiki/${encodeURIComponent(String(p.title).replace(/ /g, '_'))}`,
      lat: p.coordinates?.[0]?.lat ?? null,
      lon: p.coordinates?.[0]?.lon ?? null,
    }));
}

/** Load the places for the points (each article once, at most MAX_PLACES). → { at, lang, list } ; throws { code: 'net' }. */
export async function loadPlaces(points, lang = 'de', doFetch = fetch, now = new Date()) {
  const seen = new Set();
  const list = [];
  for (const p of points) {
    let json;
    try {
      const res = await doFetch(wikiUrl(p, lang));
      if (!res.ok) throw new Error('http');
      json = await res.json();
    } catch {
      throw Object.assign(new Error('net'), { code: 'net' });
    }
    for (const x of parseWiki(json, lang)) if (!seen.has(x.title) && list.length < MAX_PLACES) seen.add(x.title), list.push(x);
  }
  return { at: now.toISOString(), lang, list };
}
