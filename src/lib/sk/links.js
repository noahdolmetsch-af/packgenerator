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
  // «Reise-Links» (Noah 19.10.2026 «1b 2b 3a 4a 5b»): stay, flight, getting there, abroad, bikepacking
  xbk: { label: 'Booking.com' },
  xab: { label: 'Airbnb' },
  xhw: { label: 'Hostelworld' },
  xfr: { label: 'Flightradar24' },
  xgf: { label: 'Google Flights' },
  xcar: { label: 'By car on Google Maps' },
  xr2r: { label: 'Rome2rio' },
  xeda: { label: 'Travel advice (FDFA)' },
  xwv: { label: 'Wikivoyage' },
  xws: { label: 'Warmshowers' },
  xsac: { label: 'Book a hut' },
  xtrk: { label: 'Live tracking', own: true },
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

/* ---------- «Reise-Links» (Noah 19.10.2026 «1b 2b 3a 4a 5b») ---------- */
// Only links with the place and the days filled in; no partner programme, no interface, no cost.

const isDay = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso ?? '');
/** A day plus n calendar days (YYYY-MM-DD, no time zone involved). */
export function plusDays(iso, n) {
  if (!isDay(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
/** The nights of a trip: check-in on the start day, check-out on the last day (at least one night). */
export function stayDays(trip) {
  const from = isDay(trip?.startDate) ? trip.startDate : '';
  return { from, to: from ? plusDays(from, Math.max(1, (Number(trip?.days) || 1) - 1)) : '' };
}
const dates = (pairs) => pairs.filter(([, v]) => v).map(([k, v]) => `${k}=${enc(v)}`);
const qs = (parts) => (parts.length ? `?${parts.join('&')}` : '');

/** Booking.com: places to stay at the trip's place for its nights. */
export function bookingUrl(place, from = '', to = '', lang = 'de') {
  const parts = [...(place?.name ? [`ss=${enc(place.name)}`] : []), ...dates([['checkin', from], ['checkout', to]]), 'group_adults=1', 'no_rooms=1'];
  return `https://www.booking.com/searchresults.${de(lang) ? 'de' : 'en-gb'}.html${qs(parts)}`;
}
/** Airbnb: homes at the trip's place for its nights. */
export function airbnbUrl(place, from = '', to = '') {
  const where = place?.name ? `/s/${enc(place.name)}/homes` : '/';
  return `https://www.airbnb.com${where}${qs([...dates([['checkin', from], ['checkout', to]]), ...(place?.name ? ['adults=1'] : [])])}`;
}
/** Hostelworld: hostels at the trip's place for its nights. */
export function hostelworldUrl(place, from = '', to = '') {
  if (!place?.name) return 'https://www.hostelworld.com/';
  return `https://www.hostelworld.com/pwa/s${qs([`q=${enc(place.name)}`, ...dates([['from', from], ['to', to]]), 'guests=1'])}`;
}

/** A flight number as airlines write it: «lx 1234» → «LX1234»; anything else → ''. */
export function flightNo(text) {
  const s = String(text ?? '').replace(/[\s-]/g, '').toUpperCase();
  return /^([A-Z]{2,3}|[A-Z]\d|\d[A-Z])\d{1,4}[A-Z]?$/.test(s) ? s : '';
}
/** Flightradar24: the flight by its number (live on the day). */
export const flightradarUrl = (no) => (flightNo(no) ? `https://www.flightradar24.com/data/flights/${flightNo(no).toLowerCase()}` : 'https://www.flightradar24.com/');
/** Google Flights: flights to the trip's place on its first day. */
export function googleFlightsUrl(place, day = '', lang = 'de') {
  const q = place?.name ? (de(lang) ? `Flüge nach ${place.name}${isDay(day) ? ` am ${day}` : ''}` : `Flights to ${place.name}${isDay(day) ? ` on ${day}` : ''}`) : '';
  return `https://www.google.com/travel/flights${q ? `?q=${enc(q)}&hl=${de(lang) ? 'de' : 'en'}` : ''}`;
}
/** Google Maps: the way by car to the trip's place (the free address form, no key). */
export function carUrl(place) {
  const p = ll(place);
  const to = p ? `${p.lat},${p.lon}` : place?.name ?? '';
  return to ? `https://www.google.com/maps/dir/?api=1&destination=${enc(to)}&travelmode=driving` : 'https://www.google.com/maps/';
}
/** Rome2rio: every way there (train, bus, ferry, flight), from home when known. */
export function rome2rioUrl(place, home = null) {
  if (!place?.name) return 'https://www.rome2rio.com/';
  return home?.name ? `https://www.rome2rio.com/s/${enc(home.name)}/${enc(place.name)}` : `https://www.rome2rio.com/s/${enc(place.name)}`;
}
/** The Swiss travel advice (FDFA) for every country. */
export const edaUrl = (lang = 'de') => (de(lang) ? 'https://www.eda.admin.ch/eda/de/home/vertretungen-und-reisehinweise.html' : 'https://www.eda.admin.ch/eda/en/home/representations-and-travel-advice.html');
/** Wikivoyage, the free travel guide: the trip's place. */
export function wikivoyageUrl(place, lang = 'de') {
  const host = `https://${de(lang) ? 'de' : 'en'}.wikivoyage.org`;
  return place?.name ? `${host}/w/index.php?search=${enc(place.name)}` : host;
}
/** Warmshowers: free hosts for touring cyclists. */
export const WARMSHOWERS_URL = 'https://www.warmshowers.org/';
/** The hut booking of the Swiss Alpine Club (and other clubs). */
export const HUT_URL = 'https://www.hut-reservation.org/';

/** Switzerland and Liechtenstein, roughly: a place outside gets the links for abroad. */
const CH = { s: 45.8, n: 47.9, w: 5.9, e: 10.6 };
export function abroad(place) {
  if (!place) return false;
  const c = String(place.detail ?? '').split(',').pop().trim().toLowerCase();
  if (c) return !['switzerland', 'schweiz', 'suisse', 'svizzera', 'liechtenstein'].includes(c);
  const p = ll(place);
  return p ? p.lat < CH.s || p.lat > CH.n || p.lon < CH.w || p.lon > CH.e : false;
}

/**
 * The travel links of one trip, in order, each only where it fits (Woanders format):
 * - stay (Booking, Airbnb, Hostelworld): a place and a night in a hotel or hut;
 * - flight: Flightradar24 with a flight number; Google Flights for a place abroad;
 * - by car to the place; abroad: Rome2rio, the travel advice, Wikivoyage;
 * - bikepacking: Warmshowers (bike trip with a night), hut booking (ski or hike with a hut night),
 *   live tracking (an event: your own link).
 * tx: t() for the short lines; fmt: how a day is written.
 */
export function travelLinks(trip, { home = null, lang = 'de', bike = false, mountain = false, tx = (s) => s, fmt = (iso) => iso } = {}) {
  const place = trip?.place ?? null;
  const { from, to } = stayDays(trip);
  const nights = (Number(trip?.days) || 1) > 1 || trip?.overnight === 'lodging';
  const lodging = trip?.overnight === 'lodging' || (trip?.overnight == null && nights);
  const out = [];
  const stay = from ? `${fmt(from)} – ${fmt(to)}` : '';
  if (place && lodging) {
    out.push({ kind: 'xbk', href: bookingUrl(place, from, to, lang), icon: 'bed', sub: stay });
    out.push({ kind: 'xab', href: airbnbUrl(place, from, to), icon: 'bed', sub: stay });
    out.push({ kind: 'xhw', href: hostelworldUrl(place, from, to), icon: 'bed', sub: stay });
  }
  if (flightNo(trip?.flight)) out.push({ kind: 'xfr', href: flightradarUrl(trip.flight), icon: 'plane', sub: flightNo(trip.flight) });
  const far = abroad(place);
  if (place && far) out.push({ kind: 'xgf', href: googleFlightsUrl(place, from, lang), icon: 'plane', sub: place.name });
  if (place) out.push({ kind: 'xcar', href: carUrl(place), icon: 'car', sub: place.name });
  if (place && far) {
    out.push({ kind: 'xr2r', href: rome2rioUrl(place, home), icon: 'route', sub: tx('All ways there') });
    out.push({ kind: 'xeda', href: edaUrl(lang), icon: 'shield', sub: tx('Safety and entry') });
    out.push({ kind: 'xwv', href: wikivoyageUrl(place, lang), icon: 'book', sub: place.name });
  }
  if (bike && nights) out.push({ kind: 'xws', href: WARMSHOWERS_URL, icon: 'home', sub: tx('Free hosts for cyclists') });
  if (mountain && lodging) out.push({ kind: 'xsac', href: HUT_URL, icon: 'mountain', sub: tx('SAC and other huts') });
  if (trip?.event === true && trip?.id != null) out.push({ kind: 'xtrk', slot: slotOf('xtrk', String(trip.id)), icon: 'pin', sub: tx('The race’s tracking page') });
  return out;
}

