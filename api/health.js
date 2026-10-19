/**
 * GET /api/health (Paket B «Server», der Wächter, Noah 18.10.2026 «3a und b»): one line per check of the
 * server, never a value. 200 when everything is ok (or skipped), 503 when a check fails.
 * Logic and the list of checks: api/_lib/health.js. Asked daily by .github/workflows/waechter.yml.
 */
import { route, json } from './_lib/core.js';
import { makeHealth } from './_lib/health.js';

export function makeHandler(opts = {}) {
  const health = makeHealth(opts);
  return route({ GET: async (request) => {
    const r = await health();
    return json(request, r.ok ? 200 : 503, r);
  } }, 'health');
}

const handler = makeHandler();
export const GET = handler;
export const OPTIONS = handler;
