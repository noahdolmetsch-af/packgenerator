/**
 * Paket U4 «Schlafplätze im Rennen» (Noah 20.10.2026 «1a 2a 3a 4a 5a», «6a 7a 8a»): where to sleep tonight
 * in a race. Pure helpers, tested in tests/race-sleep.test.js; the boxes are race/ride/SleepTonight.svelte,
 * CallHotels.svelte, NapTimer.svelte and race/NightsByWeather.svelte.
 *
 * - 1137 more roofs: the race places (outside.js) now hold bus stops with a roof, huts, station waiting
 *   rooms and bivouac boxes as kind 'shelter' with their sub kind; spotOf sorts them.
 * - 1138 «Wo schlafe ich heute?»: sleepOptions, the next places to sleep ahead with km and arrival.
 * - 1139 hotels late: eveningTarget, hotelsToCall and a ready sentence in the local language (lateText).
 * - 1140 power naps: napNeed.
 * - 1141 lists of others: own points of kind 'sleep' (a file or a link loaded under «Along the route»
 *   keeps its name as src) and your own spots of earlier races, with their stars (Paket Z: p.stars).
 * - 1142 spot quality: quality (roof, bed, water, WC, metres from the route) and the night's weather;
 *   roofs first when it rains, beds first when it is cold.
 * - 1143 open at night: 24/7 petrol stations, shops and stations; the app never says you may stay there.
 * - 1144 nights by the weather: nightsByWeather, a drier or warmer place for a planned night. Only a
 *   suggestion: the plan is not changed.
 */
import { distKm } from '../route.js';
import { snap, localOf } from './race.js';
import { parseHours, openAt, lowBetween } from './outside.js';
import { wxNear } from './ride-lib.js';

/** The kinds of places to sleep, in the order of the chips. name: English key for t(). */
export const SPOTS = [
  { key: 'hotel', name: 'Hotel and hostel', roof: true, bed: true },
  { key: 'camp', name: 'Campsite', roof: false, bed: false },
  { key: 'hut', name: 'Hut and shelter', roof: true, bed: false },
  { key: 'bus', name: 'Bus stop with a roof', roof: true, bed: false },
  { key: 'waiting', name: 'Station waiting room', roof: true, bed: false },
  { key: 'bivouac', name: 'Bivouac box', roof: true, bed: false },
  { key: 'night', name: 'Open at night', roof: null, bed: false },
  { key: 'own', name: 'My places to sleep', roof: null, bed: false },
  { key: 'list', name: 'From a list', roof: null, bed: false },
];
export const SPOT = Object.fromEntries(SPOTS.map((s) => [s.key, s]));
export const SPOT_KEYS = SPOTS.map((s) => s.key);

/** The kind of place to sleep of a race place (outside.js poisFrom), or null when it is none. */
export function spotOf(p) {
  if (!p) return null;
  if (p.kind === 'sleep') return ['camp_site', 'campground', 'caravan_site'].includes(p.sub) ? 'camp' : 'hotel';
  if (p.kind === 'shelter') return { bus_stop: 'bus', wilderness_hut: 'bivouac', waiting_room: 'waiting' }[p.sub] ?? 'hut';
  if (['fuel', 'shop', 'station'].includes(p.kind) && parseHours(p.hours)?.always) return 'night';
  return null;
}

/**
 * Own points of kind 'sleep' near the route (within maxOffKm), as places: your own spots ('own') and
 * the ones loaded from a list ('list', they keep the list name in src). stars and night come from
 * Paket Z (ownpoints.js), when they are there.
 */
