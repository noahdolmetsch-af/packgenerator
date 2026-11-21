/**
 * TrainingPeaks-Plan (Noah 19.11.2026 «2b», Thread «Bauen: TrainingPeaks-Plan und Zwift»): the calendar link of
 * TrainingPeaks (a private ICS feed with the planned workouts) read for the app, the same way as the Spielerplus
 * calendar. A browser cannot read another site's answer, so this asks for the app. Called by api/linkcheck.js (the
 * free Vercel plan allows 12 functions, so no file of its own):
 *
 *   POST /api/linkcheck?a=trainingpeaks  { url } → { ics }   the calendar file as text (at most 1.5 MB)
 *
 * The link holds a private key. So: POST (the key never stands in an address that Vercel logs), only addresses
 * of (www.)trainingpeaks.com with a path /ical/<key>.ics (anything else: 400, so this is no open proxy), nothing
 * is stored, nothing is logged (route() logs only the kind of an error), 8 seconds at most. Read-only: it only
 * asks for the calendar file.
 *
 * Redirects (Noah 21.11.2026: his real link was refused): followed by hand, at most 3, only to https on a host of
 * trainingpeaks.com (no user, no port), so it still is no open proxy. The answer says which kind of refusal it was,
 * with the status number (never the link or the key): 404/410/401 link_invalid, 403 refused (TrainingPeaks does not
 * let the server in), a redirect elsewhere or too many redirect, any other error page_error.
 *
 * The shape of a real link is https://www.trainingpeaks.com/ical/<key>.ics (webcal:// in TrainingPeaks; checked with
 * Noah's link 21.11.2026): fixed host, fixed start and end of the path, key of letters, digits, - and _.
 */
import { json, ApiError } from './core.js';

export const FILE_MAX = 1_500_000;
const UA = 'PackGenerator-trainingpeaks/1.0 (+https://noahdolmetsch-af.github.io/packgenerator/)';
export const MAX_REDIRECTS = 3;

/** The one kind of address allowed: https://(www.)trainingpeaks.com/ical/<key>.ics → URL, or null. */
export function trainingpeaksUrl(raw) {
  let u;
  try {
    u = new URL(String(raw ?? '').trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  if (!/^(www\.)?trainingpeaks\.com$/i.test(u.hostname)) return null;
  if (!/^\/ical\/[\w-]{3,128}\.ics$/i.test(u.pathname)) return null;
  if (u.search.length > 200) return null;
  return u;
}

/** A redirect target that may be followed: https on (a subdomain of) trainingpeaks.com, no user, no port → URL, or null. */
export function redirectTarget(location, from) {
  if (!String(location ?? '').trim()) return null;
  let u;
  try {
    u = new URL(String(location).trim(), from);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  return /(^|\.)trainingpeaks\.com$/i.test(u.hostname) ? u : null;
}

/** Ask for the file and follow up to MAX_REDIRECTS redirects by hand. → the last Response; errors say the status only. */
async function get(doFetch, first, signal) {
  let url = first;
  for (let hop = 0; ; hop++) {
    const res = await doFetch(url.href, { redirect: 'manual', signal, headers: { 'User-Agent': UA, Accept: 'text/calendar,text/plain,*/*' } });
    if (!(res.status >= 300 && res.status < 400)) return res;
    const next = res.headers.get('location') ? redirectTarget(res.headers.get('location'), url) : null;
    if (!next) throw new ApiError(502, 'redirect_other', `TrainingPeaks sent the app somewhere else (answer ${res.status}).`, { status: res.status });
    if (hop >= MAX_REDIRECTS) throw new ApiError(502, 'redirect_loop', 'TrainingPeaks sent the app around in circles.', { status: res.status });
    url = next;
  }
}

/** The POST of /api/linkcheck?a=trainingpeaks: body { url } → { ics }. doFetch and timeout come from the caller (tests). */
export async function readPlan(request, { doFetch, timeout }) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, 'bad_request', 'Send the calendar link as JSON: { "url": "…" }.');
  }
  const url = trainingpeaksUrl(body?.url);
  if (!url) throw new ApiError(400, 'not_allowed', 'Only the calendar link of TrainingPeaks (…/ical/<key>.ics) can be read.');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    let res;
    try {
      res = await get(doFetch, url, ctl.signal);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, 'unreachable', 'TrainingPeaks does not answer.');
    }
    if (res.status === 403) throw new ApiError(502, 'refused', 'TrainingPeaks does not let the server read this calendar (answer 403).', { status: 403 });
    if (res.status === 401 || res.status === 404 || res.status === 410) throw new ApiError(502, 'link_invalid', `TrainingPeaks does not give a calendar for this link any more (answer ${res.status}).`, { status: res.status });
    if (!res.ok) throw new ApiError(502, 'page_error', `TrainingPeaks answered ${res.status}.`, { status: res.status });
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
