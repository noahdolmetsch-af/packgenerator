/**
 * /api/news (Paket Q #148 «Hinweise und News-Feed», Noah 19.10.2026 «1a 2a»): a browser cannot read
 * other sites' feeds, so this small function reads them for the app. No key, no storage, free.
 *
 *   GET ?feed=<https address>   → { ok, title, items: [{ title, link, date }] }   (RSS or Atom)
 *   GET ?alerts=weather         → { ok, warnings: [...] }  MeteoSwiss warnings via MeteoAlarm (Atom, CAP)
 *   GET ?alerts=avalanche       → { ok, level, link }       highest danger level of the SLF bulletin
 *
 * At most 1.5 MB per answer, 6 seconds; only https addresses of public host names.
 */
import { route, json, ApiError } from './_lib/core.js';
import { parseFeed, parseWarnings, avalancheLevel, safeFeedUrl } from './_lib/news.js';

export const TIMEOUT_MS = 6000;
export const MAX_BYTES = 1_500_000;
export const WEATHER_FEED = 'https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-switzerland';
export const AVALANCHE_JSON = 'https://aws.slf.ch/api/bulletin/caaml/de/json';
export const AVALANCHE_PAGE = 'https://www.slf.ch/de/lawinenbulletin-und-schneesituation/';
const UA = 'PackGenerator-news/1.0 (+https://noahdolmetsch-af.github.io/packgenerator/)';

export function makeHandler({ doFetch = (...a) => fetch(...a), timeout = TIMEOUT_MS } = {}) {
  async function get(url, accept) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await doFetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': UA, Accept: accept } });
      if (!res.ok) throw new ApiError(502, 'source_failed', `The source answered ${res.status}.`);
      const text = await res.text();
      if (text.length > MAX_BYTES) throw new ApiError(502, 'too_big', 'The source is too big.');
      return text;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, 'source_unreachable', 'The source did not answer.');
    } finally {
      clearTimeout(timer);
    }
  }

  return route(
    {
      GET: async (request) => {
        const q = new URL(request.url).searchParams;
        const alerts = q.get('alerts');
        if (alerts === 'weather') return json(request, 200, { ok: true, warnings: parseWarnings(await get(WEATHER_FEED, 'application/atom+xml, application/xml')) });
        if (alerts === 'avalanche') {
          let data = null;
          try {
            data = JSON.parse(await get(AVALANCHE_JSON, 'application/json'));
          } catch {
            data = null;
          }
          return json(request, 200, { ok: true, level: avalancheLevel(data), link: AVALANCHE_PAGE });
        }
        const url = safeFeedUrl(q.get('feed') ?? '');
        if (!url) throw new ApiError(400, 'bad_address', 'Only https addresses of public sites.');
        const feed = parseFeed(await get(url, 'application/rss+xml, application/atom+xml, application/xml, text/xml'));
        return json(request, 200, { ok: true, ...feed });
      },
    },
    'news',
  );
}

const handler = makeHandler();
export const GET = handler;
export const OPTIONS = handler;