export function ownSpots(own = [], pts = [], maxOffKm = 2) {
  if (pts.length < 2) return [];
  const out = [];
  for (const p of own) {
    if (p?.kind !== 'sleep' || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
    const s = snap(pts, p);
    if (s.offKm > maxOffKm) continue;
    out.push({ id: `own:${p.id}`, kind: 'own', spot: p.src ? 'list' : 'own', name: p.name, note: p.note ?? '', lat: p.lat, lon: p.lon, km: s.km, offKm: s.offKm, src: p.src ?? '', stars: Number(p.stars) || 0, night: p.night ?? '' });
  }
  return out;
}

const near = (p, pois, kinds, km) => pois.some((x) => kinds.includes(x.kind) && x !== p && Number.isFinite(x.lat) && distKm(p, x) <= km);

/**
 * 1142 · What a place offers: roof (true, false or null = check), bed, water and WC (in it or within
 * 400 m), metres from the route. Own spots say nothing by themselves (null).
 */
export function quality(p, pois = []) {
  const spot = p.spot ?? spotOf(p);
  const def = SPOT[spot] ?? {};
  const bed = !!def.bed;
  return {
    roof: def.roof ?? null,
    bed,
    water: bed || p.water === true || near(p, pois, ['water'], 0.4),
    wc: bed || spot === 'camp' || p.wc === true || near(p, pois, ['toilet'], 0.4),
    offM: Number.isFinite(p.offKm) ? Math.round(p.offKm * 1000) : null,
  };
}

/** The coldest hour and the highest rain chance of a forecast series between two moments. */
export function nightWx(series, from, to) {
  const h = series?.hourly;
  if (!h?.time?.length) return { low: null, rain: null };
  let rain = null;
  for (let i = 0; i < h.time.length; i++) {
    const ms = h.time[i] * 1000;
    const r = h.precipitation_probability?.[i];
    if (ms >= from && ms <= to && Number.isFinite(r)) rain = rain == null ? r : Math.max(rain, r);
  }
  return { low: lowBetween(series, from, to), rain };
}

/** The weather of tonight decides the order: 'rain' (≥ 50 %) → roofs first, 'cold' (below the bag) → beds first. */
export function nightMode({ rain, low }, bagC = 5) {
  if (Number.isFinite(rain) && rain >= 50) return 'rain';
  if (Number.isFinite(low) && low < (Number.isFinite(bagC) ? bagC : 5)) return 'cold';
  return null;
}

const NIGHT_H = 8;

/**
 * 1138 · The next places to sleep ahead of km: race places (hotels, campsites, roofs, open at night) and
 * own spots, within rangeKm, at most n. eta(km) → ms (the plan's pace from where you are), else kmh.
 * kinds: the spot kinds switched on (null = all). wx: the weather cache of the race (or null).
 * → { list: [{ ...place, spot, distKm, at, q, low, rain }], mode }
 */
export function sleepOptions({ pois = [], own = [], pts = [], km = 0, now = Date.now(), eta = null, kmh = 18, wx = null, kinds = null, rangeKm = 80, n = 8, bagC = 5 } = {}) {
  const on = (s) => !kinds || kinds.includes(s);
  const atOf = (k) => (eta ? eta(k) : now + (Math.max(0, k - km) / (kmh > 0 ? kmh : 18)) * 36e5);
  const places = [...pois.map((p) => ({ ...p, spot: spotOf(p) })), ...ownSpots(own, pts)].filter((p) => p.spot && on(p.spot) && Number.isFinite(p.km) && p.km >= km - 0.2 && p.km - km <= rangeKm);
  let list = places
    .sort((a, b) => a.km - b.km)
    .slice(0, 40)
    .map((p) => {
      const at = atOf(p.km);
      const w = nightWx(wxNear(wx, pts, p.km), at, at + NIGHT_H * 36e5);
      return { ...p, distKm: Math.round(Math.max(0, p.km - km) * 10) / 10, at, q: quality(p, pois), low: w.low, rain: w.rain };
    });
  const first = list[0] ?? null;
  const mode = first ? nightMode(first, bagC) : nightMode(nightWx(wxNear(wx, pts, km), now, now + NIGHT_H * 36e5), bagC);
  const rank = (p) => (mode === 'rain' ? (p.q.roof ? 0 : 1) : mode === 'cold' ? (p.q.bed ? 0 : p.q.roof ? 1 : 2) : 0);
  list = list.map((p, i) => ({ p, i })).sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i).map((x) => x.p);
  return { list: list.slice(0, n), mode };
}

/* ---------- 1139 · hotels late ---------- */

/**
 * Where you will be in the evening: the next planned night (within 24 h), else 21:00 today at your pace
 * (an hour from now when it is later). → { km, at, planned }
 */
