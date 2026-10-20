/**
 * «Neue Quellen» › Ride with GPS (Noah 20.10.2026 «Link einfügen und als Datei»): a pasted Ride with GPS
 * link → the GPX text, through the app's own server (api/lake.js ?action=rwgps; ridewithgps.com cannot
 * be read from a browser). The GPX is then read on the device like an uploaded file
 * (route/fromgpx.js routeFromGpx for a trip, live/liveroute.js liveRouteFromText for the live map).
 * Only the route number (and the privacy code of a shared link) goes to the server; nothing is stored there.
 * Tested in tests/quellen.test.js.
 */
import { parseRwgpsLink, looksLikeGpx } from '../../../api/_lib/rwgps.js';
import { t } from '../i18n.svelte.js';

export { parseRwgpsLink };
export const RWGPS_URL = 'https://packgen-three.vercel.app/api/lake?action=rwgps';

/** The server address for a ref. */
export function rwgpsApiUrl(ref) {
  const q = new URLSearchParams({ kind: ref.kind, id: ref.id });
  if (ref.privacy) q.set('privacy', ref.privacy);
  return `${RWGPS_URL}&${q}`;
}

/** The plain message for a server error code. */
export function rwgpsMessage(code, online = true) {
  if (!online) return t('No connection. Loading from Ride with GPS needs the internet.');
  switch (code) {
    case 'invalid':
      return t('This is not a Ride with GPS link. Paste a link like ridewithgps.com/routes/12345.');
    case 'not_found':
      return t('Ride with GPS does not know this route. Check the link.');
    case 'not_public':
      return t('This route is private on Ride with GPS. Make it public or share it with a link, or download the GPX there and add it as a file.');
    case 'too_big':
      return t('This route is too big to load.');
    case 'daily_cap':
      return t('The server has done enough for today. Download the GPX on Ride with GPS and add it as a file.');
    default:
      return t('Ride with GPS is not answering right now. Try again later, or add the GPX as a file.');
  }
}

/**
 * A pasted text → { gpx, file, ref }. Throws an Error with a plain message (the code on err.code).
 */
export async function fetchRwgpsGpx(text, { fetcher = (...a) => fetch(...a), online = typeof navigator === 'undefined' ? true : navigator.onLine } = {}) {
  const ref = parseRwgpsLink(text);
  const fail = (code) => Object.assign(new Error(rwgpsMessage(code, online || code === 'invalid')), { code });
  if (!ref) throw fail('invalid');
  let res;
  try {
    res = await fetcher(rwgpsApiUrl(ref), { headers: { Accept: 'application/json' } });
  } catch {
    throw fail('unreachable');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw fail(body?.code || 'unreachable');
  if (typeof body?.gpx !== 'string' || !looksLikeGpx(body.gpx)) throw fail('unreachable');
  return { gpx: body.gpx, file: body.file || `ridewithgps-${ref.kind}-${ref.id}.gpx`, ref };
}
