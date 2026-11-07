/**
 * Spielerplus-Kalender (Noah 06.11.2026 «1a», Thread «Planen: Kalender abonnieren und Training anmelden»):
 * the calendar link of Spielerplus (a private ICS feed) read for the app. A browser cannot read another
 * site's answer, so this asks for the app. Called by api/linkcheck.js (the free Vercel plan allows 12
 * functions, so no file of its own):
 *
 *   POST /api/linkcheck?a=spielerplus  { url } → { ics }   the calendar file as text (at most 1.5 MB)
 *
 * The link holds a private key (?t=…&u=…). So: POST (the key never stands in an address that Vercel
 * logs), only addresses of spielerplus.de with the path /events/ics and both keys (anything else: 400, so
 * this is no open proxy), no redirect is followed, nothing is stored, nothing is logged (route() logs only
 * the kind of an error), 8 seconds at most. Read-only: it only asks for the calendar file.
 */
import { json, ApiError } from './core.js';

export const FILE_MAX = 1_500_000;
const UA = 'PackGenerator-spielerplus/1.0 (+https://noahdolmetsch-af.github.io/packgenerator/)';

/** The one kind of address allowed: https://(www.)spielerplus.de/events/ics?t=…&u=… → URL, or null. */
export function spielerplusUrl(raw) {
  let u;
  try {
    u = new URL(String(raw ?? '').trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  if (!/^(www\.)?spielerplus\.de$/i.test(u.hostname)) return null;
  if (u.pathname.replace(/\/+$/, '') !== '/events/ics') return null;
  const key = /^[\w-]{3,64}$/;
  if (!key.test(u.searchParams.get('t') ?? '') || !key.test(u.searchParams.get('u') ?? '')) return null;
  return u;
}

/** The POST of /api/linkcheck?a=spielerplus: body { url } → { ics }. doFetch and timeout come from the caller (tests). */
export async function readCalendar(request, { doFetch, timeout }) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, 'bad_request', 'Send the calendar link as JSON: { "url": "…" }.');
  }
  const url = spielerplusUrl(body?.url);
  if (!url) throw new ApiError(400, 'not_allowed', 'Only the calendar link of Spielerplus (…/events/ics?t=…&u=…) can be read.');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    let res;
    try {
      res = await doFetch(url.href, { redirect: 'manual', signal: ctl.signal, headers: { 'User-Agent': UA, Accept: 'text/calendar,text/plain,*/*' } });
    } catch {
      throw new ApiError(502, 'unreachable', 'Spielerplus does not answer.');
    }
    if ((res.status >= 300 && res.status < 400) || res.status === 401 || res.status === 403 || res.status === 404) throw new ApiError(502, 'link_invalid', 'Spielerplus does not give a calendar for this link any more.');
    if (!res.ok) throw new ApiError(502, 'page_error', `Spielerplus answered ${res.status}.`);
    if (Number(res.headers.get('content-length') ?? 0) > FILE_MAX) throw new ApiError(413, 'too_big', 'The calendar is too big.');
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length > FILE_MAX) throw new ApiError(413, 'too_big', 'The calendar is too big.');
    const ics = new TextDecoder('utf-8').decode(buf);
    if (!/BEGIN:VCALENDAR/i.test(ics)) throw new ApiError(422, 'not_calendar', 'The answer is not a calendar file.');
    return json(request, 200, { ics });
  } finally {
    clearTimeout(timer);
  }
}
