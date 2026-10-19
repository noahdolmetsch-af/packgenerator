/**
 * Paket U «Rennen»: the free data from outside (0 Kosten, no key, fair use; one request per tap).
 *
 * - OpenStreetMap through Overpass: shops, petrol stations, water, stations and places to sleep along
 *   the route (2, 8, 19, 27). Opening hours are OSM's `opening_hours` (often missing: then «unknown»).
 * - Open-Meteo: the forecast at points along the route for the hour you are expected there (5, 9, 30).
 * - transport.opendata.ch: the next train from a station near the route to your home place (8).
 *
 * The answers are kept on this device only (meta table, not in the backup): POI_CACHE + tripId.
 * Pure parsers are tested in tests/race.test.js; the fetchers take a fetcher for tests.
 */
import { snap } from './race.js';

export const OVERPASS = 'https://overpass-api.de/api/interpreter';
export const POI_CACHE = 'race-poi:';
export const WX_CACHE = 'race-wx:';

/** The kinds of places, with the OSM tags that make them. */
export const POI_KINDS = [
  { key: 'shop', name: 'Shop', icon: 'cart' },
  { key: 'food', name: 'Restaurant', icon: 'food' },
  { key: 'fuel', name: 'Petrol station', icon: 'fuel' },
  { key: 'water', name: 'Water', icon: 'droplet' },
  { key: 'sleep', name: 'Place to sleep', icon: 'bed' },
  { key: 'bike', name: 'Bike shop', icon: 'bike' },
  { key: 'station', name: 'Station', icon: 'train' },
  { key: 'shelter', name: 'Shelter', icon: 'home' },
  { key: 'laundry', name: 'Laundry', icon: 'shirt' },
  { key: 'depot', name: 'Depot', icon: 'package' },
  { key: 'startfinish', name: 'Start and finish', icon: 'flag' },
  { key: 'other', name: 'Other stop', icon: 'pin' },
];
export const POI_KIND = Object.fromEntries(POI_KINDS.map((k) => [k.key, k]));

/** The Overpass query for a corridor of `m` metres around the route (the line every few points). */
export function poiQuery(pts, m = 1500) {
  const line = thinFor(pts, 120)
    .map((p) => `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`)
    .join(',');
  const a = `(around:${m},${line})`;
  const s = `(around:${Math.round(m * 2.5)},${line})`;
  return `[out:json][timeout:60];(
node["shop"~"^(supermarket|convenience|bakery|kiosk|general|deli)$"]${a};
node["amenity"="fuel"]${a};
node["amenity"~"^(restaurant|fast_food|cafe)$"]${a};
node["shop"="bicycle"]${s};
node["amenity"="shelter"]${a};
node["shop"="laundry"]${s};
node["amenity"="laundry"]${s};
node["amenity"="drinking_water"]${a};
node["amenity"="fountain"]["drinking_water"="yes"]${a};
node["man_made"="water_tap"]["drinking_water"!="no"]${a};
node["railway"="station"]${s};
node["tourism"~"^(hotel|guest_house|hostel|camp_site|alpine_hut|motel)$"]${s};
way["tourism"~"^(hotel|guest_house|hostel|camp_site|alpine_hut)$"]${s};
);out center tags;`;
}
const thinFor = (pts, n) => (pts.length <= n ? pts : Array.from({ length: n }, (_, i) => pts[Math.round((i * (pts.length - 1)) / (n - 1))]));

/** The kind of an OSM element, or null. */
export function kindOf(tags = {}) {
  if (tags.shop === 'bicycle') return 'bike';
  if (tags.shop === 'laundry' || tags.amenity === 'laundry') return 'laundry';
  if (tags.shop) return 'shop';
  if (tags.amenity === 'fuel') return 'fuel';
  if (['restaurant', 'fast_food', 'cafe'].includes(tags.amenity)) return 'food';
  if (tags.amenity === 'shelter') return 'shelter';
  if (tags.amenity === 'drinking_water' || tags.amenity === 'fountain' || tags.man_made === 'water_tap') return 'water';
  if (tags.railway === 'station') return 'station';
  if (tags.tourism) return 'sleep';
  return null;
}

