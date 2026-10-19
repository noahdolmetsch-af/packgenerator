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
 */
import { route, json, ApiError } from './_lib/core.js';
import { lakeNow } from './_lib/lake.js';

export const CACHE = 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600';

export function makeHandler({ doFetch = (...a) => fetch(...a), clock = () => new Date(), timeout } = {}) {
  return route(
    {
      GET: async (request) => {
        const step = new URL(request.url).searchParams.get('step') ?? 'now';
        if (step !== 'now') throw new ApiError(400, 'unknown_step', 'Use ?step=now.');
        let body;
        try {
          body = await lakeNow({ doFetch, now: clock(), ...(timeout ? { timeout } : {}) });
        } catch {
          throw new ApiError(502, 'source_unreachable', 'The lake data could not be fetched right now.');
        }
        return json(request, 200, body, { 'Cache-Control': CACHE });
      },
    },
    'lake',
  );
}

const handler = makeHandler();
export const GET = handler;
export const OPTIONS = handler;
