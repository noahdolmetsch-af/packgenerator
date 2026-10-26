/**
 * Paket Y «Webcams» (Noah 20.10.2026 «unbedingt»): «Meine Webcams» on the weather page. You add any webcam
 * with a name and its address: a plain image address (.jpg, .png, .webp …) shows as a live picture, any
 * other page opens with a tap. One can be your home cam (shown small on Heute, Noah «1a»).
 *
 * Private: the list lives only on this device (db.js DEVICE_SETTINGS 'webcams'), never synced and never in
 * the repo. A cam behind a login (e.g. a private home cam) is only opened, the app never stores a password.
 * For webcams along a route or at a destination the app links to bergfex (opened, never read).
 * A cam can have a place (optional, from the place search): then it shows as a point on the live map
 * (under «My points»), and a tap there shows its picture (Paket Wetter «Webcams auf der Live-Karte»).
 * Pure functions, tested in tests/wetter-webcams.test.js.
 */

export const WEBCAMS_KEY = 'webcams';
export const NAME_MAX = 60;
export const BERGFEX = 'https://www.bergfex.ch/schweiz/webcams/';
/** Pass roads open or closed (official road information, opened). */
export const PASSES = 'https://www.alpen-paesse.ch/de/';
/** A picture is fetched anew at most this often (minutes). */
export const REFRESH_MIN = 5;

const IMG = /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i;

/** A web address the app may open (https, or http for old cams); else null. */
export function cleanUrl(s) {
  const v = String(s ?? '').trim();
  if (!v) return null;
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(v) ? v : `https://${v}`);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!u.hostname.includes('.')) return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Does the address show a picture (then it shows inline, else it opens)? */
export const isImage = (url) => IMG.test(String(url ?? ''));

/** A place made safe: { name, lat, lon } or null. */
export function placeOf(p) {
  const lat = Number(p?.lat);
  const lon = Number(p?.lon);
  if (p == null || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) return null;
  return { name: String(p.name ?? '').slice(0, NAME_MAX), lat, lon };
}

/** The stored value made safe: [{ id, name, url, home, place? }]. */
export function camsOf(value) {
  const list = Array.isArray(value) ? value : [];
  return list
    .filter((c) => c && typeof c === 'object' && cleanUrl(c.url))
    .map((c) => {
      const place = placeOf(c.place);
      const why = String(c.why ?? '').trim().slice(0, 80);
      const seen = /^\d{4}-\d{2}-\d{2}$/.test(c.seen ?? '') ? c.seen : '';
      return { id: String(c.id ?? ''), name: String(c.name ?? '').slice(0, NAME_MAX), url: cleanUrl(c.url), home: c.home === true, ...(place ? { place } : {}), ...(why ? { why } : {}), ...(seen ? { seen } : {}) };
    })
    .filter((c) => c.id);
}

export const camId = (now = Date.now()) => `cam-${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Add a cam; the first one with home=true makes the others not home. */
export function addCam(list, { name = '', url = '', home = false }, now = Date.now()) {
  const u = cleanUrl(url);
  if (!u) return list;
  const cam = { id: camId(now), name: String(name).trim().slice(0, NAME_MAX), url: u, home: !!home };
  return [...(home ? list.map((c) => ({ ...c, home: false })) : list), cam];
}
export const renameCam = (list, id, name) => list.map((c) => (c.id === id ? { ...c, name: String(name).trim().slice(0, NAME_MAX) } : c));
export const removeCam = (list, id) => list.filter((c) => c.id !== id);
export const setHome = (list, id) => list.map((c) => ({ ...c, home: c.id === id ? !c.home : false }));
export function moveCam(list, from, to) {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return list;
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}
export const homeCam = (list = []) => list.find((c) => c.home) ?? null;
/** Give a cam a place, or take it away (null). */
export function setPlace(list, id, place) {
  const p = placeOf(place);
  return list.map((c) => {
    if (c.id !== id) return c;
    const { place: _old, ...rest } = c;
    return p ? { ...rest, place: p } : rest;
  });
}
/** The cams with a place as live-map points ({ id: 'cam-…', kind: 'webcam' }). */
export const camsOnMap = (value) =>
  camsOf(value)
    .filter((c) => c.place)
    .map((c) => ({ id: c.id.startsWith('cam-') ? c.id : `cam-${c.id}`, cam: c.id, lat: c.place.lat, lon: c.place.lon, kind: 'webcam', name: camLabel(c), minZoom: 0 }));

/** The picture address with a time mark, so the browser fetches it anew every REFRESH_MIN minutes. */
export function freshSrc(url, now = Date.now()) {
  const slot = Math.floor(now / (REFRESH_MIN * 6e4));
  return `${url}${url.includes('?') ? '&' : '?'}pg=${slot}`;
}
/** A label for a cam without a name: its host. */
export const camLabel = (c) => c.name || (() => {
  try {
    return new URL(c.url).hostname.replace(/^www\./, '');
  } catch {
    return 'Webcam';
  }
})();

/** Paket A, UC-109-I1 «Kamera mit Nutzungsgrund»: what you look at a cam for ('' clears it). */
export function setWhy(list, id, why) {
  const w = String(why ?? '').trim().slice(0, 80);
  return list.map((c) => {
    if (c.id !== id) return c;
    const { why: _old, ...rest } = c;
    return w ? { ...rest, why: w } : rest;
  });
}
/** The day a cam was last opened (on a tap of its name). */
export const markSeen = (list, id, today) => list.map((c) => (c.id === id ? { ...c, seen: today } : c));
/** Paket A, UC-109-I2 «Vergessene Links pflegen»: cams not opened for STALE_DAYS days, for a rare tidy-up. */
export const STALE_DAYS = 120;
export function staleCams(list, today) {
  const limit = new Date(Date.parse(`${today}T12:00:00Z`) - STALE_DAYS * 864e5).toISOString().slice(0, 10);
  return list.filter((c) => c.seen && c.seen <= limit);
}
