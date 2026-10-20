/**
 * GET /api/lake?step=now (Paket G, #9 «Seetemperatur Zürichsee», Noah 19.10.2026): the water of Lake
 * Zurich for the app, public data, no key and no storage.
 *
 *   → { at, now: { at, water, air? } | null, days: [{ day, min, max, mean, n }] (last 30 days of the
 *       measurement Stadt Zürich, Mythenquai, per Zurich day), forecast: [{ day, water, min, max }]
 *       (next days of the Eawag Alplakes model, [] when it is not there), sources }
 *
 * The daily values are summed up here so the answer stays small. Vercel's cache keeps an answer for
 * 30 minutes (the city measures every 10). 502 only when neither source answers.
 * Logic: api/_lib/lake.js.
 *
 * «Neue Quellen» (Noah 20.10.2026): the same function also fetches other public data without a key,
 * because the Vercel plan allows only 12 functions (?action= picks it; no action: the lake as before):
 *   ?action=rwgps&kind=route|trip&id=…[&privacy=…]  → { gpx, file }   (api/_lib/rwgps.js)
 *   ?action=ov-stops&lat=…&lon=…                    → { stops }       (api/_lib/ov.js, transport.opendata.ch)
 *   ?action=ov-departures&id=…                      → { stop, departures }
 */
import { route, json, ApiError } from './_lib/core.js';
import { lakeNow } from './_lib/lake.js';
import { fetchRwgps, cleanRef, RwgpsError } from './_lib/rwgps.js';
import { ovStops, ovDepartures, okStopId } from './_lib/ov.js';

export const CACHE = 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600';
export const RWGPS_CACHE = 'public, max-age=300, s-maxage=600';
export const STOPS_CACHE = 'public, max-age=600, s-maxage=3600';
export const BOARD_CACHE = 'public, max-age=20, s-maxage=30';
export const ACTIONS = ['rwgps', 'ov-stops', 'ov-departures'];

const RWGPS_ERRORS = {
  invalid: [400, 'Use ?action=rwgps&kind=route|trip&id=<number>.'],
  not_found: [404, 'Ride with GPS does not know this route.'],
  not_public: [403, 'This route is not public on Ride with GPS.'],
  too_big: [413, 'This route is too big.'],
  unreachable: [502, 'Ride with GPS could not be reached right now.'],
};

export function makeHandler({ doFetch = (...a) => fetch(...a), clock = () => new Date(), timeout, capStore } = {}) {
  const opts = capStore === undefined ? {} : { capStore };
  const t = timeout ? { timeout } : {};
  const lake = route(
    {
      GET: async (request) => {
        const step = new URL(request.url).searchParams.get('step') ?? 'now';
        if (step !== 'now') throw new ApiError(400, 'unknown_step', 'Use ?step=now.');
        let body;
        try {
          body = await lakeNow({ doFetch, now: clock(), ...t });
        } catch {
          throw new ApiError(502, 'source_unreachable', 'The lake data could not be fetched right now.');
        }
        return json(request, 200, body, { 'Cache-Control': CACHE });
      },
    },
    'lake',
    opts,
  );

  const rwgps = route(
    {
      GET: async (request) => {
        const q = new URL(request.url).searchParams;
        const ref = cleanRef({ kind: q.get('kind') ?? 'route', id: q.get('id') ?? '', privacy: q.get('privacy') ?? '' });
        if (!ref) throw new ApiError(400, 'invalid', RWGPS_ERRORS.invalid[1]);
        try {
          const body = await fetchRwgps(ref, { doFetch, ...t });
          return json(request, 200, body, { 'Cache-Control': RWGPS_CACHE });
        } catch (err) {
          const code = err instanceof RwgpsError && RWGPS_ERRORS[err.code] ? err.code : 'unreachable';
          throw new ApiError(RWGPS_ERRORS[code][0], code, RWGPS_ERRORS[code][1]);
        }
      },
    },
    'rwgps',
    opts,
  );

  const ov = route(
    {
      GET: async (request) => {
        const q = new URL(request.url).searchParams;
        if (q.get('action') === 'ov-stops') {
          const lat = Number(q.get('lat'));
          const lon = Number(q.get('lon'));
          if (!q.get('lat') || !q.get('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new ApiError(400, 'invalid', 'Use ?action=ov-stops&lat=…&lon=….');
          try {
            return json(request, 200, await ovStops({ lat, lon }, { doFetch, ...t }), { 'Cache-Control': STOPS_CACHE });
          } catch {
            throw new ApiError(502, 'source_unreachable', 'The timetable could not be reached right now.');
          }
        }
        const id = q.get('id') ?? '';
        if (!okStopId(id)) throw new ApiError(400, 'invalid', 'Use ?action=ov-departures&id=<stop number>.');
        try {
          return json(request, 200, await ovDepartures(id, { doFetch, ...t }), { 'Cache-Control': BOARD_CACHE });
        } catch {
          throw new ApiError(502, 'source_unreachable', 'The timetable could not be reached right now.');
        }
      },
    },
    'ov',
    opts,
  );

  return (request) => {
    const action = new URL(request.url).searchParams.get('action');
    if (action == null) return lake(request);
    if (action === 'rwgps') return rwgps(request);
    if (action === 'ov-stops' || action === 'ov-departures') return ov(request);
    if (request.method === 'OPTIONS') return lake(request);
    return json(request, 400, { error: 'unknown_action', code: 'unknown_action', message: `Use ?action=${ACTIONS.join(', ')} or no action.` });
  };
}

const handler = makeHandler();
export const GET = handler;
export const OPTIONS = handler;