/** Overpass JSON → places along the route: [{ id, kind, name, lat, lon, km, offKm, hours, sub }], by km. */
export function poisFrom(json, pts) {
  const out = [];
  for (const e of json?.elements ?? []) {
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    const kind = kindOf(e.tags);
    if (!kind || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const s = snap(pts, { lat, lon });
    out.push({ id: `${e.type}/${e.id}`, kind, name: e.tags.name || e.tags.brand || '', lat, lon, km: s.km, offKm: s.offKm, hours: e.tags.opening_hours || '', sub: e.tags.shop || e.tags.tourism || e.tags.amenity || '', phone: e.tags.phone || e.tags['contact:phone'] || '' });
  }
  return out.sort((a, b) => a.km - b.km);
}

/** Fetch the places (throws with a plain reason). */
export async function fetchPois(pts, fetcher = fetch) {
  const res = await fetcher(OVERPASS, { method: 'POST', body: `data=${encodeURIComponent(poiQuery(pts))}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) throw new Error(res.status === 429 ? 'busy' : 'failed');
  return poisFrom(await res.json(), pts);
}

/* ---------- opening hours (the usual OSM forms; anything else = unknown) ---------- */

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Parse «Mo-Fr 08:00-18:30; Sa 08:00-16:00; Su off», «24/7», «Mo-Sa 07:00-12:00,13:30-18:30».
 * → { always: true } | { days: [[{ from, to }]] (index 0 = Monday) } | null (not understood)
 */
export function parseHours(s = '') {
  const str = String(s).trim();
  if (!str) return null;
  if (/^24\/7$/.test(str)) return { always: true };
  const days = Array.from({ length: 7 }, () => null);
  let any = false;
  for (const raw of str.split(';')) {
    const part = raw.trim();
    if (!part || /^PH\b/.test(part)) continue;
    const m = part.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?)+)?\s*(.*)$/);
    if (!m) return null;
    const sel = m[1] ? m[1].split(',').filter(Boolean) : ['Mo-Su'];
    const what = m[2].trim();
    const idx = [];
    for (const d of sel) {
      const [a, b] = d.split('-');
      const i = DAYS.indexOf(a);
      const j = b ? DAYS.indexOf(b) : i;
      if (i < 0 || j < 0) return null;
      for (let k = i; ; k = (k + 1) % 7) {
        idx.push(k);
        if (k === j) break;
      }
    }
    let spans;
    if (/^(off|closed)$/i.test(what)) spans = [];
    else {
      spans = [];
      for (const r of what.split(',')) {
        const t = r.trim().match(/^(\d\d?:\d\d)-(\d\d?:\d\d)$/);
        if (!t) return null;
        spans.push({ from: toMin(t[1]), to: toMin(t[2]) <= toMin(t[1]) ? toMin(t[2]) + 1440 : toMin(t[2]) });
      }
    }
    for (const k of idx) days[k] = spans;
    any = true;
  }
  if (!any) return null;
  return { days: days.map((d) => d ?? []) };
}

/**
 * Open at a moment (a Date in local time)? → { open: true|false|null, closes: 'HH:MM'|null, opens: 'HH:MM'|null }
 * null = we do not know (no hours or not understood). opens: the next opening on that day or the next.
 */
export function openAt(hours, date) {
  const p = typeof hours === 'string' ? parseHours(hours) : hours;
  if (!p) return { open: null, closes: null, opens: null };
  if (p.always) return { open: true, closes: null, opens: null };
  const wd = (date.getDay() + 6) % 7;
  const min = date.getHours() * 60 + date.getMinutes();
  const fmt = (m) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  // yesterday's span past midnight
  for (const s of p.days[(wd + 6) % 7]) if (s.to > 1440 && min < s.to - 1440) return { open: true, closes: fmt(s.to), opens: null };
  for (const s of p.days[wd]) if (min >= s.from && min < s.to) return { open: true, closes: fmt(s.to), opens: null };
  const later = p.days[wd].find((s) => s.from > min);
  if (later) return { open: false, closes: null, opens: fmt(later.from) };
  for (let k = 1; k <= 7; k++) {
    const s = p.days[(wd + k) % 7][0];
    if (s) return { open: false, closes: null, opens: fmt(s.from), inDays: k };
  }
  return { open: false, closes: null, opens: null };
}

/**
 * 2 · The next place to buy food from km `fromKm` on, with its state when you get there (eta(km) → ms).
 * kinds: shop and fuel. → { poi, km: distance, at, state } or null
 */
export function nextSupply(pois = [], fromKm, eta, kinds = ['shop', 'fuel']) {
  const list = pois.filter((p) => kinds.includes(p.kind) && p.km >= fromKm);
  for (const p of list) {
    const at = eta ? eta(p.km) : null;
    const state = at ? openAt(p.hours, new Date(at)) : { open: null };
    if (state.open !== false) return { poi: p, km: Math.round((p.km - fromKm) * 10) / 10, at, state };
  }
  return list[0] ? { poi: list[0], km: Math.round((list[0].km - fromKm) * 10) / 10, at: eta ? eta(list[0].km) : null, state: { open: false } } : null;
}

/**
 * 19 · Trockenstrecken: stretches longer than maxKm without water (water, shops and petrol stations count;
 * a shop only when it is open when you get there, if we know). → [{ fromKm, toKm, km }]
 */
export function dryStretches(pois = [], totalKm, maxKm = 60, eta = null) {
  const wet = pois
    .filter((p) => p.kind === 'water' || ((p.kind === 'shop' || p.kind === 'fuel') && (!eta || openAt(p.hours, new Date(eta(p.km))).open !== false)))
    .map((p) => p.km)
    .sort((a, b) => a - b);
  const pts = [0, ...wet, totalKm];
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i] - pts[i - 1];
    if (d > maxKm) out.push({ fromKm: Math.round(pts[i - 1]), toKm: Math.round(pts[i]), km: Math.round(d) });
  }
  return out;
}

/** 27 · Places to sleep within ±rangeKm of a km (a planned night), nearest first. */
export const sleepNear = (pois = [], km, rangeKm = 20) =>
  pois
    .filter((p) => p.kind === 'sleep' && Math.abs(p.km - km) <= rangeKm)
    .sort((a, b) => Math.abs(a.km - km) - Math.abs(b.km - km))
    .slice(0, 6);

/** 8 · Stations along the route, at most one every `everyKm` (the one closest to the route). */
export function exitStations(pois = [], everyKm = 15) {
  const st = pois.filter((p) => p.kind === 'station' && p.name);
  const out = [];
  for (const p of st) {
    const last = out.at(-1);
    if (last && p.km - last.km < everyKm) {
      if (p.offKm < last.offKm) out[out.length - 1] = p;
    } else out.push(p);
  }
  return out;
}

/* ---------- trains (8) ---------- */

/** The next train from a station to home → { dep, arr, transfers, duration } or null (throws on a network error). */
export async function nextTrain(from, to, fetcher = fetch, when = null) {
  const q = new URLSearchParams({ from, to, limit: '1' });
  if (when) {
    q.set('date', when.slice(0, 10));
    q.set('time', when.slice(11, 16));
  }
  const res = await fetcher(`https://transport.opendata.ch/v1/connections?${q}`);
  if (!res.ok) throw new Error('failed');
  return trainFrom(await res.json());
}
export function trainFrom(json) {
  const c = json?.connections?.[0];
  if (!c?.from?.departure) return null;
  return { dep: c.from.departure, arr: c.to?.arrival ?? null, transfers: c.transfers ?? 0, duration: c.duration ?? '', from: c.from.station?.name ?? '', to: c.to?.station?.name ?? '' };
}

/* ---------- weather along the route (5, 9, 30) ---------- */

/**
 * One request for up to 12 points: hourly temperature, wind, rain chance and UV, daily UV max (UTC times).
 * points: [{ lat, lon }] → [{ hourly: { time: [s], temperature_2m, wind_speed_10m, wind_direction_10m, precipitation_probability, uv_index }, daily }]
 */
export async function fetchRouteWx(points, fetcher = fetch) {
  if (!points.length) return [];
  const q = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(3)).join(','),
    longitude: points.map((p) => p.lon.toFixed(3)).join(','),
    hourly: 'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,precipitation_probability,uv_index',
    daily: 'uv_index_max',
    forecast_days: '16',
    timezone: 'UTC',
    timeformat: 'unixtime',
  });
  const res = await fetcher(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!res.ok) throw new Error('failed');
  const j = await res.json();
  return Array.isArray(j) ? j : [j];
}

