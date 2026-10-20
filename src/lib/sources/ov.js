/**
 * «Neue Quellen» › «ÖV in der Nähe» (Noah 20.10.2026 «Haltestellen und nächste Abfahrten»): the client of
 * api/lake.js ?action=ov-stops / ?action=ov-departures. The server first (Vercel's cache keeps stops 1 h,
 * departures 30 s); when it does not answer (offline preview, daily cap) the source directly with the same
 * code (api/_lib/ov.js; transport.opendata.ch is free, without a key). Only the position rounded to about
 * 100 m goes out. Live data: nothing is kept on the device. Tested in tests/quellen.test.js.
 */
import { ovStops, ovDepartures, isStopsAnswer, isBoardAnswer, okStopId, distM } from '../../../api/_lib/ov.js';

export { distM, lineOf, parseStops, parseBoard } from '../../../api/_lib/ov.js';
export const OV_URL = 'https://packgen-three.vercel.app/api/lake';

const r3 = (v) => Math.round(Number(v) * 1000) / 1000;

async function server(url, ok, fetcher) {
  try {
    const res = await fetcher(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const body = await res.json();
    return ok(body) ? body : null;
  } catch {
    return null;
  }
}

/** Stops near { lat, lon }, nearest first. → { stops, via: 'server'|'direct' }; throws when both fail. */
export async function loadStops(at, { fetcher = (...a) => fetch(...a) } = {}) {
  const lat = at?.lat == null || at.lat === '' ? NaN : Number(at.lat);
  const lon = at?.lon == null || at.lon === '' ? NaN : Number(at.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('invalid');
  const q = { lat: r3(lat), lon: r3(lon) };
  const body = await server(`${OV_URL}?action=ov-stops&lat=${q.lat}&lon=${q.lon}`, isStopsAnswer, fetcher);
  const here = { lat, lon };
  // the distances counted again from the exact place (only the rounded one went out)
  const near = (stops) => stops.map((s) => ({ ...s, distM: distM(here, s) })).sort((a, b) => a.distM - b.distM || a.name.localeCompare(b.name));
  if (body) return { stops: near(body.stops), via: 'server' };
  return { stops: near((await ovStops(q, { doFetch: fetcher })).stops), via: 'direct' };
}

/** The next departures of a stop. → { stop, departures, via } */
export async function loadDepartures(id, { fetcher = (...a) => fetch(...a) } = {}) {
  if (!okStopId(id)) throw new Error('invalid');
  const body = await server(`${OV_URL}?action=ov-departures&id=${id}`, isBoardAnswer, fetcher);
  if (body) return { ...body, via: 'server' };
  return { ...(await ovDepartures(id, { doFetch: fetcher })), via: 'direct' };
}

/** «120 m», «1.2 km» (num: the app's number format). */
export const distText = (m, num = (v) => String(v)) => (m == null ? '' : m < 1000 ? `${num(Math.round(m / 10) * 10)} m` : `${num(Math.round(m / 100) / 10)} km`);

/** Minutes from now until a departure (with its delay), at least 0. */
export const minutesUntil = (dep, now = Date.now()) => Math.max(0, Math.round((Date.parse(dep.at) + (dep.delayMin ?? 0) * 60000 - now) / 60000));
