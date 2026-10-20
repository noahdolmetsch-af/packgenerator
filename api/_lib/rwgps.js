/**
 * «Neue Quellen» (Noah 20.10.2026): a Ride with GPS link → the GPX of that route or ride. The pure parts
 * of /api/lake?action=rwgps, kept free of Node so the app can read the link with the same code.
 *
 * Ride with GPS gives every public route and ride as a GPX file without a key or an account:
 *   https://ridewithgps.com/routes/{id}.gpx?sub_format=track   (track points plus the route's POIs as <wpt>)
 *   https://ridewithgps.com/trips/{id}.gpx?sub_format=track
 * A route shared «with link» carries ?privacy_code=… in its link; it is passed on unchanged. A private
 * route answers with the login page (or 401/403): that is told as «not public». A browser cannot read
 * ridewithgps.com itself (no CORS), so the app asks its own server.
 */

export const RWGPS_BASE = 'https://ridewithgps.com';
export const RWGPS_TIMEOUT_MS = 10000;
/** The GPX of a route is refused above this (a phone would hang; route.js GPX_MAX_MB is the same). */
export const RWGPS_MAX_BYTES = 25 * 1024 * 1024;
export const KINDS = ['route', 'trip'];

const HOST = /^(?:www\.)?(?:ridewithgps\.com|rwgps\.com)$/i;
const ID = /^\d{1,12}$/;
const CODE = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * A pasted text (a link, or a share text with a link in it) → { kind: 'route'|'trip', id, privacy } or
 * null. Takes /routes/{id} and /trips/{id} (also with a slug, /edit, a query or a #fragment) and the
 * embed form /embeds?type=route&id={id}.
 */
export function parseRwgpsLink(text) {
  const s = String(text ?? '');
  for (const m of s.matchAll(/(?<![\w.@/:-])(?:https?:\/\/)?(?:www\.)?(?:ridewithgps|rwgps)\.com\/[^\s<>"']*/gi)) {
    const hit = linkOf(m[0].replace(/[.,;:!?)\]»”'"]+$/, ''));
    if (hit) return hit;
  }
  return null;
}

function linkOf(raw) {
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if ((u.protocol !== 'https:' && u.protocol !== 'http:') || u.username || u.password || !HOST.test(u.hostname)) return null;
  const code = u.searchParams.get('privacy_code') ?? '';
  const privacy = CODE.test(code) ? code : '';
  const m = u.pathname.match(/^\/(routes|trips)\/(\d{1,12})(?:[-/.][^]*)?$/i);
  if (m) return { kind: m[1].toLowerCase() === 'trips' ? 'trip' : 'route', id: m[2], privacy };
  if (/^\/embeds\/?$/i.test(u.pathname)) {
    const kind = (u.searchParams.get('type') ?? '').toLowerCase();
    const id = u.searchParams.get('id') ?? '';
    if (KINDS.includes(kind) && ID.test(id)) return { kind, id, privacy };
  }
  return null;
}

/** Checks the three values the server gets; → the clean ref or null. */
export function cleanRef({ kind, id, privacy = '' } = {}) {
  const k = String(kind ?? '').toLowerCase();
  const i = String(id ?? '');
  const p = String(privacy ?? '');
  if (!KINDS.includes(k) || !ID.test(i) || (p && !CODE.test(p))) return null;
  return { kind: k, id: i, privacy: p };
}

/** The GPX address of a ref. */
export function gpxUrl(ref) {
  const r = cleanRef(ref);
  if (!r) return '';
  const q = new URLSearchParams({ sub_format: 'track' });
  if (r.privacy) q.set('privacy_code', r.privacy);
  return `${RWGPS_BASE}/${r.kind}s/${r.id}.gpx?${q}`;
}

/** The file name the app shows and keeps (as for an uploaded file). */
export const fileNameOf = (ref) => `ridewithgps-${ref.kind}-${ref.id}.gpx`;

/** Is the text a GPX file (and not the login page)? */
export const looksLikeGpx = (text) => /<gpx[\s>]/i.test(String(text ?? '').slice(0, 4000));

export class RwgpsError extends Error {
  constructor(code, status = 0) {
    super(code);
    this.code = code; // 'invalid' | 'not_found' | 'not_public' | 'too_big' | 'unreachable'
    this.status = status;
  }
}

/** Fetch the GPX of a ref. → { gpx, file }; throws RwgpsError. */
export async function fetchRwgps(ref, { doFetch = (...a) => fetch(...a), timeout = RWGPS_TIMEOUT_MS } = {}) {
  const r = cleanRef(ref);
  if (!r) throw new RwgpsError('invalid');
  const ctl = typeof AbortController === 'undefined' ? null : new AbortController();
  const timer = ctl ? setTimeout(() => ctl.abort(), timeout) : null;
  let res;
  let text = '';
  try {
    res = await doFetch(gpxUrl(r), { redirect: 'follow', headers: { Accept: 'application/gpx+xml, application/xml;q=0.9, */*;q=0.5' }, ...(ctl ? { signal: ctl.signal } : {}) });
    if (res?.status === 404) throw new RwgpsError('not_found', 404);
    if (res?.status === 401 || res?.status === 403) throw new RwgpsError('not_public', res.status);
    if (!res?.ok) throw new RwgpsError('unreachable', res?.status ?? 0);
    const size = Number(res.headers?.get?.('content-length'));
    if (size > RWGPS_MAX_BYTES) throw new RwgpsError('too_big');
    text = await res.text();
  } catch (err) {
    if (err instanceof RwgpsError) throw err;
    throw new RwgpsError('unreachable');
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (text.length > RWGPS_MAX_BYTES) throw new RwgpsError('too_big');
  // a private route answers 200 with the login page after the redirect
  if (!looksLikeGpx(text)) throw new RwgpsError('not_public');
  return { gpx: text, file: fileNameOf(r) };
}
