/**
 * «Neue Quellen» › «ÖV in der Nähe» (Noah 20.10.2026): stops near a place and their next departures, for
 * the live map. The pure parts of /api/lake?action=ov-stops and ?action=ov-departures, kept free of Node so
 * the app can ask the source directly with the same code when its server does not answer.
 *
 * Source: transport.opendata.ch (the Swiss public transport API of opendata.ch, data of the SBB timetable,
 * free, no key, no account). Chosen over the OJP 2.0 API of opentransportdata.swiss, which needs a key
 * (an account, a variable on the server) and answers in XML; this one answers in JSON. Fair use: one
 * request per tap, answers cached on the server (stops 1 h, departures 30 s).
 *   GET /v1/locations?x={lat}&y={lon}&type=station
 *     → { stations: [ { id, name, coordinate: { x: lat, y: lon }, distance (m), icon } ] }
 *       (careful: in this API x is the latitude and y the longitude)
 *   GET /v1/stationboard?id={id}&limit={n}
 *     → { station: { id, name }, stationboard: [ { category, number, to, operator,
 *         stop: { departure, departureTimestamp, delay, platform, prognosis: { platform, departure } } } ] }
 * Only the position rounded to about 100 m leaves the device. Times are shown in Europe/Zurich.
 */

export const OV_BASE = 'https://transport.opendata.ch/v1';
export const OV_TIMEOUT_MS = 8000;
export const MAX_STOPS = 10;
export const MAX_DEPARTURES = 12;

const r3 = (v) => Math.round(v * 1000) / 1000;
const r5 = (v) => Math.round(v * 1e5) / 1e5;
const str = (v) => String(v ?? '').trim();
/** A number, or NaN for null, '' and junk (Number(null) would be 0). */
const num = (v) => (v == null || v === '' ? NaN : Number(v));
const okLat = (v) => Number.isFinite(v) && Math.abs(v) <= 90;
const okLon = (v) => Number.isFinite(v) && Math.abs(v) <= 180;

/** Distance between two points in metres (haversine). */
export function distM(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(h)));
}

/** The stops address for a place (rounded to about 100 m), '' for a broken place. */
export function stopsUrl(lat, lon) {
  const la = num(lat);
  const lo = num(lon);
  if (!okLat(la) || !okLon(lo)) return '';
  return `${OV_BASE}/locations?x=${r3(la)}&y=${r3(lo)}&type=station`;
}

/** A stop id: digits only (Didok / UIC numbers like 8503000). */
export const okStopId = (id) => /^\d{3,10}$/.test(String(id ?? ''));

/** The departures address of a stop, '' for a broken id. */
export function boardUrl(id, limit = MAX_DEPARTURES) {
  if (!okStopId(id)) return '';
  const n = Math.max(1, Math.min(30, Math.round(Number(limit) || MAX_DEPARTURES)));
  return `${OV_BASE}/stationboard?id=${id}&limit=${n}`;
}

/** The kind of a stop from the API's icon: 'train' | 'tram' | 'bus' | 'ship' | 'cableway' | 'stop'. */
export function stopKind(icon) {
  const i = str(icon).toLowerCase();
  if (/train|rail/.test(i)) return 'train';
  if (/tram/.test(i)) return 'tram';
  if (/bus/.test(i)) return 'bus';
  if (/ship|boat/.test(i)) return 'ship';
  if (/cable|gondola|funicular|chair/.test(i)) return 'cableway';
  return 'stop';
}

/**
 * The locations answer → [{ id, name, lat, lon, distM, kind }], nearest first, at most max. from: the place
 * asked for (the distance is counted from it; the API's own distance is used when there is no from).
 */
export function parseStops(json, from = null, max = MAX_STOPS) {
  const list = Array.isArray(json?.stations) ? json.stations : [];
  const seen = new Set();
  const out = [];
  for (const s of list) {
    const id = str(s?.id);
    const lat = num(s?.coordinate?.x);
    const lon = num(s?.coordinate?.y);
    if (!okStopId(id) || seen.has(id) || !okLat(lat) || !okLon(lon) || !str(s?.name)) continue;
    seen.add(id);
    const api = num(s?.distance);
    const d = from && okLat(num(from.lat)) && okLon(num(from.lon)) ? distM({ lat: Number(from.lat), lon: Number(from.lon) }, { lat, lon }) : Number.isFinite(api) ? Math.round(api) : null;
    out.push({ id, name: str(s.name), lat: r5(lat), lon: r5(lon), distM: d, kind: stopKind(s.icon) });
  }
  return out.sort((a, b) => (a.distM ?? 1e9) - (b.distM ?? 1e9) || a.name.localeCompare(b.name)).slice(0, max);
}