export function eveningTarget({ plan = null, km = 0, now = Date.now(), kmh = 18 } = {}) {
  const b = plan?.blocks?.find((x) => x.kind === 'sleep' && x.from > now && x.from - now < 24 * 36e5);
  if (b && plan.kmAt) return { km: Math.round(plan.kmAt(b.from)), at: b.from, planned: true };
  const day = localOf(now).slice(0, 10);
  const nine = Date.parse(`${day}T21:00:00`);
  const at = Number.isFinite(nine) && nine > now + 36e5 ? nine : now + 36e5;
  return { km: Math.round(km + ((at - now) / 36e5) * (kmh > 0 ? kmh : 18)), at, planned: false };
}

/** The afternoon: from 12:00 local time (the box shows the hotels from then on). */
export const isAfternoon = (now) => Number(localOf(now).slice(11, 13)) >= 12;

/**
 * Hotels within rangeKm of the evening target, nearest first (at most n), with the arrival and what the
 * opening hours say then: open (closes), closed (late: call before you go) or unknown.
 */
export function hotelsToCall({ pois = [], target, eta = null, now = Date.now(), kmh = 18, km = 0, rangeKm = 15, n = 5 } = {}) {
  if (!target) return [];
  const atOf = (k) => (eta ? eta(k) : now + (Math.max(0, k - km) / (kmh > 0 ? kmh : 18)) * 36e5);
  return pois
    .filter((p) => spotOf(p) === 'hotel' && Number.isFinite(p.km) && p.km > km && Math.abs(p.km - target.km) <= rangeKm)
    .sort((a, b) => Math.abs(a.km - target.km) - Math.abs(b.km - target.km))
    .slice(0, n)
    .map((p) => {
      const at = atOf(p.km);
      const s = openAt(p.hours, new Date(at));
      return { ...p, at, open: s.open, closes: s.closes, late: s.open === false };
    });
}

/**
 * The language to ask in at a place: Swiss areas by a rough line (Ticino and the south of Graubünden
 * Italian, the west French), else by country. → 'de' | 'fr' | 'it' | 'en'
 */
