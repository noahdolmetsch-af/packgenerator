/**
 * SK «Links nach aussen» (DG-X1 … DG-X16, Noah 13.10.2026 «SK7–SKX5 freigegeben»). Only links: nothing
 * is embedded, no interface is called, and the app sends nothing to these sites except what stands in
 * the link (a place, a date). Every link opens in a new tab. Pure and tested (tests/sk.test.js).
 */

/** The kinds of outside links (X1 … X16), with the label they carry. own: a link you type in yourself. */
export const LINKS = {
  x1: { label: 'Maker’s instructions', own: true },
  x2s: { label: 'Open in Strava' },
  x2k: { label: 'Open in komoot' },
  x3m: { label: 'MeteoSwiss' },
  x3s: { label: 'SBB' },
  x4s: { label: 'Strava' },
  x4g: { label: 'GotCourts' },
  x5: { label: 'Guide at Park Tool' },
  x6: { label: 'Avalanche bulletin' },
  x7: { label: 'View in the shop', own: true },
  x8: { label: 'My music', own: true },
  x9: { label: 'Maker and warranty', own: true },
  x10: { label: 'swisstopo map' },
  x11: { label: 'Bike shop nearby' },
  x12: { label: 'SchweizMobil' },
  x13: { label: 'Repair|link' },
  x14: { label: 'Photo album', own: true },
  x15: { label: 'Workshop booking', own: true },
  x16: { label: 'Wind on Windy' },
  bp: { label: 'bikepacking.com' },
};

/** The settings records: own links by slot, and the kinds you switched off («Diesen Link nicht mehr zeigen»). */
export const LINKS_KEY = 'sk.links';
export const OFF_KEY = 'sk.off';

/** The slot of an own link: its kind and the thing it belongs to, e.g. 'x9:bike-1'. */
export const slotOf = (kind, thing = '') => (thing ? `${kind}:${thing}` : kind);

/**
 * A typed address as a safe link, or null. Only http and https; «example.org/x» gets https:// in front.
 * javascript:, data:, file: and the like are refused.
 */
export function safeUrl(text) {
  let s = String(text ?? '').trim();
  if (!s || /\s/.test(s)) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    if (!/^[\w-]+(\.[\w-]+)+([/?#:]|$)/.test(s)) return null;
    s = `https://${s}`;
  }
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (!u.hostname || u.username || u.password) return null;
  return u.href;
}

const enc = encodeURIComponent;
/** A place's coordinates, rounded (about 100 m): enough for a map, no more. */
const ll = (p) => (p && Number.isFinite(p.lat) && Number.isFinite(p.lon) ? { lat: Math.round(p.lat * 1000) / 1000, lon: Math.round(p.lon * 1000) / 1000 } : null);
/** A day YYYY-MM-DD as the Swiss timetable writes it: 24.10.2026. */
const chDate = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(iso ?? '') ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '');
const de = (lang) => lang !== 'en';

/** X10: the place on the national map (map.geo.admin.ch searches the name). */
export const swisstopoUrl = (place) => (place?.name ? `https://map.geo.admin.ch/?swisssearch=${enc(place.name)}` : 'https://map.geo.admin.ch/');

/** X3: the MeteoSwiss forecast map (no place is sent). */
export const meteoUrl = (lang = 'de') => (de(lang) ? 'https://www.meteoschweiz.admin.ch/' : 'https://www.meteoswiss.admin.ch/');

/** X3: the SBB timetable to the start place on the trip's day. */
export function sbbUrl(place, day, lang = 'de') {
  const q = [place?.name ? `nach=${enc(place.name)}` : '', chDate(day) ? `datum=${enc(chDate(day))}` : ''].filter(Boolean).join('&');
  return `https://www.sbb.ch/${de(lang) ? 'de' : 'en'}/kaufen/pages/fahrplan/fahrplan.xhtml${q ? `?${q}` : ''}`;
}

/** X12: the official cycling routes of Switzerland. */
export const schweizMobilUrl = (lang = 'de') => (de(lang) ? 'https://schweizmobil.ch/de/veloland' : 'https://schweizmobil.ch/en/cycling-in-switzerland');

/** X2: one ride in Strava (its id from the ride ledger), else your training log there. */
export const stravaRideUrl = (id) => (/^\d+$/.test(String(id ?? '')) ? `https://www.strava.com/activities/${id}` : 'https://www.strava.com/athlete/training');

/** X2: komoot's planner at the trip's start place. */
export function komootUrl(place) {
  const p = ll(place);
  return p ? `https://www.komoot.com/plan/@${p.lat},${p.lon},12z` : 'https://www.komoot.com/';
}

/** X4: Strava (your dashboard) and GotCourts (court booking). */
export const STRAVA_URL = 'https://www.strava.com/dashboard';
export const GOTCOURTS_URL = 'https://www.gotcourts.com/';
/** bikepacking.com routes (Vergangene Touren, Velos; DG-W3). */
export const BIKEPACKING_URL = 'https://bikepacking.com/routes/';

/** X5: Park Tool's repair help (English). */
export const PARKTOOL_URL = 'https://www.parktool.com/en-us/blog/repair-help';

/** X6: the official SLF avalanche bulletin; a link only, nothing embedded or fetched. */
export const slfUrl = (lang = 'de') => (de(lang) ? 'https://www.slf.ch/de/lawinenbulletin-und-schneesituation/' : 'https://www.slf.ch/en/avalanche-bulletin-and-snow-situation/');

/** X13: repair guides at iFixit for this thing (its brand and model, or its name). */
export function ifixitUrl(item) {
  const q = [item?.brand, item?.model].filter(Boolean).join(' ') || item?.name || '';
  return q ? `https://www.ifixit.com/Search?query=${enc(q)}` : 'https://www.ifixit.com/';
}

/** X11: bike shops around where you are (the place is asked for only when the button is tapped). */
export function bikeShopsUrl(pos, lang = 'de') {
  const what = enc(de(lang) ? 'Veloladen' : 'bike shop');
  const p = ll(pos);
  return p ? `https://www.google.com/maps/search/${what}/@${p.lat},${p.lon},14z` : `https://www.google.com/maps/search/${what}`;
}

/** X16: the wind map around the trip's place. */
export function windyUrl(place) {
  const p = ll(place);
  return p ? `https://www.windy.com/?wind,${p.lat},${p.lon},9` : 'https://www.windy.com/';
}

/** The link's kind is on unless switched off. */
export const linkOn = (off, kind) => !(Array.isArray(off) && off.includes(kind));