/** The forecast hour closest to ms at one point (null when the hour is outside the forecast). */
export function wxAt(series, ms) {
  const h = series?.hourly;
  if (!h?.time?.length) return null;
  const s = ms / 1000;
  if (s < h.time[0] - 1800 || s > h.time.at(-1) + 1800) return null;
  let i = 0;
  for (let k = 1; k < h.time.length; k++) if (Math.abs(h.time[k] - s) < Math.abs(h.time[i] - s)) i = k;
  return { temp: h.temperature_2m?.[i] ?? null, feels: h.apparent_temperature?.[i] ?? null, wind: h.wind_speed_10m?.[i] ?? null, windDir: h.wind_direction_10m?.[i] ?? null, rain: h.precipitation_probability?.[i] ?? null, uv: h.uv_index?.[i] ?? null };
}

/** The lowest temperature at a point between two moments (a night), or null. */
export function lowBetween(series, from, to) {
  const h = series?.hourly;
  if (!h?.time?.length) return null;
  let low = null;
  for (let i = 0; i < h.time.length; i++) {
    const ms = h.time[i] * 1000;
    if (ms >= from && ms <= to && Number.isFinite(h.temperature_2m?.[i])) low = low == null ? h.temperature_2m[i] : Math.min(low, h.temperature_2m[i]);
  }
  return low;
}