const BUS_TRAM = /^(b|bus|t|tram|nfb|nft|nfo|kb|m|met|ex)$/i;
/** The line as people say it: «S12», «IC 5», «31» (bus and tram only their number). */
export function lineOf(cat, number) {
  const c = str(cat);
  const n = str(number);
  if (!n) return c;
  if (!c || BUS_TRAM.test(c) || n.toUpperCase().startsWith(c.toUpperCase())) return n;
  if (/^(s|sn|r|re)$/i.test(c) && /^\d+$/.test(n)) return `${c}${n}`;
  return `${c} ${n}`;
}

const zurichHm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
/** HH:MM in Zurich of a moment (ms). */
export const hmOf = (ms) => (Number.isFinite(ms) ? zurichHm.format(new Date(ms)) : '');

/** «2026-10-20T14:32:00+0200» or epoch seconds → ms, or null. */
export function timeMs(iso, ts) {
  const n = num(ts);
  if (Number.isFinite(n) && n > 0) return n * 1000;
  const s = str(iso).replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const ms = s ? Date.parse(s) : NaN;
  return Number.isFinite(ms) ? ms : null;
}

/**
 * The stationboard answer → { stop: { id, name } | null, departures: [{ at (ISO), time (HH:MM planned),
 * line, category, to, platform, platformChanged, delayMin, expected (HH:MM or '') }] } in time order.
 */
export function parseBoard(json, max = MAX_DEPARTURES) {
  const st = json?.station;
  const stop = st && okStopId(st.id) ? { id: str(st.id), name: str(st.name) } : null;
  const rows = Array.isArray(json?.stationboard) ? json.stationboard : [];
  const out = [];
  for (const r of rows) {
    const s = r?.stop ?? {};
    const ms = timeMs(s.departure, s.departureTimestamp);
    if (ms == null) continue;
    const planned = str(s.platform);
    const prog = str(s.prognosis?.platform);
    const progMs = timeMs(s.prognosis?.departure, null);
    let delay = num(s.delay);
    if (!Number.isFinite(delay)) delay = progMs != null ? Math.round((progMs - ms) / 60000) : 0;
    delay = Math.max(0, Math.round(delay));
    out.push({
      at: new Date(ms).toISOString(),
      time: hmOf(ms),
      line: lineOf(r.category, r.number),
      category: str(r.category),
      to: str(r.to),
      platform: prog || planned,
      platformChanged: !!prog && !!planned && prog !== planned,
      delayMin: delay,
      expected: delay ? hmOf(ms + delay * 60000) : '',
    });
  }
  out.sort((a, b) => a.at.localeCompare(b.at));
  return { stop, departures: out.slice(0, max) };
}

/** Is it an answer of ours (server or direct)? */
export const isStopsAnswer = (v) => !!v && Array.isArray(v.stops);
export const isBoardAnswer = (v) => !!v && Array.isArray(v.departures);

async function getJson(url, doFetch, timeout) {
  const ctl = typeof AbortController === 'undefined' ? null : new AbortController();
  const timer = ctl ? setTimeout(() => ctl.abort(), timeout) : null;
  try {
    const res = await doFetch(url, { headers: { Accept: 'application/json' }, ...(ctl ? { signal: ctl.signal } : {}) });
    if (!res?.ok) throw new Error(`ov ${res?.status}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Stops near a place. → { stops } (throws when the source does not answer; 'invalid' for a broken place). */
export async function ovStops({ lat, lon }, { doFetch = (...a) => fetch(...a), timeout = OV_TIMEOUT_MS, max = MAX_STOPS } = {}) {
  const url = stopsUrl(lat, lon);
  if (!url) throw new Error('invalid');
  return { stops: parseStops(await getJson(url, doFetch, timeout), { lat: Number(lat), lon: Number(lon) }, max) };
}

/** The next departures of a stop. → { stop, departures } */
export async function ovDepartures(id, { doFetch = (...a) => fetch(...a), timeout = OV_TIMEOUT_MS, limit = MAX_DEPARTURES } = {}) {
  const url = boardUrl(id, limit);
  if (!url) throw new Error('invalid');
  return parseBoard(await getJson(url, doFetch, timeout), limit);
}
