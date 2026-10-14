/**
 * /api/linkcheck (BF7 «Wartungs-Check», Noah 13.10.2026): is an outside address the app shows or needs
 * still there? A browser cannot read another site's answer, so this asks for the app.
 *
 *   GET ?u=<address>  → { ok, status }  (only the addresses of LINK_CHECKS; anything else: 400)
 *
 * HEAD first, GET when HEAD is refused (some servers answer 403/405 to HEAD); 5 seconds at most.
 * No key, no storage: it only says whether the address answers. A redirect that ends well counts as ok.
 */
import { route, json, ApiError } from './_lib/core.js';
import { LINK_CHECKS } from './_lib/links.js';

export const TIMEOUT_MS = 5000;
const UA = 'PackGenerator-linkcheck/1.0 (+https://noahdolmetsch-af.github.io/packgenerator/)';

export function makeHandler({ doFetch = (...a) => fetch(...a), timeout = TIMEOUT_MS } = {}) {
  async function probe(url, method) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await doFetch(url, { method, redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': UA } });
      return res.status;
    } catch {
      return 0; // no answer (or too slow)
    } finally {
      clearTimeout(timer);
    }
  }

  return route(
    {
      GET: async (request) => {
        const u = new URL(request.url).searchParams.get('u') ?? '';
        if (!LINK_CHECKS.includes(u)) throw new ApiError(400, 'not_allowed', 'Only the addresses of the app can be checked.');
        let status = await probe(u, 'HEAD');
        if (!(status >= 200 && status < 400)) {
          const again = await probe(u, 'GET');
          if (again) status = again;
        }
        return json(request, 200, { ok: status >= 200 && status < 400, status });
      },
    },
    'linkcheck',
  );
}

const handler = makeHandler();
export const GET = handler;
export const OPTIONS = handler;