/**
 * 5 · What to wear and drink for a forecast hour. → English keys
 * (cold < 8, cool < 15, warm ≥ 25, hot ≥ 30, rain ≥ 50 %, wind ≥ 30 km/h).
 */
export function wxAdvice(w) {
  if (!w) return [];
  const out = [];
  const t = w.feels ?? w.temp;
  if (t != null && t < 3) out.push('Winter gloves, overshoes, a warm layer under the jacket');
  else if (t != null && t < 8) out.push('Long gloves, leg and arm warmers, a warm layer');
  else if (t != null && t < 15) out.push('Arm warmers and a wind vest');
  if (t != null && t >= 30) out.push('Very hot: 1 litre per hour, salt, shade at midday');
  else if (t != null && t >= 25) out.push('Warm: fill both bottles, drink every 15 minutes');
  if (w.rain != null && w.rain >= 50) out.push('Rain likely: rain jacket on top, dry socks in a bag');
  if (w.wind != null && w.wind >= 30) out.push('Strong wind: windproof layer, plan slower');
  if (!out.length) out.push('Normal clothes; one bottle per 2 hours');
  return out;
}

/** 30 · Sun protection for a UV index (WHO scale). → { level, key } */
export function uvAdvice(uv) {
  if (!Number.isFinite(uv)) return null;
  if (uv >= 8) return { level: 'very high', key: 'Very high UV: sun cream factor 50 every 2 hours, neck and ears, sunglasses, long sleeves at midday' };
  if (uv >= 6) return { level: 'high', key: 'High UV: sun cream factor 50 in the morning and at midday, lips and ears too' };
  if (uv >= 3) return { level: 'moderate', key: 'Moderate UV: sun cream in the morning, again after sweating' };
  return { level: 'low', key: 'Low UV: no extra sun protection needed' };
}

/** A wind direction in degrees as N, NE, E … (where the wind comes from). */
export const compass = (deg) => (Number.isFinite(deg) ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(((deg % 360) + 360) % 360 / 45) % 8] : '');
