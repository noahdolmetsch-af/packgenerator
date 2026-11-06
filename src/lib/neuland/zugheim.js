/**
 * «Zug hin, Velo heim» (Träume und Neuland N7, Noah 27.10.2026 «1-5 a»): take the train to a place in an area
 * you do not know, then ride home through New ground. On Touren › Träume, with a choice of how far to ride.
 *
 * - Starts: municipalities of Neuland you have never reached, about the chosen ride away (straight line, roads
 *   ROAD_FACTOR longer), in different directions; the most new municipalities around them first.
 * - Train time per place when the part is shown (Noah 05.11.2026 «a»), the rest on a tap only: transport.opendata.ch (free, no account, as «Nach Hause») for the
 *   nearest stations and the next trains from home there, and the free bike router (BRouter) for the way home.
 * Pure helpers plus askTrains/askRideHome (a fetcher is passed in). Tested in tests/zugheim.test.js.
 */
import { km } from './geo.js';
import { pointOf } from './tipps.js';
import { bearing, sectorOf, ROAD_FACTOR, LEVELS, minutesOf } from '../ueberraschung.js';
import { brouterUrl, parseBrouter } from '../reroute.js';
import { stationsUrl, connectionsUrl, nearestStation, parseConnections } from '../unterwegs/heimweg.js';

export const RIDE_KM = [40, 60, 80, 120];
export const RIDE_KM_STD = 60;
/** Around a start, the municipalities within this many km count as «new around it». */
export const AROUND_KM = 8;
const KMH = LEVELS.find((l) => l.key === 'curious')?.kmh ?? 19;

/** The ride home in minutes, estimated from its road km (no climb known yet) at the speed of «Curious». */
export const bikeMinutes = (rideKm) => minutesOf(rideKm, 0, KMH);

/**
 * The shortest ride time of the next trains from home to a start (minutes) or null; asked online, so the caller
 * decides when (Noah 05.11.2026 «a»: when the part is shown). Remembered per day by the caller.
 */
export async function trainMinutes(home, start, { fetcher = fetch } = {}) {
  const { trains } = await askTrains(home, start, { fetcher });
  const mins = trains.map((c) => c.min).filter((m) => Number.isFinite(m) && m > 0);
  return mins.length ? Math.min(...mins) : null;
}

/**
 * Up to n starts: [{ id, name, lat, lon, km (straight), rideKm (on roads), around (new municipalities near), sector }].
 * collections: computeFrom(...).collections (needs 'municipalities'); home { lat, lon }; rideKm: the ride home.
 */
export function trainStarts(collections = [], home, { rideKm = RIDE_KM_STD, n = 3 } = {}) {
  const H = [Number(home?.lat), Number(home?.lon)];
  if (!H.every(Number.isFinite)) return [];
  const c = collections.find((x) => x.id === 'municipalities');
  if (!c) return [];
  const fresh = [];
  for (const it of c.items ?? []) {
    if (c.visited?.has?.(it.id)) continue;
    const p = pointOf(it);
    if (p) fresh.push({ it, p });
  }
  const far = rideKm / ROAD_FACTOR;
  const cands = [];
  for (const { it, p } of fresh) {
    const d = km(H, p);
    if (d < far * 0.75 || d > far * 1.1) continue;
    const around = fresh.filter((o) => km(p, o.p) <= AROUND_KM).length;
    const sector = sectorOf(bearing({ lat: H[0], lon: H[1] }, { lat: p[0], lon: p[1] }));
    cands.push({ id: it.id, name: it.name, lat: p[0], lon: p[1], km: Math.round(d * 10) / 10, rideKm: Math.round(d * ROAD_FACTOR), around, sector });
  }
  cands.sort((a, b) => b.around - a.around || a.name.localeCompare(b.name));
  const out = [];
  for (const x of cands) {
    if (out.length >= n) break;
    if (!out.some((o) => o.sector === x.sector)) out.push(x);
  }
  for (const x of cands) {
    if (out.length >= n) break;
    if (!out.includes(x)) out.push(x);
  }
  return out;
}

const getJson = async (fetcher, url) => {
  let res;
  try {
    res = await fetcher(url);
  } catch {
    throw new Error('failed');
  }
  if (res.status === 429 || res.status === 503) throw new Error('busy');
  if (!res.ok) throw new Error('failed');
  return res.json();
};

/**
 * The next trains from the station nearest home to the station nearest the start.
 * → { from: station, to: station, trains: [connection] } (parseConnections); throws 'nostation', 'busy', 'failed'.
 */
export async function askTrains(home, start, { fetcher = fetch } = {}) {
  const [a, b] = await Promise.all([getJson(fetcher, stationsUrl(home)), getJson(fetcher, stationsUrl(start))]);
  const from = nearestStation(a);
  const to = nearestStation(b);
  if (!from || !to) throw new Error('nostation');
  const trains = parseConnections(await getJson(fetcher, connectionsUrl(from.id ?? from.name, to.id ?? to.name)));
  return { from, to, trains };
}

/** The way home by bike from the start: { line, km, gainM, min } (min at the speed of «Curious»); throws 'busy', 'noroute', 'failed'. */
export async function askRideHome(start, home, { fetcher = fetch, profile = 'trekking' } = {}) {
  let res;
  try {
    res = await fetcher(brouterUrl([start, home], profile));
  } catch {
    throw new Error('failed');
  }
  if (res.status === 429 || res.status === 503) throw new Error('busy');
  if (!res.ok) throw new Error(res.status === 400 || res.status === 500 ? 'noroute' : 'failed');
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('noroute');
  }
  const r = parseBrouter(json);
  if (!r) throw new Error('noroute');
  return { ...r, min: minutesOf(r.km, r.gainM, KMH) };
}