export function langAt(lat, lon, country = '') {
  const c = String(country || '').toUpperCase();
  const LANG = { DE: 'de', AT: 'de', LI: 'de', FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', IT: 'it', SM: 'it' };
  if (LANG[c]) return LANG[c];
  if (c && c !== 'CH') return 'en';
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'en';
  const inCH = lat >= 45.8 && lat <= 47.81 && lon >= 5.95 && lon <= 10.5;
  if (inCH || c === 'CH') {
    if (lat < 46.45 && lon > 8.38) return 'it';
    if (lon < 7.1 || (lon < 7.35 && lat < 46.9 && lat > 46.2)) return 'fr';
    return 'de';
  }
  if (lat >= 47.27 && lat <= 55.06 && lon >= 5.87 && lon <= 15.04) return 'de';
  if (lat >= 46.37 && lat <= 49.02 && lon >= 9.53 && lon <= 17.16) return 'de';
  if (lat >= 36.6 && lat <= 46.4 && lon >= 6.62 && lon <= 18.52) return 'it';
  if (lat >= 42.33 && lat <= 51.09 && lon >= -4.8 && lon <= 8.23) return 'fr';
  return 'en';
}

/** The language names, in that language (shown with the sentence). */
export const LANG_NAME = { de: 'Deutsch', fr: 'Français', it: 'Italiano', en: 'English' };

/**
 * A ready sentence to call or write: you come late by bike. Not through t(): it is in the language of
 * the place, not of the app. time: 'HH:MM'.
 */
export function lateText(lang, time) {
  const T = {
    de: `Guten Tag, ich bin mit dem Velo unterwegs und komme heute spät an, etwa um ${time}. Haben Sie ein Zimmer für eine Person frei? Kann ich auch nach Schluss der Rezeption einchecken, zum Beispiel mit einem Code oder Schlüsselkasten? Mein Velo bräuchte einen geschützten Platz. Danke!`,
    fr: `Bonjour, je voyage à vélo et j'arriverai tard ce soir, vers ${time}. Avez-vous une chambre libre pour une personne ? Est-il possible d'arriver après la fermeture de la réception, par exemple avec un code ou une boîte à clés ? Mon vélo aurait besoin d'un endroit abrité. Merci !`,
    it: `Buongiorno, viaggio in bicicletta e arriverò tardi stasera, verso le ${time}. Avete una camera libera per una persona? È possibile arrivare dopo la chiusura della reception, per esempio con un codice o una cassetta per le chiavi? La mia bici avrebbe bisogno di un posto al riparo. Grazie!`,
    en: `Hello, I am travelling by bike and will arrive late tonight, around ${time}. Do you have a room for one person? Can I check in after the reception closes, for example with a code or a key box? My bike would need a sheltered place. Thank you!`,
  };
  return T[lang] ?? T.en;
}

/** A phone number for a tel: link (digits and a leading +). */
export const telOf = (phone) => String(phone ?? '').split(/[;,]/)[0].replace(/[^\d+]/g, '');

/* ---------- 1140 · power naps ---------- */

export const NAP_MIN = [10, 20, 30];

/**
 * When a nap would help: 'long' after afterH hours awake, 'night' between 2 and 5 at night after 60 % of
 * that. null otherwise. Only a suggestion.
 */
export function napNeed({ awakeH = 0, hour = 12, afterH = 18 } = {}) {
  const lim = Number(afterH) > 0 ? Number(afterH) : 18;
  if (awakeH >= lim) return 'long';
  if (hour >= 2 && hour < 5 && awakeH >= lim * 0.6) return 'night';
  return null;
}

/** Seconds left of a nap that ends at untilMs (0 when it is over, null without a nap). */
export const napLeft = (untilMs, now) => (Number.isFinite(untilMs) ? Math.max(0, Math.round((untilMs - now) / 1000)) : null);

/* ---------- 1144 · nights by the weather ---------- */

/**
 * For each planned night (nightRows: { n, km, from, to }) the weather where it is planned and, among the
 * weather points within rangeKm, the driest and least cold place, shifted in time by the ride there.
 * best is null when no place is clearly better (rain 25 points less, or 3 °C warmer without more rain).
 * → [{ n, km, low, rain, best: { km, low, rain, shiftKm, shiftH } | null }]
 */
export function nightsByWeather({ nights = [], wx = null, kmh = 18, rangeKm = 40, bagC = 5 } = {}) {
  const points = wx?.points ?? [];
  const series = wx?.series ?? [];
  if (!points.length) return [];
  const speed = kmh > 0 ? kmh : 18;
  const cold = (low) => (Number.isFinite(low) ? Math.max(0, (Number.isFinite(bagC) ? bagC : 5) - low) : 0);
  const score = (w) => (w.rain ?? 0) + 6 * cold(w.low);
  return nights
    .filter((n) => Number.isFinite(n.from) && Number.isFinite(n.to) && n.kind !== 'through')
    .map((n) => {
      const cands = points
        .map((p, i) => {
          const shiftKm = Math.round(p.km - n.km);
          const shiftH = shiftKm / speed;
          return { km: p.km, shiftKm, shiftH, ...nightWx(series[i], n.from + shiftH * 36e5, n.to + shiftH * 36e5) };
        })
        .filter((c) => Math.abs(c.shiftKm) <= rangeKm && (c.low != null || c.rain != null));
      if (!cands.length) return { n: n.n, km: n.km, low: null, rain: null, best: null };
      const here = cands.reduce((a, b) => (Math.abs(b.shiftKm) < Math.abs(a.shiftKm) ? b : a));
      const top = cands.reduce((a, b) => (score(b) < score(a) ? b : a));
      const better = top !== here && (((here.rain ?? 0) - (top.rain ?? 0) >= 25) || (Number.isFinite(here.low) && Number.isFinite(top.low) && top.low - here.low >= 3 && (top.rain ?? 0) <= (here.rain ?? 0) + 10));
      return { n: n.n, km: n.km, low: here.low, rain: here.rain, best: better ? { km: Math.round(top.km), low: top.low, rain: top.rain, shiftKm: top.shiftKm, shiftH: top.shiftH } : null };
    });
}
