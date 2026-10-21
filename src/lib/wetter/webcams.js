/**
 * Paket Y «Webcams» (Noah 20.10.2026 «unbedingt»): «Meine Webcams» on the weather page. You add any webcam
 * with a name and its address: a plain image address (.jpg, .png, .webp …) shows as a live picture, any
 * other page opens with a tap. One can be your home cam (shown small on Heute, Noah «1a»).
 *
 * Private: the list lives only on this device (db.js DEVICE_SETTINGS 'webcams'), never synced and never in
 * the repo. A cam behind a login (e.g. a private home cam) is only opened, the app never stores a password.
 * For webcams along a route or at a destination the app links to bergfex (opened, never read).
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

/** The stored value made safe: [{ id, name, url, home }]. */
export function camsOf(value) {
  const list = Array.isArray(value) ? value : [];
  return list
    .filter((c) => c && typeof c === 'object' && cleanUrl(c.url))
    .map((c) => ({ id: String(c.id ?? ''), name: String(c.name ?? '').slice(0, NAME_MAX), url: cleanUrl(c.url), home: c.home === true }))
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
